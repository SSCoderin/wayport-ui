export default function Edge({ mode, duration, no, at, dt }) {
  return (
    <div className="edge">
      <div className="border">
        {mode == "train" ? (
          <img className="imagemapping" src={"train.svg"}></img>
        ) : (
          <img className="imagemapping" src={"flight.svg"}></img>
        )}
      </div>
      <p>{no}</p>
      <div className="time">
        <p>
          {dt.hour.low}:{dt.minute.low}
        </p>
        <p>
          {at.hour.low}:{at.minute.low}
        </p>
      </div>
      {/* <div>
        <p>{duration}</p>
      </div> */}
    </div>
  );
}
