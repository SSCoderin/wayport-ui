"use client";

import Edge from "@/components/edge";
import Node from "@/components/node";
import { useEffect, useState } from "react";
import useSWR from "swr";

const fetcher = (...args) => fetch(...args).then((res) => res.json());

const PathResults = ({ src, dest }) => {
  const { data, error } = useSWR(
    `/api?source=${src}&destination=${dest}`,
    fetcher
  );

  if (error) return <div>Failed to load</div>;
  if (!data) return <div>Loading...</div>;

  return (
    <div>
      {data.paths ? (
        data.paths
          .filter((path, index, array) => {
            // Use indexOf to check if the current path is the first occurrence in the array
            return (
              path.length <= 5 &&
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
                        name={item.properties.cityName}
                        // Atime={item.arrivaltime ?? ""}
                        // Dtime={item.departuretime ?? ""}
                      />
                    );
                  } else if (item.type == "path") {
                    return (
                      <Edge
                        mode={"train"}
                        duration={item.properties.Distance}
                        no={item.properties.TrainNumber}
                        at={item.properties.ArrivalTime}
                        dt={item.properties.DepartureTime}
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
    </div>
  );
};

export default function Home() {
  const { src, dest } = { src: "Nanded", dest: "Roorkee" };

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

  const [startFetching, setStartFetching] = useState(false);

  const handleClick = (e) => {
    e.preventDefault();
    setStartFetching(true);
  };

  return (
    <main>
      <button onClick={(e) => handleClick(e)}>Search</button>
      {/* {JSON.stringify(data)} */}
      {startFetching && <PathResults src={src} dest={dest} />}
    </main>
  );
}
