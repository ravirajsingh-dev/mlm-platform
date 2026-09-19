import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Form, Col, Spinner, Alert } from "react-bootstrap";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import CopyIcon from "@src/views/Common/CopyIcon";
import { setAlert } from "@src/actions/alert";
import { validateForm } from "@src/utils/validation";
import { setErrorsList } from "@src/actions/errors";
import Errors from "@src/notifications/Errors";
import {
  generateDonationQRCode,
  submitDonationRequest,
} from "@src/actions/donationActions";
import { clearQRCode } from "@src/reducers/donationReducer";

const DonationModal = ({
  show,
  handleClose,
  paymentMode,
  initialAmount,
  isFixedAmount,
  donationSettings,
  generateDonationQRCode,
  submitDonationRequest,
  clearQRCode,
  qrCodeData,
  loadingQRCode,
  loadingSubmitDonation,
  setErrorsList,
  setAlert,
  errorList,
}) => {
  const initialFormData = {
    donorName: "",
    phone: "",
    email: "",
    address: "",
    amount: initialAmount || "",
    utrNumber: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [customAmount, setCustomAmount] = useState(initialAmount || "");
  const [qrCodeTimeout, setQrCodeTimeout] = useState(null);
  const previousShowRef = useRef(false);
  const modalOpenKeyRef = useRef(0);

  // Reset form data and clear errors when modal opens/closes
  useEffect(() => {
    if (show) {
      setFormData({
        ...initialFormData,
        amount: initialAmount || "",
      });
      setCustomAmount(initialAmount || "");
      // Clear errors when modal opens
      setErrorsList("", "donorName");
      setErrorsList("", "phone");
      setErrorsList("", "email");
      setErrorsList("", "amount");
      setErrorsList("", "utrNumber");
    } else {
      setFormData(initialFormData);
      setCustomAmount("");
      // Clear timeout when modal closes
      if (qrCodeTimeout) {
        clearTimeout(qrCodeTimeout);
        setQrCodeTimeout(null);
      }
      // Clear QR code state when modal closes
      clearQRCode();
      // Clear errors when modal closes
      setErrorsList("", "donorName");
      setErrorsList("", "phone");
      setErrorsList("", "email");
      setErrorsList("", "amount");
      setErrorsList("", "utrNumber");
    }
  }, [show, initialAmount]);

  // Separate effect for QR code generation - ensures it runs every time modal opens with fixed amount
  useEffect(() => {
    // Track when modal transitions from closed to open
    const isModalJustOpened = show && !previousShowRef.current;

    if (
      isModalJustOpened &&
      initialAmount &&
      paymentMode === "UPI" &&
      isFixedAmount
    ) {
      // Increment key to force regeneration even with same amount
      modalOpenKeyRef.current += 1;

      // Clear existing QR code first to ensure fresh state
      clearQRCode();

      // Use setTimeout to ensure state is cleared before generating new QR code
      const timer = setTimeout(() => {
        generateDonationQRCode(initialAmount);
      }, 0);

      return () => {
        clearTimeout(timer);
      };
    }

    // Update previous show state
    previousShowRef.current = show;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, initialAmount, paymentMode, isFixedAmount]);

  const onChange = (e) => {
    const { name, value } = e.target;
    // For amount field, only allow digits 0-9
    if (name === "amount") {
      const numericValue = value.replace(/[^0-9]/g, "");
      setFormData({ ...formData, [name]: numericValue });
    } else if (name === "phone") {
      const numericValue = value.replace(/[^0-9]/g, "");
      setFormData({ ...formData, [name]: numericValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Only allow digits 0-9, no dots, symbols, or decimals
    const numericValue = value.replace(/[^0-9]/g, "");
    setCustomAmount(numericValue);
    setFormData({ ...formData, amount: numericValue });
    // Clear amount error when user types
    setErrorsList("", "amount");

    // Clear existing timeout
    if (qrCodeTimeout) {
      clearTimeout(qrCodeTimeout);
    }

    // Auto-generate QR code for ANY type when amount is entered/changed with delay
    if (!isFixedAmount && paymentMode === "UPI" && numericValue) {
      const amount = parseInt(numericValue, 10);
      if (!isNaN(amount) && amount > 0) {
        // Delay for 1 second before generating QR code
        const timeout = setTimeout(() => {
          generateDonationQRCode(amount);
        }, 1000);
        setQrCodeTimeout(timeout);
      }
    }
  };

  // Sync customAmount to formData.amount when customAmount changes
  useEffect(() => {
    if (!isFixedAmount) {
      setFormData((prev) => ({ ...prev, amount: customAmount }));
    }
  }, [customAmount, isFixedAmount]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (qrCodeTimeout) {
        clearTimeout(qrCodeTimeout);
      }
    };
  }, [qrCodeTimeout]);

  const onSubmit = async (e) => {
    e.preventDefault();

    // Clear previous errors
    setErrorsList("", "donorName");
    setErrorsList("", "phone");
    setErrorsList("", "email");
    setErrorsList("", "amount");
    setErrorsList("", "utrNumber");

    const validationRules = [
      { path: "donorName", msg: "Donor name is required." },
      { path: "phone", msg: "Phone number is required." },
      { path: "email", msg: "Email is required." },
      { path: "amount", msg: "Amount is required.", type: "number" },
      { path: "utrNumber", msg: "UTR number is required." },
    ];

    const errors = validateForm(formData, validationRules);

    if (errors.length) {
      errors.forEach((error) => {
        setErrorsList(error.msg, error.path);
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setErrorsList("Amount must be greater than 0", "amount");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorsList("Invalid email format", "email");
      return;
    }

    const submitData = {
      ...formData,
      amount: amount,
      paymentMode: paymentMode,
    };

    const result = await submitDonationRequest(submitData);
    if (result && result.status) {
      setTimeout(() => {
        handleClose();
      }, 2000);
    }
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
      size="lg"
      centered
      className="donation-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title>
          Donate via {paymentMode === "UPI" ? "UPI" : "Bank Transfer"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {paymentMode === "UPI" && (
          <div className="mb-4">
            <h5 className="mb-3">Scan QR Code to Pay</h5>
            {donationSettings.upi?.upiId && (
              <div className="mb-3 p-3 bg-light rounded">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div>
                    <small className="d-block">UPI ID</small>
                    <strong className="text-warning fs-5">
                      {donationSettings.upi.upiId}
                    </strong>
                  </div>
                  <CopyIcon
                    textToCopy={donationSettings.upi.upiId}
                    iconSize={24}
                    className="ms-2"
                    onCopy={() =>
                      setAlert("UPI ID copied to clipboard", "success")
                    }
                  />
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <small className="d-block">Name</small>
                    <strong className="text-warning fs-5">
                      {donationSettings.upi.upiHolderName}
                    </strong>
                  </div>
                  <CopyIcon
                    textToCopy={donationSettings.upi.upiHolderName}
                    iconSize={24}
                    className="ms-2"
                    onCopy={() =>
                      setAlert("Name copied to clipboard", "success")
                    }
                  />
                </div>
              </div>
            )}
            {isFixedAmount ? (
              <div className="text-center mb-3">
                {loadingQRCode ? (
                  <div className="d-flex flex-column align-items-center justify-content-center">
                    <Spinner animation="border" />
                    <span className="mt-2 text-muted">
                      Generating QR Code...
                    </span>
                  </div>
                ) : qrCodeData ? (
                  <img
                    src={qrCodeData}
                    alt="QR Code"
                    style={{ maxWidth: "100%", height: "auto" }}
                  />
                ) : (
                  <Spinner animation="border" />
                )}
                <p className="mt-2 text-muted">Amount: ₹{initialAmount}</p>
              </div>
            ) : (
              <div className="mb-3">
                <div
                  className="text-center mb-3"
                  style={{ minHeight: "200px" }}
                >
                  {loadingQRCode && customAmount ? (
                    <div className="d-flex flex-column align-items-center justify-content-center">
                      <Spinner animation="border" />
                      <span className="mt-2 text-muted">
                        Generating QR Code...
                      </span>
                    </div>
                  ) : qrCodeData && customAmount ? (
                    <img
                      src={qrCodeData}
                      alt="QR Code"
                      style={{ maxWidth: "100%", height: "auto" }}
                    />
                  ) : null}
                </div>
                <Form.Group>
                  <Form.Label>Enter Amount</Form.Label>
                  <Form.Control
                    type="text"
                    value={customAmount}
                    onChange={handleAmountChange}
                    placeholder="Enter amount"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className={errorList.amount ? "invalid" : ""}
                  />
                  <Errors current_key="amount" />
                </Form.Group>
              </div>
            )}
          </div>
        )}

        {paymentMode === "BANK" && donationSettings.bank && (
          <div className="mb-4">
            <h5 className="mb-3">Bank Details</h5>
            <div className="bg-light p-3 rounded">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div>
                  <small className="d-block">Bank Name</small>
                  <strong className="text-warning">
                    {donationSettings.bank.bankName || "N/A"}
                  </strong>
                </div>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div>
                  <small className="d-block">Account Holder Name</small>
                  <strong className="text-warning">
                    {donationSettings.bank.accountHolderName || "N/A"}
                  </strong>
                </div>
                <CopyIcon
                  textToCopy={donationSettings.bank.accountHolderName || ""}
                  iconSize={24}
                  className="ms-2"
                  onCopy={() =>
                    setAlert(
                      "Account Holder Name copied to clipboard",
                      "success"
                    )
                  }
                />
              </div>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div>
                  <small className="d-block">Account Number</small>
                  <strong className="text-warning">
                    {donationSettings.bank.accountNo || "N/A"}
                  </strong>
                </div>
                <CopyIcon
                  textToCopy={donationSettings.bank.accountNo || ""}
                  iconSize={24}
                  className="ms-2"
                  onCopy={() =>
                    setAlert("Account Number copied to clipboard", "success")
                  }
                />
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <small className="d-block">IFSC Code</small>
                  <strong className="text-warning">
                    {donationSettings.bank.ifscCode || "N/A"}
                  </strong>
                </div>
                <CopyIcon
                  textToCopy={donationSettings.bank.ifscCode || ""}
                  iconSize={24}
                  className="ms-2"
                  onCopy={() =>
                    setAlert("IFSC Code copied to clipboard", "success")
                  }
                />
              </div>
            </div>
          </div>
        )}

        <Form onSubmit={onSubmit}>
          <Form.Group as={Col} className="mb-3">
            <Form.Label>
              Donor Name <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              name="donorName"
              value={formData.donorName}
              onChange={onChange}
              placeholder="Enter your name"
              required
            />
            <Errors current_key="donorName" />
          </Form.Group>

          <Form.Group as={Col} className="mb-3">
            <Form.Label>
              Phone Number <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              name="phone"
              value={formData.phone}
              onChange={onChange}
              placeholder="Enter your phone number"
              required
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength="10"
              minLength="10"
              className={errorList.phone ? "invalid" : ""}
            />
            <Errors current_key="phone" />
          </Form.Group>

          <Form.Group as={Col} className="mb-3">
            <Form.Label>
              Email <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={formData.email}
              onChange={onChange}
              placeholder="Enter your email"
              required
            />
            <Errors current_key="email" />
          </Form.Group>

          <Form.Group as={Col} className="mb-3">
            <Form.Label>Address (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="address"
              value={formData.address}
              onChange={onChange}
              placeholder="Enter your address (optional)"
            />
            <Errors current_key="address" />
          </Form.Group>

          <Form.Group as={Col} className="mb-3">
            <Form.Label>
              Amount <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              name="amount"
              value={formData.amount}
              onChange={onChange}
              placeholder="Enter amount"
              inputMode="numeric"
              pattern="[0-9]*"
              readOnly={paymentMode === "UPI"}
              required
              className={paymentMode === "UPI" ? "bg-light" : ""}
            />
            <Errors current_key="amount" />
          </Form.Group>

          <Form.Group as={Col} className="mb-3">
            <Form.Label>
              UTR Number <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              name="utrNumber"
              value={formData.utrNumber}
              onChange={onChange}
              placeholder="Enter UTR number"
              required
            />
            <Errors current_key="utrNumber" />
          </Form.Group>

          <Button
            variant="primary"
            type="submit"
            className="w-100"
            disabled={loadingSubmitDonation}
          >
            {loadingSubmitDonation ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Submitting...
              </>
            ) : (
              "Submit Donation Request"
            )}
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

DonationModal.propTypes = {
  show: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  paymentMode: PropTypes.oneOf(["UPI", "BANK"]).isRequired,
  initialAmount: PropTypes.number,
  isFixedAmount: PropTypes.bool,
  donationSettings: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
  qrCodeData: state.donation.qrCodeData,
  loadingQRCode: state.donation.loadingQRCode,
  loadingSubmitDonation: state.donation.loadingSubmitDonation,
  errorList: state.errors,
});

export default connect(mapStateToProps, {
  generateDonationQRCode,
  submitDonationRequest,
  clearQRCode,
  setErrorsList,
  setAlert,
})(DonationModal);
