import React, { useState } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import PropTypes from "prop-types";
import { LEVEL_LIST } from "@src/constants/LevelsConstants";

const ReceivePaymentFilterModal = ({ show, onHide, onApply }) => {
  const [paymentType, setPaymentType] = useState("");
  const [status, setStatus] = useState("");
  const [amount, setAmount] = useState("");
  const [senderEPID, setSenderEPID] = useState("");

  const handleApply = () => {
    const filterValues = {
      paymentType,
      status: status,
      amount,
      senderEPID,
    };
    onApply(filterValues);
    onHide();
  };

  const handleReset = () => {
    setPaymentType("");
    setStatus("");
    setAmount("");
    setSenderEPID("");
    onApply({});
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="maroon-color">
          Filter Receiving Links
        </Modal.Title>
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
                  <option value="Passive">Matching</option>
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
                  <option value="completed">Confirmed</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mt-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="label-color">Level</Form.Label>
                <Form.Select
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                >
                  <option value="">All</option>
                  {LEVEL_LIST.map((lvl) => (
                    <option key={lvl.value} value={lvl.value}>
                      {lvl.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="label-color">Sender EP ID</Form.Label>
                <Form.Control
                  type="text"
                  value={senderEPID}
                  onChange={(e) => setSenderEPID(e.target.value)}
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

ReceivePaymentFilterModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
};

export default ReceivePaymentFilterModal;
