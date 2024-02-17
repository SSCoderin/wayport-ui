"use client";

import Edge from "@/components/edge";
import Node from "@/components/node";
import { useEffect, useState } from "react";

export default function Home() {
  // const data = {
  //   source: "DELHI",
  //   destination: "MUMBAI",
  //   paths: {
  //     0: [
  //       {
  //         type: "node",
  //         nodename: "mumbai",
  //         arrivaltime: "10:10",
  //         departuretime: "12:00",
  //       },
  //       { type: "path", mode: "train", duration: "5  min", name: "yuvi train" },
  //       {
  //         type: "node",
  //         nodename: "delhi",
  //         arrivaltime: "12:05",
  //         departuretime: "1:00",
  //       },
  //     ],
  //     1: [
  //       {
  //         type: "node",
  //         nodename: "Mumbai",
  //         arrivaltime: "10:10",
  //         departuretime: "12:00",
  //       },
  //       { type: "path", mode: "train", duration: "5  min", name: "yuvi train" },
  //       {
  //         type: "node",
  //         nodename: "pune",
  //         arrivaltime: "12:05",
  //         departuretime: "12:10",
  //       },
  //       {
  //         type: "path",
  //         mode: "train",
  //         duration: "13 min",
  //         name: "akash train",
  //       },
  //       {
  //         type: "node",
  //         nodename: "delhi",
  //         arrivaltime: "12:23",
  //         departuretime: "1:00",
  //       },
  //     ],
  //     2: [
  //       {
  //         type: "node",
  //         nodename: "mumbai",
  //         arrivaltime: "10:10",
  //         departuretime: "12:00",
  //       },
  //       { type: "path", mode: "train", duration: "5  min", name: "yuvi train" },
  //       {
  //         type: "node",
  //         nodename: "pune",
  //         arrivaltime: "12:05",
  //         departuretime: "12:10",
  //       },
  //       {
  //         type: "path",
  //         mode: "flight",
  //         duration: "10 min",
  //         name: "shiv flight",
  //       },
  //       {
  //         type: "node",
  //         nodename: "delhi",
  //         arrivaltime: "12:20",
  //         departuretime: "1:00",
  //       },
  //     ],
  //   },
  // };

  const [data, setData] = useState({});

  const { src, dest } = { src: "nanded", dest: "roorkee" };

  useEffect(() => {
    fetch(`/api`).then((resp) => {
      setData(resp);
    });
  }, []);

  return (
    <main>
      {Object.keys(data.paths).map((path) => {
        return (
          <div className="path">
            {data.paths[path].map((item) => {
              if (item.type == "node") {
                return (
                  <Node
                    name={item.nodename}
                    Atime={item.arrivaltime}
                    Dtime={item.departuretime}
                  />
                );
              } else if (item.type == "path") {
                return <Edge mode={item.mode} duration={item.duration} />;
              }
            })}
          </div>
        );
      })}
    </main>
  );
}
