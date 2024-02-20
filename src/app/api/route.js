import neo4j from "neo4j-driver";

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
  const query2 = `MATCH paths = (n1 {stationCode: "${src}"})-[*1..3]-(n2 {stationCode: "${dst}"})
    RETURN paths`;
  const response = await session.run(query2);
  console.log(response);

  // const res = JSON.stringify(response);
  // fs.writeFileSync("paths.json", res);

  const resultingPaths = {
    source: src,
    destination: dst,
    paths: [],
  };

  response.records.forEach((record, index) => {
    resultingPaths.paths[index] = new Array(); //one way/path
    let startNode = {};
    startNode.type = "node";
    startNode.properties = record._fields[0].start.properties;

    resultingPaths.paths[index].push(startNode); //adding the firstnode into the array

    var prevtrain = 0;
    // var newPath = [];
    record._fields[0].segments.forEach((segment, i) => {
      //node,path,node till we reach destination
      let path = {};
      let nextNode = {};
      path.type = "path";
      nextNode.type = "node";

      path.mode = segment.relationship.type.toLowerCase();
      path.properties = segment.relationship.properties;
      nextNode.properties = segment.end.properties;

      if (path.mode == "train") {
        var currenttrain = path?.properties.TrainNumber;
        // console.log(currenttrain, prevtrain);
        if (currenttrain !== prevtrain) {
          // newPath.push(element);
          resultingPaths.paths[index].push(path); //adding the path and the next node for a path
          prevtrain = currenttrain;
        } else {
          let removedNode = resultingPaths.paths[index].pop();
          // console.log("removed node: ", removedNode);
        }
      }

      resultingPaths.paths[index].push(nextNode);
    });
  });

  console.log(resultingPaths);
  // const resPaths = JSON.stringify(resultingPaths);
  // fs.writeFileSync("formattedResult.json", resPaths);

  return resultingPaths;

  //TODO:
  //now acccording to the results we get from the response from neo4j, format the data according to our needs.
  //records: contains "paths"
  //paths: contains all the paths it has a start and end field which represents the source and destination nodes and then a segments field which has all the segments that is all the objects for each node-edge-node and all properities of that ex: records: {keys: paths, fields:[start:"mum",end: "manglore",segments:[{start: mum ,relationship: edgeinfo, end: manglore}]]}
  //each path obj contains: keys,length,_fields,_fieldLookup
}

export async function GET(req) {
  const data = req.nextUrl.searchParams;
  const resp = await getPaths(data.get("source"), data.get("destination"));
  // console.log(resp);
  return Response.json(resp);
}
