import React from "react";

const BouncingLoader = ({ minHeight = "500px" }) => {
  return (
    <div style={{ minHeight: minHeight, alignContent: "center" }}>
      <div className="bouncing-loader">
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  );
};

export default BouncingLoader;
