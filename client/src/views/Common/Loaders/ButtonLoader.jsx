import React from "react";

const ButtonLoader = ({ size = 16, text = "Loading..." }) => {
  return (
    <div className="button-loader" style={{ fontSize: `${size}px` }}>
      <div className="button-loader__spinner">
        <div className="leaf leaf--1"></div>
        <div className="leaf leaf--2"></div>
      </div>
      <span className="button-loader__text">{text}</span>
    </div>
  );
};

export default ButtonLoader;
