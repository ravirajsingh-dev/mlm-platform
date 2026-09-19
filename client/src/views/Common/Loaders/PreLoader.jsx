import React from "react";
import { Image } from "react-bootstrap";
// icons
import EPLogo from "@assets/img/logo/logo.png";

const PreLoader = () => {
  return (
    <div className="unique-preloader">
      <div className="preloader-container">
        <div className="preloader-circle"></div>
        <div className="preloader-circle"></div>
        <div className="preloader-circle"></div>
        <div className="preloader-img">
          <Image src={EPLogo} alt="EPLogo" />
        </div>
      </div>
    </div>
  );
};

export default PreLoader;
