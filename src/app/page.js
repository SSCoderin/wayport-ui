"use client";

import Edge from "@/components/edge";
import Node from "@/components/node";
import { useEffect, useState } from "react";
import useSWR from "swr";

const fetcher = (...args) => fetch(...args).then((res) => res.json());

export default function Home() {
  const { src, dest } = { src: "NED", dest: "RK" };

  const { data, error } = useSWR(
    `/api?source=${src}&destination=${dest}`,
    fetcher
  );

  if (error) return <div>Failed to load</div>;
  if (!data) return <div>Loading...</div>;

  // useEffect(() => {
  //   fetch(`/api?source=${src}&destination=${dest}`)
  //     .then((resp) => {
  //       return resp.json();
  //     })
  //     .then((datares) => {
  //       // console.log(datares);
  //       setData(datares);
  //     });
  // }, []);

  return (
    <main>
      {/* {JSON.stringify(data)} */}
      {data.paths ? (
        data.paths
          .filter((path, index, array) => {
            // Use indexOf to check if the current path is the first occurrence in the array
            return (
              array.findIndex(
                (item) => JSON.stringify(item) === JSON.stringify(path)
              ) === index
            );
          })
          .sort((a, b) => a.length - b.length)
          .map((path, i) => {
            return (
              <div key={i} className="path">
                {i + 1}.
                {path.map((item) => {
                  if (item.type == "node") {
                    return (
                      <Node
                        name={item.properties.stationName}
                        Atime={item.arrivaltime ?? ""}
                        Dtime={item.departuretime ?? ""}
                      />
                    );
                  } else if (item.type == "path") {
                    return (
                      <Edge
                        mode={"train"}
                        duration={item.properties.Distance}
                        no={item.properties.TrainNumber}
                      />
                    );
                  }
                })}
              </div>
            );
          })
      ) : (
        <p>Loading</p>
      )}
    </main>
  );
}
