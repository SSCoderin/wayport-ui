export default function Node({ name, Atime, Dtime, day }) {
  function getdateInDDMMYYFormat(date) {
    // const date = new Date();
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // getMonth() returns a zero-based value, so we add 1
    const year = date.getFullYear().toString().slice(-2); // get the last 2 digits of the year
    return `${day}-${month}-${year}`;
  }

  function addDaysToDate(date, daysToAdd) {
    // const date = new Date();
    date.setDate(date.getDate() + daysToAdd);
    return date;
  }

  return (
    <div className="node">
      <p className="nodename">{name}</p>
      <p className="nodedownname">
        {day == -1
          ? getdateInDDMMYYFormat(new Date())
          : getdateInDDMMYYFormat(addDaysToDate(new Date(), day - 1))}
      </p>
      {/* <p className="nodedownname">{Atime}</p> */}
      {/* <p>
          {Dtime}
        </p> */}
    </div>
  );
}
