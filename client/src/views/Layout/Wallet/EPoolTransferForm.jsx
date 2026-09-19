import React, { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Button, Form, Row, Col, Container } from "react-bootstrap";

import { validateForm } from "@src/utils/validation";
import Errors from "@src/notifications/Errors";
import MainCard from "@src/views/Common/Cards/MainCard";
import VerificationConfirmModal from "@src/views/Common/Modal/VerificationConfirmModal";
import { handleNumberInput } from "@src/utils/helper";

import {
  transferEPooltoECashByEPID,
  setErrors,
  removeWalletErrors,
  fetchCurrentBalance,
} from "@src/actions/walletActions";

const SURCHARGE_PERCENT = 15;

const EPoolTransferForm = ({
  transferEPooltoECashByEPID,
  errorList,
  setErrors,
  removeWalletErrors,
  loggedInUser,
  fetchCurrentBalance,
  currentTxnDetails: { e_pool },
}) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    amount: "",
    surcharge: 0,
    netAmount: 0,
    current_e_pool: 0,
  });

  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  /* =======================
     Fetch Wallet Balance
  ======================= */
  useEffect(() => {
    if (loggedInUser?._id) {
      fetchCurrentBalance(loggedInUser._id);
    }
  }, [loggedInUser, fetchCurrentBalance]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      current_e_pool: Number(e_pool) || 0,
    }));
  }, [e_pool]);

  /* =======================
     Calculate Surcharge
  ======================= */
  useEffect(() => {
    const amt = Number(formData.amount) || 0;
    const surcharge = (amt * SURCHARGE_PERCENT) / 100;
    const netAmount = amt - surcharge;

    setFormData((prev) => ({
      ...prev,
      surcharge: surcharge.toFixed(2),
      netAmount: netAmount > 0 ? netAmount.toFixed(2) : "0.00",
    }));
  }, [formData.amount]);

  /* =======================
     Redirect if TXN password missing
  ======================= */
  if (loggedInUser?.isTxnPassSet === false) {
    return <Navigate to="/user/transaction-password" replace />;
  }

  /* =======================
     Input Change Handler
  ======================= */
  const onChange = (e) => {
    const { name, value } = e.target;

    if (name === "amount") {
      const numericValue = Number(value);

      // Prevent amount > balance
      if (numericValue > Number(formData.current_e_pool)) return;
    }

    setFormData({ ...formData, [name]: value });
  };

  /* =======================
     Submit Validation
  ======================= */
  const onSubmit = (e) => {
    e.preventDefault();
    removeWalletErrors();

    const amountNum = Number(formData.amount);
    const poolBalance = Number(formData.current_e_pool);

    const errors = [];

    if (!amountNum || amountNum <= 0) {
      errors.push({ path: "amount", msg: "Please enter a valid amount." });
    }

    if (poolBalance <= 0) {
      errors.push({
        path: "amount",
        msg: "Your E-Pool balance is zero.",
      });
    }

    if (amountNum > poolBalance) {
      errors.push({
        path: "amount",
        msg: "Amount exceeds available E-Pool balance.",
      });
    }

    if (errors.length) {
      setErrors(errors);
      return;
    }

    setShowConfirmModal(true);
  };

  /* =======================
     Confirm Transfer
  ======================= */
  const handleConfirm = (txn_password) => {
    setSubmitting(true);

    transferEPooltoECashByEPID(
      {
        amount: formData.amount,
        txn_password,
      },
      navigate
    ).finally(() => {
      setSubmitting(false);
      setShowConfirmModal(false);
      setFormData((prev) => ({
        ...prev,
        amount: "",
        surcharge: 0,
        netAmount: 0,
      }));
    });
  };

  const isSubmitDisabled =
    submitting ||
    Number(formData.current_e_pool) <= 0 ||
    Number(formData.amount) <= 0 ||
    Number(formData.amount) > Number(formData.current_e_pool);

  return (
    <Container>
      <MainCard>
        <Form onSubmit={onSubmit} autoComplete="off">
          <Row className="row-gap-3">
            <Col xs={12}>
              <h4>Transfer E-Pool to E-Cash</h4>
            </Col>

            <Col md={6}>
              <Form.Label>Current E-Pool</Form.Label>
              <Form.Control value={formData.current_e_pool} disabled />
            </Col>

            <Col md={6}>
              <Form.Label>Transfer Amount</Form.Label>
              <Form.Control
                name="amount"
                value={formData.amount}
                onChange={onChange}
                onKeyDown={handleNumberInput}
                className={errorList.amount ? "invalid" : ""}
              />
              <Errors current_key="amount" />
            </Col>

            <Col md={6}>
              <Form.Label>Admin Surcharge (15%)</Form.Label>
              <Form.Control value={formData.surcharge} disabled />
            </Col>

            <Col md={6}>
              <Form.Label>Net Amount (You Receive)</Form.Label>
              <Form.Control value={formData.netAmount} disabled />
            </Col>

            <Col xs={12} className="text-center">
              <Button type="submit" disabled={isSubmitDisabled}>
                {submitting ? "Processing..." : "Confirm Transfer"}
              </Button>
            </Col>
          </Row>
        </Form>
      </MainCard>

      <VerificationConfirmModal
        show={showConfirmModal}
        handleClose={() => setShowConfirmModal(false)}
        handleConfirm={handleConfirm}
        title="Confirm Transfer"
        body="15% system surcharge will be deducted from your E-Pool amount."
        isLoading={submitting}
      />
    </Container>
  );
};

EPoolTransferForm.propTypes = {
  transferEPooltoECashByEPID: PropTypes.func.isRequired,
  errorList: PropTypes.object.isRequired,
  setErrors: PropTypes.func.isRequired,
  removeWalletErrors: PropTypes.func.isRequired,
  loggedInUser: PropTypes.object,
  fetchCurrentBalance: PropTypes.func.isRequired,
};

export default connect(
  (state) => ({
    errorList: state.errors,
    loggedInUser: state.auth.user,
    currentTxnDetails: state.wallet.currentTxnDetails,
  }),
  {
    transferEPooltoECashByEPID,
    setErrors,
    removeWalletErrors,
    fetchCurrentBalance,
  }
)(EPoolTransferForm);
