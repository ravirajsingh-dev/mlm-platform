import React, { useState, useEffect } from "react";
import { Modal, Button, Row, Col, Spinner, Alert } from "react-bootstrap";
import PropTypes from "prop-types";
import api from "@src/utils/axiosSetup";

const QRCodeModal = ({
  show,
  handleClose,
  withdrawalRequestId,
  isAdmin = true,
  withdrawalDetails = null,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [qrDetails, setQrDetails] = useState(null);

  useEffect(() => {
    if (show && withdrawalRequestId) {
      fetchQRCode();
    } else {
      // Reset state when modal closes
      setQrCodeData(null);
      setQrDetails(null);
      setError(null);
    }
  }, [show, withdrawalRequestId]);

  const fetchQRCode = async () => {
    if (!withdrawalRequestId) {
      setError("Withdrawal request ID is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const endpoint = isAdmin
        ? `/api/admin/withdrawal/qr-code/${withdrawalRequestId}`
        : `/api/withdrawal/qr-code/${withdrawalRequestId}`;

      const res = await api.get(endpoint);

      if (res.data && res.data.status === true && res.data.response) {
        setQrCodeData(res.data.response.qrCodeData);
        setQrDetails(res.data.response.withdrawalRequest);
      } else {
        setError(res.data?.message || "Failed to generate QR code");
      }
    } catch (err) {
      console.error("Error fetching QR code:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to load QR code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!qrCodeData) return;

    try {
      const link = document.createElement("a");
      link.href = qrCodeData;
      link.download = `withdrawal-qr-${withdrawalRequestId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error downloading QR code:", err);
      setError("Failed to download QR code");
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Withdrawal QR Code</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading && (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-muted">Generating QR code...</p>
          </div>
        )}

        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
            <div className="mt-2">
              <Button variant="outline-danger" size="sm" onClick={fetchQRCode}>
                Retry
              </Button>
            </div>
          </Alert>
        )}

        {!loading && !error && qrCodeData && qrDetails && (
          <>
            <Row className="mb-4">
              <Col className="text-center">
                <div
                  style={{
                    display: "inline-block",
                    padding: "20px",
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                >
                  <img
                    src={qrCodeData}
                    alt="QR Code"
                    style={{
                      maxWidth: "300px",
                      width: "100%",
                      height: "auto",
                    }}
                  />
                </div>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col>
                <div
                  style={{
                    backgroundColor: "#f8f9fa",
                    padding: "15px",
                    borderRadius: "6px",
                  }}
                >
                  <h6 className="mb-3 fw-bold">Withdrawal Details</h6>
                  <Row className="mb-2">
                    <Col xs={5} className="text-muted">
                      User:
                    </Col>
                    <Col xs={7} className="fw-semibold">
                      {qrDetails.userId?.name || "N/A"} (
                      {qrDetails.userId?.EP_ID || "N/A"})
                    </Col>
                  </Row>
                  <Row className="mb-2">
                    <Col xs={5} className="text-muted">
                      UPI ID:
                    </Col>
                    <Col xs={7} className="fw-semibold">
                      {qrDetails.upiId || "N/A"}
                    </Col>
                  </Row>
                  <Row className="mb-2">
                    <Col xs={5} className="text-muted">
                      UPI Holder:
                    </Col>
                    <Col xs={7} className="fw-semibold">
                      {qrDetails.upiHolderName || "N/A"}
                    </Col>
                  </Row>
                  <Row className="mb-2">
                    <Col xs={5} className="text-muted">
                      Amount:
                    </Col>
                    <Col xs={7} className="fw-semibold text-primary">
                      ₹{qrDetails.amount?.toFixed(2) || "0.00"}
                    </Col>
                  </Row>
                  <Row className="mb-2">
                    <Col xs={5} className="text-muted">
                      Surcharge:
                    </Col>
                    <Col xs={7} className="fw-semibold text-danger">
                      ₹{qrDetails.surchargeAmount?.toFixed(2) || "0.00"}
                    </Col>
                  </Row>
                  <Row className="mb-2">
                    <Col xs={5} className="text-muted">
                      Net Payable:
                    </Col>
                    <Col xs={7} className="fw-semibold text-success">
                      ₹{qrDetails.netPayableAmount?.toFixed(2) || "0.00"}
                    </Col>
                  </Row>
                  <Row>
                    <Col xs={5} className="text-muted">
                      Status:
                    </Col>
                    <Col xs={7}>
                      <span
                        className={`badge ${
                          qrDetails.status === "APPROVED"
                            ? "bg-success"
                            : qrDetails.status === "REJECTED"
                            ? "bg-danger"
                            : "bg-warning"
                        }`}
                      >
                        {qrDetails.status || "PENDING"}
                      </span>
                    </Col>
                  </Row>
                </div>
              </Col>
            </Row>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
        {qrCodeData && (
          <Button variant="primary" onClick={handleDownload}>
            Download QR Code
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

QRCodeModal.propTypes = {
  show: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  withdrawalRequestId: PropTypes.string.isRequired,
  isAdmin: PropTypes.bool,
  withdrawalDetails: PropTypes.object,
};

export default QRCodeModal;

