import { setErrors } from "@src/actions/auth";
import Errors from "@src/notifications/Errors";
import { handleNumberInput } from "@src/utils/helper";
import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Spinner, Col, Alert } from "react-bootstrap";
import { connect } from "react-redux";
import { FaKey, FaPhone } from "react-icons/fa";

const ForgotPasswordModal = ({
  show,
  onHide,
  onVerifyE2eId,
  onResetPassword,
  isVerifying,
  isResetting,
  successMessage,
  errorList,
}) => {
  const [step, setStep] = useState(1); // 1 = EP ID, 2 = Phone
  const [EP_ID, setEP_ID] = useState("");
  const [phone, setPhone] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [error, setError] = useState("");

  // Reset form when modal closes
  useEffect(() => {
    if (!show) {
      setStep(1);
      setEP_ID("");
      setPhone("");
      setMaskedPhone("");
      setError("");
    }
  }, [show]);

  const handleVerifyE2eId = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await onVerifyE2eId(EP_ID);

      console.log("response", response);
      if (response && response.maskedPhone) {
        setMaskedPhone(response.maskedPhone);
        setStep(2);
      }
    } catch (err) {
      setError("An error occurred during EP ID verification");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await onResetPassword({ EP_ID, phone });
    } catch (err) {
      setError("Failed to reset password. Please try again.");
    }
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      size="sm"
      className="logout-modal"
    >
      <Modal.Header closeButton className="logout-modal-header">
        <Modal.Title className="logout-modal-title">
          {step === 1 ? (
            <>
              <FaKey className="logout-icon me-2" /> Reset Password
            </>
          ) : (
            <>
              <FaPhone className="logout-icon me-2" /> Verify Identity
            </>
          )}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="logout-modal-body">
        {error && <Alert variant="danger">{error}</Alert>}
        {successMessage && <Alert variant="success">{successMessage}</Alert>}

        {!successMessage ? (
          <Form onSubmit={step === 1 ? handleVerifyE2eId : handleResetPassword}>
            {step === 1 ? (
              <Form.Group className="mb-3">
                <Form.Label htmlFor="EP_ID" className="register-lable">
                  EP ID
                </Form.Label>
                <Form.Control
                  type="text"
                  id="EP_ID"
                  name="EP_ID"
                  placeholder="Enter your EP ID"
                  value={EP_ID}
                  onChange={(e) => setEP_ID(e.target.value.toUpperCase())}
                  required
                  minLength={9}
                  maxLength={9}
                  className={`text-muted ${errorList.EP_ID ? "invalid" : ""}`}
                  disabled={isVerifying}
                />
                <Errors current_key="EP_ID" key="EP_ID" />
              </Form.Group>
            ) : (
              <Form.Group className="mb-3">
                <Form.Label htmlFor="phoneInput" className="register-lable">
                  Enter your registered phone number
                  {maskedPhone && ` ending with ****${maskedPhone}`}
                </Form.Label>

                <Form.Control
                  type="text"
                  id="phoneInput"
                  name="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength="10"
                  minLength="10"
                  placeholder="Please enter phone number"
                  className={`text-muted ${errorList.phone ? "invalid" : ""}`}
                  onKeyDown={handleNumberInput}
                  disabled={isResetting}
                />

                <Errors current_key="phone" key="phone" />
              </Form.Group>
            )}

            <div className="d-flex justify-content-between">
              {step === 2 && (
                <Button
                  variant="outline-secondary"
                  onClick={() => setStep(1)}
                  disabled={isVerifying || isResetting}
                >
                  Back
                </Button>
              )}
              <Button
                type="submit"
                className="logout-cancel-btn"
                disabled={isVerifying || isResetting}
              >
                {isVerifying || isResetting ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    {step === 1 ? "Verifying..." : "Resetting..."}
                  </>
                ) : step === 1 ? (
                  "Verify ID"
                ) : (
                  "Reset Password"
                )}
              </Button>
            </div>
          </Form>
        ) : (
          <div className="text-center">
            <Button className="mt-3" variant="success" onClick={onHide}>
              Close
            </Button>
          </div>
        )}
      </Modal.Body>

      {!successMessage && (
        <Modal.Footer className="logout-modal-footer">
          <Col className="text-center">
            <Button
              type="button"
              className="logout-cancel-btn"
              onClick={onHide}
              disabled={isVerifying || isResetting}
            >
              Close
            </Button>
          </Col>
        </Modal.Footer>
      )}
    </Modal>
  );
};

const mapStateToProps = (state) => ({
  errorList: state.errors,
  loading: state.auth.loading,
});

export default connect(mapStateToProps, {
  setErrors,
})(ForgotPasswordModal);
