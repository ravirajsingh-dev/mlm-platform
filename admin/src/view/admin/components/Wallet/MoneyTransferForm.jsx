import React, { useState } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Button, Form, Row, Col, Container } from "react-bootstrap";

import { validateForm } from "@src/utils/validation";
import Errors from "@src/notifications/Errors";
import MainCard from "@src/view/commonComponents/mainCard/MainCard";
import VerificationConfirmModal from "../../modals/VerificationConfirmModal";

import { handleNumberInput } from "@src/utils/helper";

import {
  transferMoneyToEPUser,
  setErrors,
  removeWalletErrors,
  getSponsorUserDetails,
} from "@src/actions/adminWalletActions";

const MoneyTransferForm = ({
  transferMoneyToEPUser,
  errorList,
  setErrors,
  removeWalletErrors,
  getSponsorUserDetails,
  EP_User,
}) => {
  const navigate = useNavigate();

  const initialFormData = {
    EP_ID: "",
    user_name: "",
    amount: "",
    e_cash: "",
    walletType: "e_cash",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [txn_type, setTxn_type] = useState("CR"); // 'CR' for credit, 'DR' for debit
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const { EP_ID, user_name, amount, e_cash, walletType } = formData;

  const walletTypes = [
    { label: "E-Cash", value: "e_cash" },
    { label: "E-Pool", value: "e_pool" },
    { label: "Upgrade", value: "upgrade" },
    { label: "Help", value: "help" },
    { label: "DDF", value: "ddf" },
    { label: "E-Pool Upgrade", value: "e_pool_upgrade" },
  ];

  React.useEffect(() => {
    if (EP_ID.length === 9) {
      getSponsorUserDetails(EP_ID);
    } else {
      setFormData((prevData) => ({
        ...prevData,
        user_name: "",
        e_cash: "",
      }));
    }
  }, [EP_ID, getSponsorUserDetails]);

  // Helper function to get wallet balance
  const getWalletBalance = (user, walletType) => {
    if (!user) return 0;
    // API returns e_cash and e_pool directly on user object
    // For other wallet types, we'll need to fetch them separately or default to 0
    switch (walletType) {
      case "e_cash":
        return user.e_cash || 0;
      case "e_pool":
        return user.e_pool || 0;
      case "upgrade":
        return user.upgrade || user.wallet?.upgrade || 0;
      case "help":
        return user.help || user.wallet?.help || 0;
      case "ddf":
        return user.ddf || user.wallet?.ddf || 0;
      case "e_pool_upgrade":
        return user.e_pool_upgrade || user.wallet?.e_pool_upgrade || 0;
      default:
        return user.e_cash || 0;
    }
  };

  React.useEffect(() => {
    if (!EP_User) return;

    setFormData((prevData) => ({
      ...prevData,
      user_name: EP_User ? EP_User.name : "",
      e_cash: getWalletBalance(EP_User, prevData.walletType || "e_cash"),
    }));
  }, [EP_User]);

  React.useEffect(() => {
    if (!EP_User) return;

    // Update balance when wallet type changes
    setFormData((prevData) => ({
      ...prevData,
      e_cash: getWalletBalance(EP_User, walletType),
    }));
  }, [walletType, EP_User]);

  const onChange = (e) => {
    if (!e.target) {
      return;
    }

    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTypeChange = (type) => {
    setTxn_type(type);
    removeWalletErrors();
  };

  const onSubmit = (e) => {
    e.preventDefault();

    removeWalletErrors();

    let validationRules = [];

    validationRules = [
      { path: "EP_ID", msg: "EP_ID is required." },
      { path: "amount", msg: "Amount is required." },
    ];

    const errors = validateForm(formData, validationRules);

    // Additional validation for amount
    const amountNum = parseFloat(amount);
    if (amount.trim() !== "") {
      if (isNaN(amountNum)) {
        errors.push({ path: "amount", msg: "Amount must be a valid number." });
      } else if (amountNum <= 0) {
        errors.push({ path: "amount", msg: "Amount must be greater than 0." });
      }
    }

    // Validation for wallet type
    if (!walletType) {
      errors.push({ path: "walletType", msg: "Wallet type is required." });
    }

    // Validation for debit: check if balance is sufficient
    if (txn_type === "DR" && amount.trim() !== "" && !isNaN(amountNum) && amountNum > 0) {
      const currentBalance = parseFloat(e_cash) || 0;
      if (amountNum > currentBalance) {
        errors.push({
          path: "amount",
          msg: `Insufficient balance. Available: ₹${currentBalance.toFixed(2)}`,
        });
      }
    }

    if (errors.length) {
      setErrors(errors);
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirm = (txn_password) => {
    setSubmitting(true);

    const submitData = {
      EP_ID: formData.EP_ID,
      amount: formData.amount,
      walletType: formData.walletType,
      txn_password,
      txn_type, // Include transaction type in the request
    };

    transferMoneyToEPUser(submitData, navigate).finally(() => {
      setSubmitting(false);
      setShowConfirmModal(false);
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
              <h4>
                {txn_type === "CR" ? "Add Money" : "Deduct Money"} To EP User
                Wallet
              </h4>
            </Col>

            {/* Transaction Type Selector */}
            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label>Transaction Type*</Form.Label>
                <div className="d-flex gap-3">
                  <Button
                    variant={txn_type === "CR" ? "primary" : "outline-primary"}
                    onClick={() => handleTypeChange("CR")}
                  >
                    Credit (Add Money)
                  </Button>
                  <Button
                    variant={txn_type === "DR" ? "danger" : "outline-danger"}
                    onClick={() => handleTypeChange("DR")}
                  >
                    Debit (Deduct Money)
                  </Button>
                </div>
                <Errors current_key="txn_type" />
              </Form.Group>
            </Col>

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
                <Form.Label htmlFor="walletType">Wallet Type*</Form.Label>
                <Form.Control
                  as="select"
                  id="walletType"
                  name="walletType"
                  value={walletType}
                  onChange={onChange}
                >
                  {walletTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Form.Control>
                <Errors current_key="walletType" />
              </Form.Group>
            </Col>

            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label htmlFor="e_cash" className="register-lable">
                  User's {walletTypes.find((w) => w.value === walletType)?.label || "Wallet"} Balance
                </Form.Label>

                <Form.Control
                  required
                  type="text"
                  id="e_cash"
                  name="e_cash"
                  value={e_cash || ""}
                  placeholder="Balance"
                  disabled
                />
              </Form.Group>
            </Col>

            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label htmlFor="amount">
                  Amount* ({txn_type === "CR" ? "Credit" : "Debit"})
                </Form.Label>
                <Form.Control
                  className={errorList.amount ? "invalid" : ""}
                  type="text"
                  id="amount"
                  name="amount"
                  value={amount}
                  onChange={onChange}
                  maxLength={5}
                  onKeyDown={handleNumberInput}
                />
                <Errors current_key="amount" />
              </Form.Group>
            </Col>

            <Col xs={12} className="text-end">
              <Button
                className="m-2"
                type="submit"
                variant={txn_type === "CR" ? "primary" : "danger"}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm"
                      aria-hidden="true"
                    ></span>
                    {` Processing... `}
                  </>
                ) : txn_type === "CR" ? (
                  "Add Money"
                ) : (
                  "Deduct Money"
                )}
              </Button>
              <Button
                className="ml-2"
                type="reset"
                variant="secondary"
                onClick={() => navigate(-1)}
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
        handleClose={() => setShowConfirmModal(false)}
        handleConfirm={handleConfirm}
        title={`Confirm ${txn_type === "CR" ? "Credit" : "Debit"} Transaction`}
        body={`You are about to ${
          txn_type === "CR" ? "add" : "deduct"
        } ₹${amount} ${
          txn_type === "CR" ? "to" : "from"
        } the user's wallet. Please enter your transaction password to confirm.`}
        submitBtnText={txn_type === "CR" ? "Add Money" : "Deduct Money"}
        variant={txn_type === "CR" ? "primary" : "danger"}
      />
    </Container>
  );
};

MoneyTransferForm.propTypes = {
  transferMoneyToEPUser: PropTypes.func.isRequired,
  errorList: PropTypes.object.isRequired,
  setErrors: PropTypes.func.isRequired,
  removeWalletErrors: PropTypes.func.isRequired,
  getSponsorUserDetails: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  errorList: state.errors,
  EP_User: state.wallet.EP_User,
});

export default connect(mapStateToProps, {
  transferMoneyToEPUser,
  setErrors,
  removeWalletErrors,
  getSponsorUserDetails,
})(MoneyTransferForm);
