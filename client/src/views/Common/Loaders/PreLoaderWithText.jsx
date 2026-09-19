import React, { useState, useEffect } from "react";
import { Image } from "react-bootstrap";
import EPLogo from "@assets/img/logo/logo.png";

const PreLoaderWithText = () => {
  const [message, setMessage] = useState("");

  useEffect(() => {
    const messages = [
      "Initializing application...",
      "Loading resources...",
      "Optimizing performance...",
      "Finalizing setup...",
      "Almost there!",
    ];

    let currentIndex = 0;
    setMessage(messages[0]);

    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % messages.length;
      setMessage(messages[currentIndex]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="unique-preloader">
      <div className="preloader-container">
        <div className="preloader-circle"></div>
        <div className="preloader-circle"></div>
        <div className="preloader-circle"></div>
        <div className="preloader-img">
          <Image src={EPLogo} alt="EPLogo" />
        </div>
        {/* Separated message container */}
        <div className="preloader-message">
          <span>{message}</span>
        </div>
      </div>
    </div>
  );
};

export default PreLoaderWithText;
