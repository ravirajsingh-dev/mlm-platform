import React from "react";
import { Modal, Button } from "react-bootstrap";
import PropTypes from "prop-types";

const ConfirmModal = ({
  show,
  handleClose,
  handleConfirm,
  title,
  body,
  submitBtnText,
}) => {
  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{body}</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleConfirm}>
          {submitBtnText || "Submit"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

ConfirmModal.propTypes = {
  show: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  handleConfirm: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  body: PropTypes.string.isRequired,
  submitBtnText: PropTypes.string.isRequired,
};

export default ConfirmModal;
