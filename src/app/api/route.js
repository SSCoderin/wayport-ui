import neo4j from "neo4j-driver";
import fs from "fs";

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
  // const {DUMMY_DATA_CONNECTION_URI,DUMMY_DATA_USERNAME,DUMMY_DATA_PASSWORD} = process.env

  const driver = neo4j.driver(
    process.env.DUMMY_DATA_CONNECTION_URI,
    neo4j.auth.basic(
      process.env.DUMMY_DATA_USERNAME,
      process.env.DUMMY_DATA_PASSWORD
    )
  );

  const session = driver.session();

  // const query1BlrToBom  = `MATCH paths = (n1 {iata_code: "BLR"})-[*1..2]->(n2 {iata_code: "BOM"})
  // RETURN paths`
  const query2 = `MATCH paths = (n1:City {cityName: "${src}"})-[rels:TrainTo*1..3]-(n2:City {cityName: "${dst}"}) RETURN paths`;
  // WHERE ALL(idx in range(0, size(rels)-2) WHERE (rels[idx]).DepartureTime < (rels[idx+1]).ArrivalTime)
  // RETURN paths

  const response = await session.run(query2);
  console.log(response);

  // const res = JSON.stringify(response);
  // fs.writeFileSync("paths.json", res);

  const resultingPaths = {
    source: src,
    destination: dst,
    paths: [],
  };

  return new Promise((resolve) => {
    response.records.forEach((record, index) => {
      resultingPaths.paths[index] = new Array(); //one way/path
      let startNode = {};
      startNode.type = "node";
      startNode.properties = record._fields[0].start.properties;

      resultingPaths.paths[index].push(startNode); //adding the firstnode into the array

      var prevtrain = 0;
      // var newPath = [];
      record._fields[0].segments.forEach((segment, i) => {
        // return new Promise((resolve) => {
        //node,path,node till we reach destination
        let path = {};
        let nextNode = {};
        path.type = "path";
        nextNode.type = "node";

        path.mode = segment.relationship.type.toLowerCase();
        path.properties = segment.relationship.properties;
        nextNode.properties = segment.end.properties;

        if (path.mode == "trainto") {
          var currenttrain = path?.properties.TrainNumber;
          // console.log(currenttrain, prevtrain);
          if (currenttrain !== prevtrain) {
            // newPath.push(element);
            resultingPaths.paths[index].push(path);
            prevtrain = currenttrain;
            resolve(); //adding the path and the next node for a path
          } else {
            let removedNode = resultingPaths.paths[index].pop();
            let removedPath = resultingPaths.paths[index].pop();

            searchTime(
              path.properties.TrainNumber,
              removedNode.properties.cityName
            ).then((interdata) => {
              path.properties.DepartureTime = interdata.dt;
              path.properties.StationFrom = interdata.code;

              resultingPaths.paths[index].push(path);
              resolve();
            });

            // console.log("removed path: ", removedNode);
            // console.log("removed path: ", removedNode, removedPath);
          }
        }
        // resolve({ path, nextNode });
        resultingPaths.paths[index].push(nextNode);
        resolve();
        // });
      });
    });

    console.log(resultingPaths);
    resolve(resultingPaths);
  });
}

async function searchTime(trainNum, city) {
  const driver = neo4j.driver(
    process.env.DUMMY_DATA_CONNECTION_URI,
    neo4j.auth.basic(
      process.env.DUMMY_DATA_USERNAME,
      process.env.DUMMY_DATA_PASSWORD
    )
  );

  const session = driver.session();

  const query = `MATCH paths = (n1:City {cityName:"${city}"})-[rel:TrainTo {TrainNumber:"${trainNum}"}]->(n2:City) RETURN rel`;
  const response = await session.run(query);
  const props = response.records[0]._fields[0].properties;

  return { dt: props.DepartureTime, code: props.StationFrom };
}

export async function GET(req) {
  const data = req.nextUrl.searchParams;
  const resp = await getPaths(data.get("source"), data.get("destination"));
  // filterTime(resp);
  // console.log(resp);
  return Response.json(resp);
}

// async function filterTime(data) {
//   // console.log(data.paths);
//   let count = 0;
//   const filteredPaths = [];
//   data.paths.forEach((path) => {
//     count++;
//     path.forEach((element, i) => {
//       if (i === path.length - 5) {
//         return false;
//       }
//       if ((i + 1) % 2 === 0) {
//         console.log(element.type);
//         console.log("do something here");
//       }
//     });
//   });
//   console.log("no. of paths: ", count);
// }

// GET()
