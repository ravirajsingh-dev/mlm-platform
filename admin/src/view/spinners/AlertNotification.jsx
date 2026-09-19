import React, { useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { GiCheckMark } from "react-icons/gi";
import { BsExclamationLg } from "react-icons/bs";

const AlertNotification = ({ alertType, alertText, timeOut = 5000 }) => {
  const [hide, setHide] = useState(true);

  useEffect(() => {
    setHide(false);

    const timer = setTimeout(() => {
      setHide(true);
    }, timeOut);

    return () => clearTimeout(timer);
  }, [timeOut]);

  return (
    <Container className={` ${hide ? "hideAlert" : "alert-sec"}`}>
      <Row className="alert-sec-row">
        <Col xs={4} className="text-center alert-box">
          <Col className="alert-icon">
            {alertType === "success" ? (
              <GiCheckMark size={35} />
            ) : (
              <BsExclamationLg size={45} />
            )}
          </Col>
          <Col className="alert-content">{alertText}</Col>
        </Col>
      </Row>
    </Container>
  );
};

export default AlertNotification;
