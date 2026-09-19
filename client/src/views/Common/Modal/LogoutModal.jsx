import React from "react";
import PropTypes from "prop-types";
import { Col, Modal, Button } from "react-bootstrap";
import { connect } from "react-redux";
import { logout } from "@src/actions/auth";
import { FaExclamationTriangle } from "react-icons/fa"; // FA warning icon

const LogoutModal = ({ show, onHide, logout }) => {
  const handleLogout = async () => {
    await logout();
  };

  return (
    <Modal
      show={show}
      size="sm"
      aria-labelledby="contained-modal-title-vcenter"
      centered
      className="logout-modal"
    >
      <Modal.Header className="logout-modal-header">
        <Modal.Title className="logout-modal-title">
          <FaExclamationTriangle className="logout-icon" />
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="logout-modal-body">
        Do you want to log out?
      </Modal.Body>
      <Modal.Footer className="logout-modal-footer">
        <Col xs={5} className="text-center">
          <Button type="button" className="logout-cancel-btn" onClick={onHide}>
            Close
          </Button>
        </Col>
        <Col className="text-center">
          <Button
            type="button"
            className="logout-confirm-btn"
            onClick={handleLogout}
          >
            Confirm
          </Button>
        </Col>
      </Modal.Footer>
    </Modal>
  );
};

LogoutModal.propTypes = {
  logout: PropTypes.func.isRequired,
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
};

export default connect(null, { logout })(LogoutModal);
