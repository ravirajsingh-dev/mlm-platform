import React from "react";
import TransferEPinForm from "./TransferEPinForm";
import { Row, Col } from "react-bootstrap";
import AppBreadCrumb from "@src/views/Common/AppBreadCrumb";

const TransferEpin = () => {
  return (
    <React.Fragment>
      <AppBreadCrumb
        title="Transfer EP-Keys"
        breadcrumbs={[
          { label: "Dashboard", link: "/user/dashboard" },
          { label: "EP-Keys", link: "/user/e-pins" },
          { label: "Transfer EP-Keys" },
        ]}
      />
      <Row className="grid grid-cols-2 gap-4">
        <Col>
          <TransferEPinForm />
        </Col>
      </Row>
    </React.Fragment>
  );
};

export default TransferEpin;
