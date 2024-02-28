import neo4j from "neo4j-driver";
import fs from "fs";

const driver = neo4j.driver(
  process.env.DUMMY_DATA_CONNECTION_URI,
  neo4j.auth.basic(
    process.env.DUMMY_DATA_USERNAME,
    process.env.DUMMY_DATA_PASSWORD
  )
);

function simplifyPaths(path) {
  var prevtrain = 0;
  var newPath = [];
  path.forEach((element) => {
    if (element.type == "node") {
      newPath.push(element);
    } else if (element.type == "path" && element.mode == "train") {
      var currenttrain = element.properties.TrainNumber;
      // console.log(currenttrain, prevtrain);
      if (currenttrain !== prevtrain) {
        newPath.push(element);
        prevtrain = currenttrain;
      } else {
        let removedNode = newPath.pop();
        // console.log("removed node: ", removedNode);
      }
    }
  });

  // console.log(newPath);
  return newPath;
}

async function getPaths(src, dst) {
  const session = driver.session();

  const query2 = `MATCH path = (n1:City {cityName: "${src}"})-[rels:TrainTo*1..3]-(n2:City {cityName: "${dst}"}) 
  WITH path, [idx IN RANGE(0, SIZE(rels)-1) | 
    CASE WHEN startNode(relationships(path)[idx]) = nodes(path)[idx] THEN 1 ELSE 0 END] AS directions
  RETURN path, directions`;
  // WHERE ALL(idx in range(0, size(rels)-2) WHERE (rels[idx]).DepartureTime < (rels[idx+1]).ArrivalTime)
  // RETURN paths

  const response = await session.run(query2);
  console.log(response);

  const res = JSON.stringify(response);
  fs.writeFileSync("paths.json", res);

  const resultingPaths = {
    source: src,
    destination: dst,
    paths: [],
  };

  await Promise.all(
    response.records.map(async (record, index) => {
      resultingPaths.paths[index] = new Array();
      let startNode = {};
      startNode.type = "node";
      startNode.properties = record._fields[0].start.properties;

      resultingPaths.paths[index].push(startNode);

      var prevtrain = 0;

      for (let i = 0; i < record._fields[0].segments.length; i++) {
        let segment = record._fields[0].segments[i];
        // console.log(segment, i);
        let path = {};
        let nextNode = {};
        path.type = "path";
        nextNode.type = "node";

        path.mode = segment.relationship.type.toLowerCase();
        path.properties = segment.relationship.properties;
        nextNode.properties = segment.end.properties;

        if (path.mode == "trainto") {
          var currenttrain = path?.properties.TrainNumber;
          if (currenttrain !== prevtrain) {
            resultingPaths.paths[index].push(path);
            prevtrain = currenttrain;
          } else {
            let removedNode = resultingPaths.paths[index].pop();
            let removedPath = resultingPaths.paths[index].pop();

            // console.log(i);
            const searchStation =
              record._fields[1][i].low === 0
                ? removedPath.properties.StationFrom
                : removedPath.properties.StationTo;

            // console.log(searchStation, record._fields[1][i].low);

            const interdata = await searchTime(
              path.properties.TrainNumber,
              searchStation // should to StationTo for backtracking path and From for normal ones, so need to find whether normal or backtracking using times first
            );

            const changes = {
              type: path.type,
              mode: path.mode,
              properties: {
                DepartureTime: interdata.dt,
                StationFrom: interdata.code,
                TrainNumber: path.properties.TrainNumber,
                StationTo: path.properties.StationTo,
                ArrivalTime: path.properties.ArrivalTime,
                DayCount: path.properties.DayCount,
                Frequency: path.properties.Frequency,
              },
            };
            // console.log(path, "changes to ", changes);
            // path.properties.DepartureTime = interdata.dt;
            // path.properties.StationFrom = interdata.code;

            // const changedpath = { ...path, ...changes };

            resultingPaths.paths[index].push(changes);
          }
        }

        resultingPaths.paths[index].push(nextNode);
      }
    })
  );

  // // return new Promise((resolve) => {
  // response.records.forEach((record, index) => {
  //   resultingPaths.paths[index] = new Array(); //one way/path
  //   let startNode = {};
  //   startNode.type = "node";
  //   startNode.properties = record._fields[0].start.properties;

  //   resultingPaths.paths[index].push(startNode); //adding the firstnode into the array

  //   var prevtrain = 0;
  //   // var newPath = [];
  //   record._fields[0].segments.forEach((segment, i) => {
  //     // return new Promise((resolve) => {
  //     //node,path,node till we reach destination
  //     let path = {};
  //     let nextNode = {};
  //     path.type = "path";
  //     nextNode.type = "node";

  //     path.mode = segment.relationship.type.toLowerCase();
  //     path.properties = segment.relationship.properties;
  //     nextNode.properties = segment.end.properties;

  //     if (path.mode == "trainto") {
  //       var currenttrain = path?.properties.TrainNumber;
  //       // console.log(currenttrain, prevtrain);
  //       if (currenttrain !== prevtrain) {
  //         // newPath.push(element);
  //         resultingPaths.paths[index].push(path);
  //         prevtrain = currenttrain;
  //         resolve(); //adding the path and the next node for a path
  //       } else {
  //         let removedNode = resultingPaths.paths[index].pop();
  //         let removedPath = resultingPaths.paths[index].pop();

  //         searchTime(
  //           path.properties.TrainNumber,
  //           removedNode.properties.cityName
  //         ).then((interdata) => {
  //           path.properties.DepartureTime = interdata.dt;
  //           path.properties.StationFrom = interdata.code;

  //           resultingPaths.paths[index].push(path);
  //         });

  //         // console.log("removed path: ", removedNode);
  //         // console.log("removed path: ", removedNode, removedPath);
  //       }
  //     }
  //     // resolve({ path, nextNode });
  //     resultingPaths.paths[index].push(nextNode);
  //     // });
  //   });
  // });

  console.log(resultingPaths);

  // fs.writeFileSync("./response.txt", JSON.stringify(resultingPaths));

  await session.close();
  // await driver.close();

  return resultingPaths;
  // });
}

