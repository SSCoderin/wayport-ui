"use client";

import Edge from "@/components/edge";
import Input from "@/components/input";
import Node from "@/components/node";
import { useEffect, useState } from "react";
import useSWR from "swr";

const fetcher = (...args) => fetch(...args).then((res) => res.json());

const PathResults = ({ src, dest, day }) => {
  const { data, error } = useSWR(
    `/api?source=${src}&destination=${dest}`,
    fetcher,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  if (error) return <div>Failed to load</div>;
  if (!data) return <div>Loading...</div>;

  return (
    <div>
      {data.paths ? (
        data.paths
          .filter((path) => {
            const arr = path.filter((item) => item.type == "path");

            for (let i = 0; i < arr.length; i++) {
              if (
                arr[i].properties.Frequency?.padStart(7, "0")[
                  (((day - 1) % 7) + 7) % 7
                ] == "0"
              ) {
                return false;
              }
            }

            return true;
          })
          .sort((a, b) => a.length - b.length)
          .map((path, i) => {
            return (
              <div
                key={i}
                className="path"
                // style={path[path.length - 1].valid ? {} : { background: "red" }}
              >
                {i + 1}.{/* {JSON.stringify(path[path.length - 1].valid)} */}
                {path.map((item, index) => {
                  if (item.type == "node") {
                    return (
                      <Node
                        name={item.properties.cityName}
                        day={
                          index > 0
                            ? parseInt(path[index - 1].properties.DayCount)
                            : -1
                        }

                        // Atime={item.arrivaltime ?? ""}
                        // Dtime={item.departuretime ?? ""}
                      />
                    );
                  } else if (item.type == "path") {
                    return (
                      <Edge
                        edge={item}
                        mode={"train"}
                        duration={item.properties.Distance}
                        no={item.properties.TrainNumber}
                        at={item.properties.ArrivalTime}
                        dt={item.properties.DepartureTime}
                        day={item.properties.DayCount}
                        frequency={item.properties.Frequency}
                        from={item.properties.StationFrom}
                        to={item.properties.StationTo}
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
  // const { src, dest } = { src: "Nanded", dest: "Roorkee" };
  const [dateT, setDateT] = useState(new Date().getDay());
  const [inputs, onInputChange] = useState({});
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
    setStartFetching(false);
    setStartFetching(true);
  };

  return (
    <main>
      <Input onInputChange={onInputChange} />
      <input
        type="date"
        onChange={(e) => {
          const value = e.target.value;
          const day = new Date(value).getDay();
          setDateT(day);
        }}
      ></input>
      {/* <button onClick={(e) => handleClick(e)}>Search</button> */}
      {/* {JSON.stringify(data)} */}
      {inputs.from && inputs.to && (
        <PathResults src={inputs.from} dest={inputs.to} day={dateT} />
      )}
    </main>
  );
}
