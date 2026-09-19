import React from "react";
import FirstPayUserForm from "./FirstPayUserForm";
import { Container, Row, Col } from "react-bootstrap";
import AppBreadCrumb from "@src/view/commonComponents/dataTable/AppBreadCrumb";

const CreateFirstPayUser = () => {
  return (
    <Container>
      <Row className="grid grid-cols-2 gap-4">
        <Col xs={12}>
          <AppBreadCrumb
            pageTitle="Create First-Pay User"
            crumbs={[
              { name: "First-Pay User", path: "/admin/first-pay-user" },
              { name: "Create First-Pay User" },
            ]}
          />
        </Col>

        <Col>
          <FirstPayUserForm />
        </Col>
      </Row>
    </Container>
  );
};

export default CreateFirstPayUser;