async function removeUnwanted(paths) {
  return {
    ...paths,
    paths: paths.paths.filter((path, index, array) => {
      // Use indexOf to check if the current path is the first occurrence in the array
      return (
        //remove TTT mdoels
        path.length <= 5 &&
        // remove duplicates
        array.findIndex(
          (item) => JSON.stringify(item) === JSON.stringify(path)
        ) === index
      );
    }),
  };
}

async function searchTime(trainNum, city) {
  // console.log(city);
  // const driver = neo4j.driver(
  //   process.env.DUMMY_DATA_CONNECTION_URI,
  //   neo4j.auth.basic(
  //     process.env.DUMMY_DATA_USERNAME,
  //     process.env.DUMMY_DATA_PASSWORD
  //   )
  // );

  const session = driver.session();

  const query = `MATCH paths = (n1:City)-[rel:TrainTo {TrainNumber:"${trainNum}",StationFrom:"${city}"}]->(n2:City) RETURN rel LIMIT 1`;
  const response = await session.run(query);
  console.log(city, response);
  const props = response.records[0]._fields[0].properties;

  await session.close();

  return { dt: props.DepartureTime, code: props.StationFrom };
}

// async function filterTime(data) {

//   data.paths.forEach((path, i) => {

//     var valid = true;

//     path
//       .filter((item) => item.type == "path")
//       .forEach((item, i, arr) => {
//         i > 0 &&
//           ((
//             arr[i].properties.DepartureTime.hour.low <
//             arr[i - 1].properties.ArrivalTime.hour.low
//               ? false
//               : arr[i].properties.DepartureTime.hour.low ==
//                 arr[i - 1].properties.ArrivalTime.hour.low
//               ? arr[i].properties.DepartureTime.minute.low <
//                 arr[i - 1].properties.ArrivalTime.minute.low
//                 ? false
//                 : true
//               : true
//           )
//             ? null
//             : (valid = false));
//       });
//     console.log(path, valid);
//     path["valid"] = valid;

//     // if (i == data.paths.length - 1) {
//     //   return data;
//     // }
//   });
// }

async function filterTime(data) {
  // await Promise.all(
  return {
    ...data,
    paths: data.paths.filter((path) => {
      // console.log(item.properties.Frequency);
      const arr = path.filter((item) => item.type == "path");

      for (let i = 0; i < arr.length; i++) {
        // console.log(arr);
        if (i > 0) {
          if (
            arr[i].properties.DepartureTime.hour.low <
            arr[i - 1].properties.ArrivalTime.hour.low
              ? false
              : arr[i].properties.DepartureTime.hour.low ==
                arr[i - 1].properties.ArrivalTime.hour.low
              ? arr[i].properties.DepartureTime.minute.low <
                arr[i - 1].properties.ArrivalTime.minute.low
                ? false
                : true
              : true
          ) {
          } else {
            return false;
          }
        }
        // frequency checking here
        // && item.properties.Frequency?.padStart(7, "0")[day] == "1"
      }
      // console.log(path, valid);
      // path.push({ valid: valid });
      return true;

      // You can add more processing if needed
    }),
    // );

    // return data;
  };
}

async function checkAvailability(data, day) {
  await Promise.all(
    data.paths.forEach((path) => {
      var available = true;
      // console.log(item.properties.Frequency);
      const arr = path.filter((item) => item.type == "path");

      for (let i = 0; i < arr.length; i++) {
        // frequency checking here
        if (arr[i].properties.Frequency?.padStart(7, "0")[day] == "1") {
        } else {
          available = false;
        }
      }
      console.log(path, available);
      path.push({ availability: available });

      // You can add more processing if needed
    })
  );

  return data;
}

export async function GET(req) {
  const data = req.nextUrl.searchParams;
  const resp = await getPaths(data.get("source"), data.get("destination"));
  const requiredPaths = await removeUnwanted(resp);
  console.log(requiredPaths);
  const filtereddata = await filterTime(requiredPaths);
  console.log(filtereddata);
  // const availablePaths = await checkAvailability(filtereddata, data.get("day"));
  return Response.json(filtereddata);
}
