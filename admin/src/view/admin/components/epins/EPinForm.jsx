import React, { useState } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Button, Form, Row, Col, Container } from "react-bootstrap";
import Select from "react-select";

import { validateForm } from "@src/utils/validation";
import Errors from "@src/notifications/Errors";
import MainCard from "@src/view/commonComponents/mainCard/MainCard";
import VerificationConfirmModal from "../../modals/VerificationConfirmModal";
import { ePinTypes } from "@src/constants/index";

import { handleNumberInput } from "@src/utils/helper";

import {
  createEPinForEPUser,
  setErrors,
  removeEPinErrors,
  getSponsorUserDetails,
} from "@src/actions/adminEPinActions";

const EPinForm = ({
  createEPinForEPUser,
  errorList,
  setErrors,
  removeEPinErrors,
  getSponsorUserDetails,
  EP_User,
}) => {
  const navigate = useNavigate();

  const initialFormData = {
    EP_ID: "",
    user_name: "",
    plan: "epin",
    quantity: "",
    txn_type: "CR",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [submitting, setSubmitting] = useState(false);

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const { EP_ID, user_name, plan, quantity, txn_type } = formData;

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
    if (!EP_User) return;

    setFormData((prevData) => ({
      ...prevData,
      user_name: EP_User ? EP_User.name : "",
    }));
  }, [EP_User]);

  const onChange = (e) => {
    if (!e.target) {
      return;
    }

    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = (e) => {
    e.preventDefault();

    removeEPinErrors();

    let validationRules = [];

    validationRules = [
      { path: "EP_ID", msg: "EP_ID is required." },
      {
        path: "plan",
        msg: "Plan is required.",
      },
      { path: "quantity", msg: "Quantity is required." },
      { path: "txn_type", msg: "Transaction type is required." },
    ];

    const errors = validateForm(formData, validationRules);

    if (errors.length) {
      setErrors(errors);
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirm = (txn_password) => {
    setSubmitting(true);

    const submitData = { ...formData, txn_password };

    console.log("submitData", submitData);
    createEPinForEPUser(submitData, navigate).finally(() => {
      setSubmitting(false);
      setShowConfirmModal(false);
    });
  };

  const handleTypeChange = (type) => {
    setFormData({ ...formData, txn_type: type });
  };

  const handleSelect = (key) => (selectedOption) => {
    if (selectedOption?.value === "epin") {
      setFormData({
        ...formData,
        [key]: selectedOption.value,
      });
    }
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
              <h4>Add EP-Keys to EP User</h4>
            </Col>

            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label>Transaction Type*</Form.Label>
                <div className="d-flex gap-3">
                  <Button
                    variant={txn_type === "CR" ? "primary" : "outline-primary"}
                    onClick={() => handleTypeChange("CR")}
                  >
                    Add EPin
                  </Button>
                  <Button
                    variant={txn_type === "DR" ? "danger" : "outline-danger"}
                    onClick={() => handleTypeChange("DR")}
                  >
                    Delete EPin
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

            {/* <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label htmlFor="selectedMethod">Select Plan*</Form.Label>
                <Select
                  id="plan"
                  name="plan"
                  value={ePinTypes.find((each) => each.value === plan)}
                  options={ePinTypes}
                  onChange={handleSelect("plan")}
                />
                <Errors current_key="plan" />
              </Form.Group>
            </Col> */}

            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label htmlFor="quantity">Quantity*</Form.Label>
                <Form.Control
                  className={errorList.quantity ? "invalid" : ""}
                  type="text"
                  id="quantity"
                  name="quantity"
                  value={quantity}
                  onChange={onChange}
                  maxLength={5}
                  onKeyDown={handleNumberInput}
                />
                <Errors current_key="quantity" />
              </Form.Group>
            </Col>

            <Col xs={12} className="text-end">
              <Button
                className="m-2"
                type="submit"
                variant="primary"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm"
                      aria-hidden="true"
                    ></span>
                    {` Loading... `}
                  </>
                ) : (
                  <>Save</>
                )}
              </Button>
              <Button
                className="ml-2"
                type="reset"
                variant="danger"
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
        title="Confirm Transaction"
        body="Please enter your transaction password to confirm."
        submitBtnText="Confirm"
      />
    </Container>
  );
};

EPinForm.propTypes = {
  createEPinForEPUser: PropTypes.func.isRequired,
  errorList: PropTypes.object.isRequired,
  setErrors: PropTypes.func.isRequired,
  removeEPinErrors: PropTypes.func.isRequired,
  getSponsorUserDetails: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  errorList: state.errors,
  EP_User: state.epin.EP_User,
});

export default connect(mapStateToProps, {
  createEPinForEPUser,
  setErrors,
  removeEPinErrors,
  getSponsorUserDetails,
})(EPinForm);
