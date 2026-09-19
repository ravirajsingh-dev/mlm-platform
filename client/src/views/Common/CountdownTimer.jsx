import React, { useState, useEffect } from "react";

const CountdownTimer = ({ createdAt, reactivatedAt }) => {
  const [timeLeft, setTimeLeft] = useState("");

  const startDate = reactivatedAt || createdAt;

  useEffect(() => {
    if (!startDate) return;

    const start = new Date(startDate);
    const deadline = start.getTime() + 7 * 24 * 60 * 60 * 1000;

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = deadline - now;

      if (difference <= 0) {
        setTimeLeft("0 day 0 hrs 0 min 0 sec");
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft(
        `${days} day${days !== 1 ? "s" : ""} ${hours} hr${
          hours !== 1 ? "s" : ""
        } ${minutes} min ${seconds} sec`
      );
    };

    updateTimer();
    const timerId = setInterval(updateTimer, 1000);

    return () => clearInterval(timerId);
  }, [createdAt, reactivatedAt]);

  return <strong>{timeLeft}</strong>;
};

export default CountdownTimer;
