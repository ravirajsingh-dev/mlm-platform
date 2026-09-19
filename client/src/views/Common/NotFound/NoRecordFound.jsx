import React from "react";

const NoRecordFound = ({ message }) => {
  return (
    <div className="no-record-found">
      {/* <img src={NoRecord} alt="No records found" className="no-record-image" /> */}
      <div className="no-record-message">
        {message || "We couldn't find any data matching your criteria."}
      </div>
    </div>
  );
};

export default NoRecordFound;
