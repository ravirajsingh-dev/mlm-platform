import React, { useState } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import PropTypes from "prop-types";
import { LEVEL_LIST } from "@src/constants/LevelsConstants";

const DownlinePendingFilterModal = ({ show, onHide, onApply }) => {
  const [paymentType, setPaymentType] = useState("");

  const [senderEPID, setSenderEPID] = useState("");

  const handleApply = () => {
    const filterValues = {
      paymentType,
      senderEPID,
    };
    onApply(filterValues);
    onHide();
  };

  const handleReset = () => {
    setPaymentType("");
    setSenderEPID("");
    onApply({});
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="maroon-color">
          Filter Downline Pending Links
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
                  <option value="Passive">Passive</option>
                  <option value="Upgrade">Upgrade</option>
                  <option value="Help">Help</option>
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

DownlinePendingFilterModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
};

export default DownlinePendingFilterModal;
