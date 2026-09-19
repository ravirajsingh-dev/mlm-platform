import React, { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import {
  Button,
  Form,
  Row,
  Col,
  Container,
  Card,
  Alert,
} from "react-bootstrap";
import { validateForm } from "@src/utils/validation";
import Errors from "@src/notifications/Errors";
import MainCard from "@src/views/Common/Cards/MainCard";
import ConfirmModal from "@src/views/Common/Modal/ConfirmModal";
import {
  createWithdrawalRequest,
  fetchWithdrawalSettings,
} from "@src/actions/withdrawalActions";
import { fetchCurrentBalance } from "@src/actions/walletActions";
import AppBreadCrumb from "@src/views/Common/AppBreadCrumb";

const WithdrawalRequestForm = ({
  loggedInUser,
  currentTxnDetails: { e_cash },
  withdrawalSettings,
  loadingWithdrawalRequest,
  loadingWithdrawalSettings,
  createWithdrawalRequest,
  fetchWithdrawalSettings,
  fetchCurrentBalance,
  errorList,
}) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    amount: "",
    upiId: "",
    upiHolderName: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [calculatedDetails, setCalculatedDetails] = useState({
    surchargeAmount: 0,
    netPayableAmount: 0,
  });

  const { amount, upiId, upiHolderName } = formData;

  // Fetch settings and balance on mount
  useEffect(() => {
    if (loggedInUser?._id) {
      fetchWithdrawalSettings();
      fetchCurrentBalance(loggedInUser._id);
    }
  }, [loggedInUser, fetchWithdrawalSettings, fetchCurrentBalance]);

  // Calculate surcharge when amount changes
  useEffect(() => {
    if (withdrawalSettings && amount) {
      const amt = parseFloat(amount) || 0;
      const surchargePercent = withdrawalSettings.withdrawalSurcharge || 0;
      const surchargeAmount = (amt * surchargePercent) / 100;
      const netPayableAmount = amt - surchargeAmount;

      setCalculatedDetails({
        surchargeAmount: Math.round(surchargeAmount * 100) / 100,
        netPayableAmount: Math.round(netPayableAmount * 100) / 100,
      });
    }
  }, [amount, withdrawalSettings]);

  // Redirect if transaction password isn't set
  if (loggedInUser?.isTxnPassSet === false) {
    return <Navigate to="/user/transaction-password" replace />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "amount") {
      // Allow user to enter any value freely
      // Only allow numbers and decimal point
      const numericValue = value.replace(/[^0-9.]/g, "");
      // Prevent multiple decimal points
      const parts = numericValue.split(".");
      const finalValue =
        parts.length > 2
          ? parts[0] + "." + parts.slice(1).join("")
          : numericValue;
      setFormData({ ...formData, [name]: finalValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!amount || !upiId || !upiHolderName) {
      return;
    }

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      return;
    }

    // Validate amount against settings
    if (withdrawalSettings) {
      if (amt < withdrawalSettings.minWithdrawalAmount) {
        return;
      }
      if (amt > withdrawalSettings.maxWithdrawalAmount) {
        return;
      }
      if (amt > (e_cash || 0)) {
        return;
      }
    }

    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    if (!loggedInUser) return;

    setSubmitting(true);
    try {
      const result = await createWithdrawalRequest(formData, navigate);
      if (result && result.status) {
        setShowConfirmModal(false);
        setFormData({
          amount: "",
          upiId: "",
          upiHolderName: "",
        });
        // Refresh balance and settings
        await fetchCurrentBalance(loggedInUser._id);
        await fetchWithdrawalSettings();
      }
    } catch (error) {
      console.error("Error creating withdrawal request:", error);
      setShowConfirmModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    if (!submitting) {
      setShowConfirmModal(false);
    }
  };

  if (!withdrawalSettings) {
    return (
      <Container>
        <AppBreadCrumb
          title="Withdraw E-Cash"
          breadcrumbs={[
            { label: "Dashboard", link: "/user/dashboard" },
            { label: "Withdraw E-Cash" },
          ]}
        />
        {loadingWithdrawalSettings ? (
          <div className="text-center py-5">Loading...</div>
        ) : (
          <Alert variant="warning">
            Withdrawal is currently disabled. Please contact support.
          </Alert>
        )}
      </Container>
    );
  }

  if (!withdrawalSettings.withdrawalEnabled) {
    return (
      <Container>
        <AppBreadCrumb
          title="Withdraw E-Cash"
          breadcrumbs={[
            { label: "Dashboard", link: "/user/dashboard" },
            { label: "Withdraw E-Cash" },
          ]}
        />
        <Alert variant="warning">
          Withdrawal is currently disabled. Please contact support.
        </Alert>
      </Container>
    );
  }

  const amt = parseFloat(amount) || 0;
  const isValidAmount =
    amt >= withdrawalSettings.minWithdrawalAmount &&
    amt <= withdrawalSettings.maxWithdrawalAmount &&
    amt <= (e_cash || 0);

  return (
    <Container>
      <AppBreadCrumb
        title="Withdraw E-Cash"
        breadcrumbs={[
          { label: "Dashboard", link: "/user/dashboard" },
          { label: "Withdraw E-Cash" },
        ]}
      />

      <MainCard>
        <Form onSubmit={handleSubmit}>
          <Errors />

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Amount <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="amount"
                  maxLength="5"
                  value={amount}
                  onChange={handleChange}
                  placeholder="Enter withdrawal amount"
                  required
                />
                <div className="mt-2 p-2 bg-light rounded">
                  <div className="mb-1">
                    <strong className="text-primary">Min Amount:</strong> ₹
                    {withdrawalSettings.minWithdrawalAmount}
                  </div>
                  <div className="mb-1">
                    <strong className="text-primary">Max Amount:</strong> ₹
                    {withdrawalSettings.maxWithdrawalAmount}
                  </div>
                  <div>
                    <strong className="text-success">Available E-Cash:</strong>{" "}
                    ₹{e_cash || 0}
                  </div>
                </div>
                {amount && !isValidAmount && (
                  <Form.Text className="text-danger d-block mt-1">
                    {parseFloat(amount) < withdrawalSettings.minWithdrawalAmount
                      ? `Amount must be at least ₹${withdrawalSettings.minWithdrawalAmount}`
                      : parseFloat(amount) >
                        withdrawalSettings.maxWithdrawalAmount
                      ? `Amount cannot exceed ₹${withdrawalSettings.maxWithdrawalAmount}`
                      : parseFloat(amount) > (e_cash || 0)
                      ? `Insufficient balance. Available: ₹${e_cash || 0}`
                      : "Invalid amount"}
                  </Form.Text>
                )}
              </Form.Group>
            </Col>
          </Row>

          {amount && isValidAmount && (
            <Row>
              <Col md={6}>
                <Card className="mb-3 bg-light">
                  <Card.Body>
                    <Row>
                      <Col>
                        <strong>Requested Amount:</strong> ₹{amount}
                      </Col>
                    </Row>
                    <Row className="mt-2">
                      <Col>
                        <strong>
                          Surcharge ({withdrawalSettings.withdrawalSurcharge}%):
                        </strong>{" "}
                        ₹{calculatedDetails.surchargeAmount.toFixed(2)}
                      </Col>
                    </Row>
                    <Row className="mt-2">
                      <Col>
                        <strong className="text-success">
                          Net Payable Amount:
                        </strong>{" "}
                        ₹{calculatedDetails.netPayableAmount.toFixed(2)}
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  UPI ID <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="upiId"
                  value={upiId}
                  onChange={handleChange}
                  placeholder="Enter your UPI ID"
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  UPI Holder Name <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="upiHolderName"
                  value={upiHolderName}
                  onChange={handleChange}
                  placeholder="Enter UPI holder name"
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Button
                type="submit"
                variant="primary"
                disabled={
                  submitting ||
                  loadingWithdrawalRequest ||
                  !isValidAmount ||
                  !upiId ||
                  !upiHolderName
                }
                className="me-2"
              >
                {submitting || loadingWithdrawalRequest
                  ? "Processing..."
                  : "Submit Request"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate("/user/wallet")}
              >
                Cancel
              </Button>
            </Col>
          </Row>
        </Form>
      </MainCard>

      <ConfirmModal
        show={showConfirmModal}
        handleClose={handleCloseModal}
        handleConfirm={handleConfirm}
        title="Confirm Withdrawal Request"
        body={`Are you sure you want to withdraw ₹${amount}? You will receive ₹${calculatedDetails.netPayableAmount.toFixed(
          2
        )} after surcharge deduction (₹${calculatedDetails.surchargeAmount.toFixed(
          2
        )}).`}
        submitBtnText={
          submitting || loadingWithdrawalRequest ? "Processing..." : "Confirm"
        }
        cancelBtnText="Cancel"
      />
    </Container>
  );
};

WithdrawalRequestForm.propTypes = {
  loggedInUser: PropTypes.object,
  currentTxnDetails: PropTypes.object,
  withdrawalSettings: PropTypes.object,
  loadingWithdrawalRequest: PropTypes.bool,
  loadingWithdrawalSettings: PropTypes.bool,
  createWithdrawalRequest: PropTypes.func.isRequired,
  fetchWithdrawalSettings: PropTypes.func.isRequired,
  fetchCurrentBalance: PropTypes.func.isRequired,
  errorList: PropTypes.array,
};

const mapStateToProps = (state) => ({
  loggedInUser: state.auth.user,
  currentTxnDetails: state.wallet.currentTxnDetails,
  withdrawalSettings: state.wallet.withdrawalSettings,
  loadingWithdrawalRequest: state.wallet.loadingWithdrawalRequest,
  loadingWithdrawalSettings: state.wallet.loadingWithdrawalSettings,
  errorList: state.errors.errorsList,
});

export default connect(mapStateToProps, {
  createWithdrawalRequest,
  fetchWithdrawalSettings,
  fetchCurrentBalance,
})(WithdrawalRequestForm);
