import React, { useState } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import PropTypes from "prop-types";
import { SEND_LEVEL_LIST } from "@src/constants/LevelsConstants";

const SendingPaymentFilterModal = ({ show, onHide, onApply }) => {
  const [paymentType, setPaymentType] = useState("");
  const [status, setStatus] = useState("");
  const [level, setLevel] = useState("");
  const [receiverEPID, setReceiverEPID] = useState("");

  const handleApply = () => {
    const filterValues = {
      paymentType,
      status,
      level,
      receiverEPID,
    };
    onApply(filterValues);
    onHide();
  };

  const handleReset = () => {
    setPaymentType("");
    setStatus("");
    setLevel("");
    setReceiverEPID("");
    onApply({});
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="maroon-color">Filter Sending Links</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Row>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="label-color">Help Type</Form.Label>
                <Form.Select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="Direct">Direct</option>
                  <option value="Passive">Passive</option>
                  <option value="Upgrade">Upgrade</option>
                  <option value="Help">Help</option>
                  <option value="E_Pool_Upgrade">E-Pool Upgrade</option>
                  <option value="E_Pool">E-Pool</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="label-color">Status</Form.Label>
                <Form.Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mt-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="label-color">Level</Form.Label>
                <Form.Select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                >
                  <option value="">All</option>
                  {SEND_LEVEL_LIST.map((lvl) => (
                    <option key={lvl.value} value={lvl.value}>
                      {lvl.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="label-color">Receiver EP ID</Form.Label>
                <Form.Control
                  type="text"
                  value={receiverEPID}
                  onChange={(e) => setReceiverEPID(e.target.value)}
                  placeholder="Enter EP ID"
                />
              </Form.Group>
            </Col>
          </Row>
        </Form>
      </Modal.Body>
      <Modal.Footer className="justify-content-center">
        <Button className="danger_btn" onClick={handleReset}>
          Reset
        </Button>
        <Button className="common_btn" onClick={handleApply}>
          Apply
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

SendingPaymentFilterModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
};

export default SendingPaymentFilterModal;
