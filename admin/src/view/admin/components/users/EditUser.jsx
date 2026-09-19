import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Form, Row, Col } from "react-bootstrap";

import { MdEdit } from "react-icons/md";
import { FaRegEye } from "react-icons/fa";

import { validateForm } from "@src/utils/validation";
import Errors from "@src/notifications/Errors";
import { STATES_DISTRICTS } from "@src/constants/CustomSelectValues";

import {
  editUser,
  cancelSave,
  setErrors,
  removeUserErrors,
  resetComponentStore,
  getUserById,
} from "@actions/adminUserActions";
import MainCard from "@src/view/commonComponents/mainCard/MainCard";
import Spinner from "@src/view/spinners/Spinner";

const EditUser = ({
  editUser,
  errorList,
  currentUser,
  setErrors,
  removeUserErrors,
  getUserById,
  loadingUser,
}) => {
  const navigate = useNavigate();
  const { user_id } = useParams();

  const initialFormData = {
    name: "",
    phone: "",
    passCopy: "",
    txnPassCopy: "",
    status: "",
    state: "",
    city: "",
    newPassword: "",
    newTxnPassword: "",
  };
  const [formData, setFormData] = React.useState(initialFormData);
  const [districtOptions, setDistrictOptions] = React.useState([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [isDisabled, setDisabled] = React.useState(true);
  const [showSetLoginPassword, setShowSetLoginPassword] = React.useState(false);
  const [showSetTxnPassword, setShowSetTxnPassword] = React.useState(false);
  const toggleEdit = () => setDisabled(!isDisabled);

  const loadUserFormData = (currentUser) => {
    const { name, phone, passCopy, txnPassCopy, status, state, city } =
      currentUser;

    const data = {
      name,
      phone,
      passCopy,
      txnPassCopy,
      status,
      state: state || "",
      city: city || "",
      newPassword: "",
      newTxnPassword: "",
    };
    setFormData((formData) => ({ ...formData, ...data }));
  };

  React.useEffect(() => {
    if (!user_id) return;
    getUserById(user_id);
  }, [getUserById, user_id]);

  React.useEffect(() => {
    if (!currentUser) return;
    loadUserFormData(currentUser);
  }, [currentUser]);

  React.useEffect(() => {
    const country = currentUser?.country || "IN";
    if (country === "IN" && formData.state) {
      const selectedState = STATES_DISTRICTS.find(
        (stateObj) => stateObj.state === formData.state
      );
      setDistrictOptions(selectedState ? selectedState.districts : []);
    } else {
      setDistrictOptions([]);
    }
  }, [currentUser?.country, formData.state]);

  const {
    name,
    phone,
    passCopy,
    txnPassCopy,
    status,
    state,
    city,
    newPassword,
    newTxnPassword,
  } = formData;
  const epId = currentUser?.EP_ID || "";

  const onChange = (e) => {
    if (!e.target) return;
    const fieldName = e.target.name;
    const value = e.target.value;
    // When state changes, clear district since it may be invalid for new state
    if (fieldName === "state" && (currentUser?.country || "IN") === "IN") {
      setFormData({ ...formData, [fieldName]: value, city: "" });
    } else {
      setFormData({ ...formData, [fieldName]: value });
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    removeUserErrors();

    let validationRules = [
      { path: "name", msg: "Name is required." },
      { path: "phone", msg: "Phone is required." },
      { path: "status", msg: "Status is required." },
    ];
    const country = currentUser?.country || "IN";
    if (country === "IN") {
      validationRules.push({ path: "state", msg: "State is required." });
      validationRules.push({ path: "city", msg: "District is required." });
    }

    // ADDED PASSWORD VALIDATIONS WHEN VISIBLE
    if (showSetLoginPassword) {
      validationRules.push({
        path: "newPassword",
        msg: "Login password is required.",
      });
    }

    if (showSetTxnPassword) {
      validationRules.push({
        path: "newTxnPassword",
        msg: "Transaction password is required.",
      });
    }

    const errors = validateForm(formData, validationRules);
    if (errors.length) {
      setErrors(errors);
      return;
    }

    const submitData = {};
    for (let i in formData) {
      // DON'T SEND EMPTY VALUES OR PASSWORD FIELDS UNLESS CHANGING
      if (
        formData[i] === "" ||
        formData[i] === null ||
        formData[i] === undefined
      )
        continue;

      // ONLY INCLUDE NEW PASSWORDS IF THEY WERE SET
      if (i === "newPassword" && !showSetLoginPassword) continue;
      if (i === "newTxnPassword" && !showSetTxnPassword) continue;

      submitData[i] = formData[i];
    }

    setSubmitting(true);
    editUser(submitData, navigate, user_id).then((res) => {
      setSubmitting(false);
      toggleEdit();
      // RESET PASSWORD FIELDS AFTER SUBMIT
      setShowSetLoginPassword(false);
      setShowSetTxnPassword(false);
      setFormData((prev) => ({
        ...prev,
        newPassword: "",
        newTxnPassword: "",
      }));
    });
  };

  const onClickCancel = (e) => {
    e.preventDefault();
    loadUserFormData(currentUser);
    toggleEdit();
    // RESET PASSWORD FIELDS
    setShowSetLoginPassword(false);
    setShowSetTxnPassword(false);
  };

  // ADDED: TOGGLE PASSWORD FIELDS
  const toggleLoginPasswordField = () => {
    setShowSetLoginPassword(!showSetLoginPassword);
    if (showSetLoginPassword) {
      // RESET PASSWORD WHEN HIDING
      setFormData((prev) => ({ ...prev, newPassword: "" }));
    }
  };

  const toggleTxnPasswordField = () => {
    setShowSetTxnPassword(!showSetTxnPassword);
    if (showSetTxnPassword) {
      // RESET PASSWORD WHEN HIDING
      setFormData((prev) => ({ ...prev, newTxnPassword: "" }));
    }
  };

  return (
    <MainCard className="card-body">
      <Form onSubmit={(e) => onSubmit(e)} autoComplete="off">
        {!loadingUser ? (
          <Row className="row-gap-3">
            <Col xs={12} className="card-heading mb-3">
              <Col xs={8} className="header-title">
                User Information
              </Col>
              <Col>
                <Button
                  variant="link"
                  size="sm"
                  className="float-end"
                  onClick={toggleEdit}
                >
                  {isDisabled ? (
                    <span>
                      <MdEdit title="Click to Edit" size={20} />
                    </span>
                  ) : (
                    <span>
                      <FaRegEye title="View mode" size={20} />
                    </span>
                  )}
                </Button>
              </Col>
            </Col>
            <Col xs={12} md={6} lg={4}>
              <Form.Group className="form-group">
                <Form.Label htmlFor="epId">EP ID</Form.Label>
                <Form.Control
                  type="text"
                  id="epId"
                  value={epId}
                  readOnly
                  className="bg-light"
                />
              </Form.Group>
            </Col>
            <Col xs={12} md={6} lg={4}>
              <Form.Group className="form-group">
                <Form.Label htmlFor="name">
                  Name <span>*</span>
                </Form.Label>

                <Form.Control
                  className={errorList.name ? "invalid" : ""}
                  type="text"
                  id="name"
                  name="name"
                  maxLength="100"
                  value={name}
                  onChange={(e) => onChange(e)}
                  disabled={isDisabled}
                />
                <Errors current_key="name" key="name" />
              </Form.Group>
            </Col>

            <Col xs={12} md={6} lg={4}>
              <Form.Group className="form-group">
                <Form.Label htmlFor="phone">
                  Phone <span>*</span>
                </Form.Label>

                <Form.Control
                  className={errorList.phone ? "invalid" : ""}
                  type="tel"
                  id="phone"
                  name="phone"
                  maxLength="10"
                  minLength="10"
                  value={phone}
                  onChange={(e) => onChange(e)}
                  disabled={isDisabled}
                  onKeyPress={(event) => {
                    if (!/[0-9]/.test(event.key)) {
                      event.preventDefault();
                    }
                  }}
                />

                <Errors current_key="phone" key="phone" />
              </Form.Group>
            </Col>

            {/* STATE & DISTRICT */}
            {(currentUser?.country || "IN") === "IN" ? (
              <>
                <Col xs={12} md={6} lg={4}>
                  <Form.Group className="form-group">
                    <Form.Label htmlFor="state">
                      State <span>*</span>
                    </Form.Label>
                    <Form.Select
                      className={errorList.state ? "invalid" : ""}
                      id="state"
                      name="state"
                      value={state || ""}
                      onChange={(e) => onChange(e)}
                      disabled={isDisabled}
                    >
                      <option value="">Select State</option>
                      {STATES_DISTRICTS.map((stateObj, index) => (
                        <option key={index} value={stateObj.state}>
                          {stateObj.state}
                        </option>
                      ))}
                    </Form.Select>
                    <Errors current_key="state" key="state" />
                  </Form.Group>
                </Col>
                <Col xs={12} md={6} lg={4}>
                  <Form.Group className="form-group">
                    <Form.Label htmlFor="city">
                      District <span>*</span>
                    </Form.Label>
                    <Form.Select
                      className={errorList.city ? "invalid" : ""}
                      id="city"
                      name="city"
                      value={city || ""}
                      onChange={(e) => onChange(e)}
                      disabled={isDisabled}
                    >
                      <option value="">Select District</option>
                      {districtOptions.map((district, index) => (
                        <option key={index} value={district}>
                          {district}
                        </option>
                      ))}
                    </Form.Select>
                    <Errors current_key="city" key="city" />
                  </Form.Group>
                </Col>
              </>
            ) : (
              <>
                <Col xs={12} md={6} lg={4}>
                  <Form.Group className="form-group">
                    <Form.Label htmlFor="state">State</Form.Label>
                    <Form.Control
                      className={errorList.state ? "invalid" : ""}
                      type="text"
                      id="state"
                      name="state"
                      value={state || ""}
                      onChange={(e) => onChange(e)}
                      disabled={isDisabled}
                    />
                    <Errors current_key="state" key="state" />
                  </Form.Group>
                </Col>
                <Col xs={12} md={6} lg={4}>
                  <Form.Group className="form-group">
                    <Form.Label htmlFor="city">District</Form.Label>
                    <Form.Control
                      className={errorList.city ? "invalid" : ""}
                      type="text"
                      id="city"
                      name="city"
                      value={city || ""}
                      onChange={(e) => onChange(e)}
                      disabled={isDisabled}
                    />
                    <Errors current_key="city" key="city" />
                  </Form.Group>
                </Col>
              </>
            )}

            {/* LOGIN PASSWORD FIELD */}
            <Col xs={12} md={6} lg={4}>
              <Form.Group className="form-group">
                <Form.Label htmlFor="passCopy">
                  Login Password {showSetLoginPassword && <span>*</span>}
                </Form.Label>

                {showSetLoginPassword ? (
                  <div className="d-flex">
                    <Form.Control
                      className={errorList.newPassword ? "invalid" : ""}
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={newPassword}
                      onChange={(e) => onChange(e)}
                      placeholder="Enter new password"
                      disabled={isDisabled}
                    />
                    <Button
                      variant="secondary"
                      className="ms-2"
                      onClick={toggleLoginPasswordField}
                      disabled={isDisabled}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="d-flex">
                    <Form.Control
                      type="text"
                      value={passCopy}
                      disabled={true}
                    />
                    <Button
                      variant="secondary"
                      className="ms-2"
                      onClick={toggleLoginPasswordField}
                      disabled={isDisabled}
                    >
                      Set
                    </Button>
                  </div>
                )}
                <Errors current_key="newPassword" key="newPassword" />
              </Form.Group>
            </Col>

            {/* TRANSACTION PASSWORD FIELD */}
            <Col xs={12} md={6} lg={4}>
              <Form.Group className="form-group">
                <Form.Label htmlFor="txnPassCopy">
                  Txn Password {showSetTxnPassword && <span>*</span>}
                </Form.Label>

                {showSetTxnPassword ? (
                  <div className="d-flex">
                    <Form.Control
                      className={errorList.newTxnPassword ? "invalid" : ""}
                      type="password"
                      id="newTxnPassword"
                      name="newTxnPassword"
                      value={newTxnPassword}
                      onChange={(e) => onChange(e)}
                      placeholder="Enter new transaction password"
                      disabled={isDisabled}
                    />
                    <Button
                      variant="secondary"
                      className="ms-2"
                      onClick={toggleTxnPasswordField}
                      disabled={isDisabled}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="d-flex">
                    <Form.Control
                      type="text"
                      value={txnPassCopy}
                      disabled={true}
                    />
                    <Button
                      variant="secondary"
                      className="ms-2"
                      onClick={toggleTxnPasswordField}
                      disabled={isDisabled}
                    >
                      Set
                    </Button>
                  </div>
                )}
                <Errors current_key="newTxnPassword" key="newTxnPassword" />
              </Form.Group>
            </Col>

            <Col xs={12} md={6} lg={4}>
              <Form.Group className="form-group">
                <Form.Label htmlFor="status">
                  Status <span>*</span>
                </Form.Label>
                <Form.Select
                  className={errorList.status ? "invalid" : ""}
                  id="status"
                  name="status"
                  value={status}
                  onChange={(e) => onChange(e)}
                  disabled={isDisabled}
                >
                  <option value="">Select Status</option>
                  <option value="1">Active</option>
                  <option value="2">Inactive</option>
                  <option value="3">New</option>
                  <option value="4">Temporary Blocked</option>
                </Form.Select>
                <Errors current_key="status" key="status" />
              </Form.Group>
            </Col>

            <Col xs={12} className="text-end">
              <Button
                className="m-2"
                type="submit"
                variant="primary"
                disabled={submitting || isDisabled}
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
                onClick={onClickCancel}
                disabled={submitting || isDisabled}
              >
                Cancel
              </Button>
            </Col>
          </Row>
        ) : (
          <Spinner />
        )}
      </Form>
    </MainCard>
  );
};

EditUser.propTypes = {
  editUser: PropTypes.func.isRequired,
  errorList: PropTypes.object.isRequired,
  cancelSave: PropTypes.func.isRequired,
  getUserById: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  errorList: state.errors,
  loadingUser: state.adminUsers.loadingUser,
  currentUser: state.adminUsers.currentUser,
});

export default connect(mapStateToProps, {
  editUser,
  cancelSave,
  setErrors,
  removeUserErrors,
  resetComponentStore,
  getUserById,
})(EditUser);
