import React from "react";
import EPinForm from "./EPinForm";
import { Container, Row, Col } from "react-bootstrap";
import AppBreadCrumb from "@src/view/commonComponents/dataTable/AppBreadCrumb";

const CreateEpin = () => {
  return (
    <Container>
      <Row className="grid grid-cols-2 gap-4">
        <Col xs={12}>
          <AppBreadCrumb
            pageTitle="Create EP-Key"
            crumbs={[
              { name: "EP-Keys", path: "/admin/e-pins" },
              { name: "Create EP-Key" },
            ]}
          />
        </Col>
        <Col xs={12}>
          <EPinForm />
        </Col>
      </Row>
    </Container>
  );
};

export default CreateEpin;
