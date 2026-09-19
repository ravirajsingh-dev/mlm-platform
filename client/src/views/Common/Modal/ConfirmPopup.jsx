import React, { useState } from "react";
import { Modal, Button } from "react-bootstrap";

const ConfirmPopup = ({
  entity,
  modal,
  name,
  onYes,
  onNo,
  inputText = "delete",
}) => {
  return (
    <div>
      <Modal
        show={modal}
        onClose={onNo}
        className="transition-all ease-in-out duration-500 delay-500"
      >
        <Modal.Header className="p-3">Confirmation!</Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to {inputText} this {entity}?
          </p>
          <p>
            <strong>{name}</strong>
          </p>
          <div className="d-flex float-end">
            <Button
              color="danger"
              onClick={onNo}
              className="me-2"
              variant="danger"
            >
              No
            </Button>
            <Button
              onClick={() => {
                onYes();
              }}
            >
              Yes
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ConfirmPopup;
