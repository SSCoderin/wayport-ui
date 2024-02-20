export default function Edge({ mode, duration, no }) {
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
      {/* <div>
        <p>{duration}</p>
      </div> */}
    </div>
  );
}
