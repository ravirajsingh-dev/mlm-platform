import React from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <Container fluid className="not-found-page">
      <Row className="justify-content-center align-items-center h-100">
        <Col xs={12} md={8} lg={6} className="py-5 text-center">
          <h1 className="error-title mb-3">A Small Pause in EkPahal</h1>
          <p className="error-message mb-4">
            The page you’re looking for isn’t available right now.
            <br />
            But every step matters—let’s continue spreading kindness and
            nourishing young lives together.
          </p>
          <Button
            variant="success"
            className="home-btn"
            onClick={() => navigate("/")}
          >
            🍽️ Go Back to EkPahal Home
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default NotFoundPage;
