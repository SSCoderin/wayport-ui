export default function Edge({
  edge,
  mode,
  duration,
  no,
  at,
  dt,
  day,
  frequency,
  from,
  to,
}) {
  return (
    <div className="edge">
      <div className="border">
        {mode == "train" ? (
          <img className="imagemapping" src={"train.svg"}></img>
        ) : (
          <img className="imagemapping" src={"flight.svg"}></img>
        )}
      </div>
      <p>
        {/* {!day && JSON.stringify(edge)} */}
        {/* {frequency.padStart(7, "0")}
        <br /> */}
        {no}
      </p>

      <div className="time">
        <p>
          {dt.hour.low}:{dt.minute.low}
        </p>
        <p>
          {at.hour.low}:{at.minute.low} ({day})
        </p>
      </div>
      <div className="station">
        <p>{from}</p>
        <p>{to}</p>
      </div>
      {/* <div>
        <p>{duration}</p>
      </div> */}
    </div>
  );
}
