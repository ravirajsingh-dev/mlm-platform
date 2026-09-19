import React from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import AppBreadCrumb from "@src/views/Common/AppBreadCrumb";

const CreateWallet = () => {
  return (
    <Container>
      <Row className="grid grid-cols-2 gap-4">
        <Col xs={12}>
          <AppBreadCrumb
            title="Transfer E Cash"
            breadcrumbs={[
              { label: "Dashboard", link: "/user/dashboard" },
              { label: "Transfer E-Cash" },
            ]}
          />
        </Col>

        <Col xs={12}>
          <Button
            as={Link}
            to="/user/transfer-e-cash"
            className="me-2 theme_btn"
          >
            Transfer E-Cash
          </Button>

          <Button
            as={Link}
            to="/user/transfer-e-pool"
            className="me-2 theme_btn"
          >
            E-Pool to E-Cash
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default CreateWallet;
