import React, { useState } from "react";
import { Modal, Button, Form, Col } from "react-bootstrap";
import { FaLink, FaCopy, FaRegCopy } from "react-icons/fa";

const ReferralModal = ({ show, onHide, userId }) => {
  const [position, setPosition] = useState("left");
  const [copied, setCopied] = useState(false);
  const [epinId, setEpinId] = useState("");

  const handleClose = () => {
    // Reset all state values
    setPosition("left");
    setCopied(false);
    setEpinId("");
    onHide();
  };

  const referralLink = `${
    window.location.origin
  }/register?sponsorEP=${userId}&position=${position}${
    epinId ? `&EPin_ID=${epinId}` : ""
  }`;

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(referralLink)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => console.error("Copy failed:", err));
  };

  return (
    <Modal
      show={show}
      size="sm"
      aria-labelledby="contained-modal-title-vcenter"
      centered
      className="logout-modal"
      onHide={handleClose}
    >
      <Modal.Header className="logout-modal-header">
        <Modal.Title className="logout-modal-title">
          <FaLink className="logout-icon" />
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="logout-modal-body">
        <Form.Group className="mb-3">
          <Form.Label className="mb-2">EPin ID (Optional):</Form.Label>
          <Form.Control
            type="text"
            value={epinId}
            onChange={(e) => setEpinId(e.target.value)}
            placeholder="Enter EPin ID if any"
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label className="mb-2">Select Position:</Form.Label>
          <Form.Select
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="w-100"
          >
            <option value="left">Left Position</option>
            <option value="right">Right Position</option>
          </Form.Select>
        </Form.Group>

        <div className="d-flex align-items-center mt-3">
          <Form.Control
            type="text"
            value={referralLink}
            readOnly
            className="me-2"
          />
          <Button
            variant={copied ? "success" : "outline-primary"}
            onClick={copyToClipboard}
            size="sm"
            className="p-1"
          >
            {copied ? <FaCopy /> : <FaRegCopy />}
          </Button>
        </div>
      </Modal.Body>

      <Modal.Footer className="logout-modal-footer">
        <Col xs={5} className="text-center">
          <Button
            type="button"
            className="logout-cancel-btn"
            onClick={handleClose} // Use handleClose instead of onHide
          >
            Close
          </Button>
        </Col>
        <Col className="text-center">
          <Button
            type="button"
            className="logout-confirm-btn"
            onClick={copyToClipboard}
          >
            {copied ? "Copied!" : "Copy"}
          </Button>
        </Col>
      </Modal.Footer>
    </Modal>
  );
};

export default ReferralModal;
