import React from "react";
import SevaKendraForm from "./SevaKendraForm";
import { Container, Row, Col } from "react-bootstrap";
import AppBreadCrumb from "@src/view/commonComponents/dataTable/AppBreadCrumb";

const CreateSevaKendra = () => {
  return (
    <Container>
      <Row className="grid grid-cols-2 gap-4">
        <Col xs={12}>
          <AppBreadCrumb
            pageTitle="Create Seva Kendra"
            crumbs={[
              { name: "Seva-Kendra", path: "/admin/seva-kendra" },
              { name: "Create Seva Kendra" },
            ]}
          />
        </Col>

        <Col>
          <SevaKendraForm />
        </Col>
      </Row>
    </Container>
  );
};

export default CreateSevaKendra;
