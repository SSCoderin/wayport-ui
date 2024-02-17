export default function Node({ name, Atime, Dtime }) {
  return (
    <div className="node">
      <p className="nodename">{name}</p>
      <p className="nodedownname">{Atime}</p>
      {/* <p>
          {Dtime}
        </p> */}
    </div>
  );
}
