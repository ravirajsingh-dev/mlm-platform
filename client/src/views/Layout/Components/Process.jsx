import React from "react";
import { FiHeart, FiMapPin, FiCheckCircle } from "react-icons/fi";

const Process = () => {
  return (
    <section className="process-editorial">
      <div className="container">
        {/* HEADER */}
        <div className="process-editorial__header">
          <span className="process-editorial__tag">HOW IT WORKS</span>
          <h2 className="process-editorial__title">
            Our Food Donation Process
          </h2>
        </div>

        {/* PROCESS */}
        <div className="process-editorial__row">
          <div className="process-editorial__step">
            <div className="process-editorial__icon">
              <FiHeart />
            </div>
            <h4>Donate Food</h4>
            <p>
              Register as a donor and share surplus food from your home,
              restaurant, or event.
            </p>
          </div>

          <div className="process-editorial__step">
            <div className="process-editorial__icon">
              <FiMapPin />
            </div>
            <h4>Pickup & Delivery</h4>
            <p>
              Volunteers coordinate pickup and ensure food reaches the right
              people quickly.
            </p>
          </div>

          <div className="process-editorial__step">
            <div className="process-editorial__icon">
              <FiCheckCircle />
            </div>
            <h4>Create Impact</h4>
            <p>
              Meals reach families and individuals, making an immediate and
              meaningful difference.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Process;
