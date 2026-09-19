import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import AppBreadCrumb from "@src/view/commonComponents/dataTable/AppBreadCrumb";
import MoneyTransferForm from "./MoneyTransferForm";

const CreateWallet = () => {
  return (
    <Container>
      <Row className="grid grid-cols-2 gap-4">
        <Col xs={12}>
          <AppBreadCrumb
            pageTitle="Create EPin"
            crumbs={[
              { name: "Transfer Reports", path: "/admin/transfer-reports" },
              { name: "Add Money To User Wallet" },
            ]}
          />
        </Col>
        <Col xs={12}>
          <MoneyTransferForm />
        </Col>
      </Row>
    </Container>
  );
};

export default CreateWallet;
