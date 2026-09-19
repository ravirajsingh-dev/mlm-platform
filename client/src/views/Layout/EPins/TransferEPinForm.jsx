import React, { useState } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Button, Form, Row, Col, Container } from "react-bootstrap";

import { validateForm } from "@src/utils/validation";
import Errors from "@src/notifications/Errors";
import MainCard from "@src/views/Common/Cards/MainCard";

import { handleNumberInput } from "@src/utils/helper";
import VerificationConfirmModal from "@src/views/Common/Modal/VerificationConfirmModal";

import {
  transferEPin,
  setErrors,
  removeEPinErrors,
  getSponsorUserDetails,
} from "@src/actions/ePinActions";
import ButtonLoader from "@src/views/Common/Loaders/ButtonLoader";

const TransferEPinForm = ({
  transferEPin,
  errorList,
  setErrors,
  removeEPinErrors,
  getSponsorUserDetails,
  EP_User,
  loadingEPin, // Use Redux loading state
}) => {
  const navigate = useNavigate();

  const initialFormData = {
    EP_ID: "",
    user_name: "",
    totalEPinCount: "",
    quantity: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const { EP_ID, user_name, totalEPinCount, quantity } = formData;

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
      totalEPinCount: EP_User ? EP_User.epinCount : 0,
    }));
  }, [EP_User]);

  const onChange = (e) => {
    if (!e.target) {
      return;
    }

    const { name, value } = e.target;

    if (
      name === "quantity" &&
      parseInt(value, 10) > parseInt(totalEPinCount, 10)
    ) {
      setErrors([
        {
          path: "quantity",
          msg: `The quantity entered exceeds the available EPin count of ${totalEPinCount}. Please enter a valid quantity.`,
        },
      ]);
      return;
    } else {
      removeEPinErrors();
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    removeEPinErrors();

    let validationRules = [
      { path: "EP_ID", msg: "EP ID is required." },
      { path: "totalEPinCount", msg: "Amount is required." },
      { path: "quantity", msg: "Quantity is required." },
    ];

    const errors = validateForm(formData, validationRules);

    if (parseInt(quantity, 10) > parseInt(totalEPinCount, 10)) {
      errors.push({
        path: "quantity",
        msg: "Quantity cannot exceed total EPin count.",
      });
    }

    if (errors.length) {
      setErrors(errors);
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirm = (txn_password) => {
    const submitData = { ...formData, txn_password };

    transferEPin(submitData, navigate)
      .then(() => {
        setShowConfirmModal(false);
      })
      .catch(() => {
        setShowConfirmModal(true);
      });
  };

  // const handleConfirm = (txn_password) => {
  //   setSubmitting(true);

  //   const submitData = { ...formData, txn_password };

  //   console.log("submitData", submitData);
  //   transferEPin(submitData, navigate).finally(() => {
  //     setSubmitting(false);
  //     setShowConfirmModal(false);
  //   });
  // };

  return (
    <Container>
      <MainCard className="card-body">
        <Form
          onSubmit={onSubmit}
          autoComplete="off"
          className="registration-form"
        >
          <Row className="row-gap-3">
            <Col xs={12} className="card-heading">
              <h4>Transfer EP-Keys</h4>
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

            <Col xs={12} md={6} className="mb-3">
              <Form.Group>
                <Form.Label htmlFor="totalEPinCount">Total EP-Keys*</Form.Label>
                <Form.Control
                  type="text"
                  id="totalEPinCount"
                  name="totalEPinCount"
                  value={totalEPinCount}
                  placeholder="Total EP-Keys Count"
                  disabled
                />
                <Errors current_key="totalEPinCount" />
              </Form.Group>
            </Col>

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
                type="submit"
                className="m-2 theme_btn"
                disabled={loadingEPin || showConfirmModal}
              >
                {loadingEPin ? <ButtonLoader /> : <>Send</>}
              </Button>

              <Button
                className="danger_btn"
                onClick={() => navigate(-1)}
                disabled={loadingEPin || showConfirmModal}
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
          removeEPinErrors();
        }}
        handleConfirm={handleConfirm}
        title="Confirm Transaction"
        body="Please enter your transaction password to confirm."
        submitBtnText="Confirm"
        isLoading={loadingEPin}
      />
    </Container>
  );
};

TransferEPinForm.propTypes = {
  transferEPin: PropTypes.func.isRequired,
  errorList: PropTypes.object.isRequired,
  setErrors: PropTypes.func.isRequired,
  removeEPinErrors: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  errorList: state.errors,
  EP_User: state.epin.EP_User,
  loadingEPin: state.epin.loadingEPin,
});

export default connect(mapStateToProps, {
  transferEPin,
  setErrors,
  removeEPinErrors,
  getSponsorUserDetails,
})(TransferEPinForm);
