import React, { useState } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Button, Form, Row, Col, Container } from "react-bootstrap";
import CustomSelect from "@src/view/commonComponents/mainCard/CustomSelect";

import { validateForm } from "@src/utils/validation";
import Errors from "@src/notifications/Errors";
import MainCard from "@src/view/commonComponents/mainCard/MainCard";
import VerificationConfirmModal from "../../modals/VerificationConfirmModal";

import {
  createFirstPayUser,
  setErrors,
  removeFirstPayUserErrors,
  checkAvailableityOfUserPendingLink,
  fetchAvailableLevelsList,
  resetComponentStore,
} from "@src/actions/adminFirstPayUserActions";

const FirstPayUserForm = ({
  createFirstPayUser,
  errorList,
  setErrors,
  removeFirstPayUserErrors,
  checkAvailableityOfUserPendingLink,
  EP_User,
  fetchAvailableLevelsList,
  resetComponentStore,
  loggedInUser,
  levelsTypeList,
}) => {
  const navigate = useNavigate();

  const initialFormData = {
    level: "",
    EP_ID: "",
    user_name: "",
    pendingLinksCount: 0,
  };

  const [formData, setFormData] = useState(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [onlyOnce, setOnce] = React.useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const { EP_ID, user_name, level, pendingLinksCount } = formData;

  React.useEffect(() => {
    if (EP_ID.length === 9) {
      checkAvailableityOfUserPendingLink(level, EP_ID);
    } else {
      setFormData((prevData) => ({
        ...prevData,
        user_name: "",
        pendingLinksCount: 0,
      }));
    }
  }, [EP_ID, checkAvailableityOfUserPendingLink]);

  React.useEffect(() => {
    if (!EP_User) return;

    setFormData((prevData) => ({
      ...prevData,
      user_name: EP_User ? EP_User?.user?.name : "",
      pendingLinksCount: EP_User ? EP_User?.pendingLinksCount : 0,
    }));
  }, [EP_User]);

  React.useEffect(() => {
    if (onlyOnce) {
      resetComponentStore();
      setOnce(false);
    }

    if (!loggedInUser) return;

    fetchAvailableLevelsList();
  }, [fetchAvailableLevelsList, resetComponentStore, loggedInUser]);

  const onChange = (e) => {
    if (!e.target) {
      return;
    }

    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = (e) => {
    e.preventDefault();
    removeFirstPayUserErrors();

    let validationRules = [
      {
        path: "level",
        msg: "Level is required.",
      },
      {
        path: "EP_ID",
        msg: "EP_ID is required.",
      },
    ];

    const errors = validateForm(formData, validationRules);

    console.log("formData--", formData);

    if (errors.length) {
      setErrors(errors);
      return;
    }

    if (!level || !pendingLinksCount) return;

    setShowConfirmModal(true);
  };

  const handleConfirm = (txn_password) => {
    setSubmitting(true);

    const submitData = { ...formData, txn_password };

    console.log("submitData", submitData);
    createFirstPayUser(submitData, navigate).finally(() => {
      setSubmitting(false);
      setShowConfirmModal(false);
    });
  };

  const handleSelect = (key) => (selectedOption) => {
    if (!key || !selectedOption) {
      setFormData({
        ...formData,
        level: "",
        EP_ID: "",
        user_name: "",
        pendingLinksCount: 0,
      });
      return;
    }

    setFormData((prevData) => ({
      ...prevData,
      [key]: selectedOption.value,
      ...(key === "level" && {
        EP_ID: "",
        user_name: "",
        pendingLinksCount: 0,
      }),
    }));
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
              <h4>Add First-Pay User</h4>
            </Col>

            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label htmlFor="selectedMethod">Level*</Form.Label>

                <CustomSelect
                  className={errorList.level ? "invalid" : ""}
                  options={levelsTypeList?.length ? levelsTypeList : []}
                  selectedValue={(selectedOption) => {
                    handleSelect("level")(selectedOption);
                  }}
                  defaultValue={
                    Array.isArray(levelsTypeList) && levelsTypeList.length
                      ? levelsTypeList.find(
                          (each) => each.value === formData.level
                        )
                      : null
                  }
                />

                <Errors current_key="level" />
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
                  className={errorList.EP_ID ? "invalid" : ""}
                  value={EP_ID.toUpperCase()}
                  onChange={(e) => onChange(e)}
                  placeholder="Please enter EP ID"
                  disabled={formData.level === 0}
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
                <Form.Label htmlFor="pendingLinksCount">Links Count</Form.Label>
                <Form.Control
                  className={errorList.pendingLinksCount ? "invalid" : ""}
                  type="text"
                  id="pendingLinksCount"
                  name="pendingLinksCount"
                  value={pendingLinksCount || 0}
                  disabled
                />
                <Errors current_key="pendingLinksCount" />
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
                onClick={() => {
                  setFormData(initialFormData);
                  navigate(-1);
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
        handleClose={() => setShowConfirmModal(false)}
        handleConfirm={handleConfirm}
        title="Confirm Transaction"
        body="Please enter your transaction password to confirm."
        submitBtnText="Confirm"
      />
    </Container>
  );
};

FirstPayUserForm.propTypes = {
  createFirstPayUser: PropTypes.func.isRequired,
  errorList: PropTypes.object.isRequired,
  setErrors: PropTypes.func.isRequired,
  removeFirstPayUserErrors: PropTypes.func.isRequired,
  checkAvailableityOfUserPendingLink: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  errorList: state.errors,
  EP_User: state.firstPayUser.EP_User,
  levelsTypeList: state.firstPayUser.levelsTypeList,
  loggedInUser: state.adminAuth.admin,
});

export default connect(mapStateToProps, {
  createFirstPayUser,
  setErrors,
  removeFirstPayUserErrors,
  checkAvailableityOfUserPendingLink,
  fetchAvailableLevelsList,
  resetComponentStore,
})(FirstPayUserForm);
