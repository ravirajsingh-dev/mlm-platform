import React from "react";
import PropTypes from "prop-types";
import { Col, Modal, Button } from "react-bootstrap";
import { FaExclamationTriangle } from "react-icons/fa"; // Keeping icon for consistency or replace if needed
import CopyIcon from "../CopyIcon";

const WelcomeModal = ({ show, onHide, name, epID, password }) => {
  return (
    <Modal
      show={show}
      size="sm"
      aria-labelledby="contained-modal-title-vcenter"
      centered
      className="logout-modal" // using the same class names for styling
    >
      <Modal.Header className="logout-modal-header">
        <Modal.Title className="logout-modal-title">
          <FaExclamationTriangle className="logout-icon" />
        </Modal.Title>
      </Modal.Header>

      <Modal.Body
        className="logout-modal-body"
        style={{ whiteSpace: "pre-line" }}
      >
        <Modal.Body className="logout-modal-body">
          <p>
            <strong>Congratulations {name}!</strong>
          </p>

          <p>
            You have successfully registered for the Food Donation Initiative
            by&nbsp;
            <strong>EK PAHAL</strong>.
          </p>

          <div className="d-grid">
            <span className="w-headng">EP ID:</span>{" "}
            <span className="w-value">
              {epID}

              <CopyIcon textToCopy={epID} />
            </span>
            <br />
            <span className="w-headng">Password:</span>{" "}
            <span className="w-value">
              {password}

              <CopyIcon textToCopy={password} />
            </span>
          </div>

          <p>
            Thank you for joining us in the fight against hunger! Together, we
            can make a difference by connecting surplus food with those in need.
          </p>
        </Modal.Body>
      </Modal.Body>

      <Modal.Footer className="logout-modal-footer">
        <Col className="text-center">
          <Button type="button" className="logout-cancel-btn" onClick={onHide}>
            Login
          </Button>
        </Col>
      </Modal.Footer>
    </Modal>
  );
};

WelcomeModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired,
  epID: PropTypes.string.isRequired,
  password: PropTypes.string.isRequired,
};

export default WelcomeModal;
