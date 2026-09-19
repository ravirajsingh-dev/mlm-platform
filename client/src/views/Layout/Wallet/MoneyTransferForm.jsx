import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Form,
  Row,
  Col,
  Container,
  Alert,
  Card,
} from "react-bootstrap";

import { validateForm } from "@src/utils/validation";
import Errors from "@src/notifications/Errors";
import MainCard from "@src/views/Common/Cards/MainCard";
import VerificationConfirmModal from "@src/views/Common/Modal/VerificationConfirmModal";

import { handleNumberInput } from "@src/utils/helper";

import {
  transferWalletToWalletByEPID,
  setErrors,
  removeWalletErrors,
  getSponsorUserDetails,
} from "@src/actions/walletActions";
import { fetchCurrentBalance } from "@src/actions/walletActions";

const MoneyTransferForm = ({
  transferWalletToWalletByEPID,
  errorList,
  setErrors,
  removeWalletErrors,
  getSponsorUserDetails,
  EP_User,
  loggedInUser,
  fetchCurrentBalance,
  currentTxnDetails,
}) => {
  const navigate = useNavigate();

  const initialFormData = {
    EP_ID: "",
    user_name: "",
    amount: "",
    current_e_cash: 0,
  };

  const [formData, setFormData] = useState(initialFormData);
  const [submitting, setSubmitting] = useState(false);

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const { EP_ID, user_name, amount, current_e_cash } = formData;

  // Extract balance information from currentTxnDetails
  const e_cash = currentTxnDetails?.e_cash || 0;
  const availableBalance = currentTxnDetails?.availableBalance ?? e_cash;
  const pendingWithdrawalAmount =
    currentTxnDetails?.pendingWithdrawalAmount || 0;
  const hasPendingWithdrawal = currentTxnDetails?.hasPendingWithdrawal || false;

  React.useEffect(() => {
    if (!loggedInUser) return;
    fetchCurrentBalance(loggedInUser._id);
  }, [fetchCurrentBalance, loggedInUser]);

  React.useEffect(() => {
    if (EP_ID.length === 9) {
      getSponsorUserDetails(EP_ID);
    } else {
      setFormData((prevData) => ({
        ...prevData,
        user_name: "",
      }));
    }
  }, [EP_ID, getSponsorUserDetails]);

  React.useEffect(() => {
    if (e_cash === undefined || e_cash === null) return;
    setFormData((prevData) => ({
      ...prevData,
      current_e_cash: e_cash,
    }));
  }, [e_cash]);

  // Redirect if transaction password isn't set
  if (loggedInUser?.isTxnPassSet === false) {
    return <Navigate to="/user/transaction-password" replace />;
  }

  React.useEffect(() => {
    if (!EP_User) return;

    setFormData((prevData) => ({
      ...prevData,
      user_name: EP_User && EP_ID ? EP_User.name : "",
    }));
  }, [EP_User]);

  const onChange = (e) => {
    if (!e.target) {
      return;
    }

    const fieldName = e.target.name;
    const fieldValue = e.target.value;

    // Special handling for amount field - allow any numeric input
    if (fieldName === "amount") {
      // Remove any non-digit characters (except empty string)
      const numericValue = fieldValue.replace(/[^0-9]/g, "");

      // Update the field value (allow any numeric input)
      setFormData({ ...formData, amount: numericValue });

      // Clear errors on input change (validation will be shown in the card)
      if (errorList.amount) {
        removeWalletErrors();
      }
      return;
    }

    // For all other fields, update normally
    setFormData({ ...formData, [fieldName]: fieldValue });
  };

  // Calculate if amount is valid
  const transferAmount =
    amount && amount.trim() !== "" ? parseFloat(amount) : 0;
  const isAmountValid =
    !isNaN(transferAmount) &&
    transferAmount > 0 &&
    transferAmount <= availableBalance;
  const isAmountExceeding =
    !isNaN(transferAmount) && transferAmount > availableBalance;

  const onSubmit = (e) => {
    e.preventDefault();

    removeWalletErrors();

    let validationRules = [];

    validationRules = [
      { path: "EP_ID", msg: "EP_ID is required." },
      { path: "amount", msg: "Amount is required." },
    ];

    const errors = validateForm(formData, validationRules);

    if (errors.length) {
      setErrors(errors);
      return;
    }

    // Validate amount - button should already be disabled, but double-check
    if (!amount || amount.trim() === "") {
      setErrors([{ path: "amount", msg: "Amount is required." }]);
      return;
    }

    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      setErrors([
        { path: "amount", msg: "Please enter a valid amount greater than 0." },
      ]);
      return;
    }

    if (transferAmount > availableBalance) {
      // Should not reach here as button is disabled, but keep for safety
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirm = (txn_password) => {
    setSubmitting(true);

    const submitData = { ...formData, txn_password };

    console.log("submitData", submitData);
    transferWalletToWalletByEPID(submitData, navigate).finally(() => {
      setSubmitting(false);
      setShowConfirmModal(false);
      setFormData(initialFormData);
    });
  };

  return (
    <Container>
      <MainCard className="card-body">
        <Form
          onSubmit={onSubmit}
          autoComplete="off"
          className="registration-form"
        >
          <Row className="row-gap-3">
            <Col xs={12} className="card-heading ">
              <h4>Transfer E-Cash to Team's E-Cash Wallet</h4>
            </Col>

            {hasPendingWithdrawal && (
              <Col xs={12}>
                <Alert variant="warning" className="mb-3">
                  <Alert.Heading className="h6 mb-2">
                    <strong>Pending Withdrawal Notice</strong>
                  </Alert.Heading>
                  <p className="mb-0">
                    You have a pending withdrawal request of{" "}
                    <strong>₹{pendingWithdrawalAmount.toFixed(2)}</strong>. This
                    amount is currently held and cannot be transferred. Your
                    current E-Cash balance is{" "}
                    <strong>₹{e_cash.toFixed(2)}</strong>, but only{" "}
                    <strong>₹{availableBalance.toFixed(2)}</strong> is available
                    for transfer.
                  </p>
                </Alert>
              </Col>
            )}

            <Col xs={12} md={6} className="mb-3">
              <Form.Group>
                <Form.Label htmlFor="EP_ID">EP ID*</Form.Label>
                <Form.Control
                  type="text"
                  id="EP_ID"
                  name="EP_ID"
                  minLength="9"
                  maxLength="9"
                  value={EP_ID.toUpperCase()}
                  onChange={(e) => onChange(e)}
                  placeholder="Please enter EP ID"
                  className={`text-muted ${errorList.EP_ID ? "invalid" : ""}`}
                />

                <Errors current_key="EP_ID" key="EP_ID" />
              </Form.Group>
            </Col>

            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label htmlFor="user_name" className="register-lable">
                  Name
                </Form.Label>

                <Form.Control
                  required
                  type="text"
                  id="user_name"
                  name="user_name"
                  value={user_name || ""}
                  placeholder="Name"
                  disabled
                />
              </Form.Group>
            </Col>

            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label htmlFor="current_e_cash">
                  {hasPendingWithdrawal
                    ? "Available E-Cash*"
                    : "Current E-Cash*"}
                </Form.Label>
                <Form.Control
                  className={errorList.current_e_cash ? "invalid" : ""}
                  type="text"
                  id="current_e_cash"
                  name="current_e_cash"
                  value={
                    hasPendingWithdrawal
                      ? availableBalance.toFixed(2)
                      : current_e_cash
                  }
                  disabled
                />
                {hasPendingWithdrawal && (
                  <Form.Text className="text-muted">
                    Current Balance: ₹{e_cash.toFixed(2)} | Pending Withdrawal:
                    ₹{pendingWithdrawalAmount.toFixed(2)}
                  </Form.Text>
                )}
                <Errors current_key="current_e_cash" />
              </Form.Group>
            </Col>

            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label htmlFor="amount">Amount*</Form.Label>
                <Form.Control
                  className={isAmountExceeding ? "invalid" : ""}
                  type="text"
                  id="amount"
                  name="amount"
                  maxLength="5"
                  value={amount}
                  onChange={onChange}
                  onKeyDown={handleNumberInput}
                  placeholder="Enter amount"
                />
                <Form.Text className="text-muted">
                  Maximum: ₹{availableBalance.toFixed(2)}
                </Form.Text>
              </Form.Group>
            </Col>

            {amount && isAmountExceeding && (
              <Col xs={12} md={6}>
                <Card className="mb-3 bg-light border-danger">
                  <Card.Body>
                    <Row>
                      <Col>
                        <strong className="text-danger">
                          Amount Exceeds Available Balance
                        </strong>
                      </Col>
                    </Row>
                    <Row className="mt-2">
                      <Col>
                        <strong>Entered Amount:</strong> ₹
                        {transferAmount.toFixed(2)}
                      </Col>
                    </Row>
                    <Row className="mt-2">
                      <Col>
                        <strong>Available Balance:</strong> ₹
                        {availableBalance.toFixed(2)}
                      </Col>
                    </Row>
                    {hasPendingWithdrawal && (
                      <>
                        <Row className="mt-2">
                          <Col>
                            <strong>Current E-Cash:</strong> ₹
                            {e_cash.toFixed(2)}
                          </Col>
                        </Row>
                        <Row className="mt-2">
                          <Col>
                            <strong>Pending Withdrawal:</strong> ₹
                            {pendingWithdrawalAmount.toFixed(2)}
                          </Col>
                        </Row>
                      </>
                    )}
                    <Row className="mt-2">
                      <Col>
                        <small className="text-danger">
                          Please enter an amount within your available balance
                          to proceed.
                        </small>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            )}

            <Col xs={12} className="text-center">
              <Button
                className="m-2 theme_btn"
                type="submit"
                disabled={submitting || !isAmountValid}
              >
                {submitting ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm"
                      aria-hidden="true"
                    ></span>
                    {` Sending... `}
                  </>
                ) : (
                  <>Send</>
                )}
              </Button>
              <Button
                className="danger_btn"
                type="reset"
                onClick={() => {
                  navigate(-1);
                  setFormData(initialFormData);
                  removeWalletErrors();
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
            </Col>
          </Row>
        </Form>
      </MainCard>
      <VerificationConfirmModal
        show={showConfirmModal}
        handleClose={() => {
          setShowConfirmModal(false);
          removeWalletErrors();
        }}
        handleConfirm={handleConfirm}
        title="Confirm Transaction"
        body="Please enter your transaction password to confirm."
        submitBtnText="Confirm"
        isLoading={submitting}
      />
    </Container>
  );
};

MoneyTransferForm.propTypes = {
  transferWalletToWalletByEPID: PropTypes.func.isRequired,
  errorList: PropTypes.object.isRequired,
  setErrors: PropTypes.func.isRequired,
  removeWalletErrors: PropTypes.func.isRequired,
  getSponsorUserDetails: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  errorList: state.errors,
  EP_User: state.wallet.EP_User,
  loggedInUser: state.auth.user,
  currentTxnDetails: state.wallet.currentTxnDetails,
});

export default connect(mapStateToProps, {
  transferWalletToWalletByEPID,
  setErrors,
  removeWalletErrors,
  getSponsorUserDetails,
  fetchCurrentBalance,
})(MoneyTransferForm);
