import React, { useEffect, useState } from "react";
import { PropTypes } from "prop-types";
import { connect } from "react-redux";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";

// icons
import { MdEdit } from "react-icons/md";
import { FaRegEye } from "react-icons/fa";

// custom imports
import MainCard from "@src/view/commonComponents/mainCard/MainCard";
import { validateForm } from "@src/utils/validation";
import { setErrors } from "@src/actions/adminAuth";
import Errors from "@src/notifications/Errors";
import AppBreadCrumb from "@src/view/commonComponents/dataTable/AppBreadCrumb";
import { generateTimeOptions } from "@src/utils/helper";
import {
  upsertWithdrawalDefaultValues,
  getAllWithdrawalDefaultValues,
  resetComponentStore,
} from "@src/actions/adminWithdrawalDefaultValueActions";
import adminWithdrawalDefaultValuesReducer from "@src/reducers/adminWithdrawalDefaultValuesReducer";
import BouncingLoader from "@src/view/spinners/BouncingLoader";

const AdminWithdrawalDefaultValues = ({
  setErrors,
  errorList,
  upsertWithdrawalDefaultValues,
  getAllWithdrawalDefaultValues,
  resetComponentStore,
  adminWithdrawalDefaultValues: {
    withdrawalDefaultValuesList,
    loadingWithdrawalDefaultValues,
  },
}) => {
  const navigate = useNavigate();
  const { user_id } = useParams();

  const initialFormData = {
    withdrawalStartTime: "",
    withdrawalEndTime: "",
    dailyTransactionLimit: "",
    minWithdrawalAmount: "",
    maxWithdrawalAmount: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [isDisabled, setDisabled] = useState(true);
  const [validated, setValidated] = useState(false);
  const [onlyOnce, setOnce] = useState(true);
  const [withdrawalDefaultValueID, setWithdrawalDefaultValueID] =
    useState(null);

  const toggleEdit = () => setDisabled(!isDisabled);

  const {
    withdrawalStartTime,
    withdrawalEndTime,
    dailyTransactionLimit,
    minWithdrawalAmount,
    maxWithdrawalAmount,
  } = formData;

  useEffect(() => {
    if (onlyOnce) {
      resetComponentStore();
      setOnce(false);
    }

    getAllWithdrawalDefaultValues();
  }, [getAllWithdrawalDefaultValues, resetComponentStore]);

  useEffect(() => {
    if (
      !withdrawalDefaultValuesList ||
      !withdrawalDefaultValuesList.data.length
    )
      return;

    const withdrawalDefaultValuesListData = withdrawalDefaultValuesList.data[0];

    setWithdrawalDefaultValueID(withdrawalDefaultValuesListData._id);

    setFormData({ ...withdrawalDefaultValuesListData });
  }, [withdrawalDefaultValuesList]);

  const onChange = (e) => {
    if (!e.target) {
      return;
    }

    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = (e) => {
    e.preventDefault();

    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
    }

    setValidated(true);
    setSubmitting(true);

    let validationRules = [
      {
        path: "withdrawalStartTime",
        msg: "Please provide a valid withdrawal start time.",
      },
      {
        path: "withdrawalEndTime",
        msg: "Please provide a valid withdrawal end time.",
      },
      {
        path: "dailyTransactionLimit",
        msg: "Please provide a valid daily transaction limit.",
      },
      {
        path: "minWithdrawalAmount",
        msg: "Please provide a valid min withdrawal amount.",
      },
      {
        path: "maxWithdrawalAmount",
        msg: "Please provide a valid max withdrawal amount.",
      },
    ];

    const errors = validateForm(formData, validationRules);

    // Custom validation for withdrawal times
    if (withdrawalStartTime && withdrawalEndTime) {
      const startTime = new Date(`1970-01-01T${withdrawalStartTime}:00Z`);
      const endTime = new Date(`1970-01-01T${withdrawalEndTime}:00Z`);
      if (startTime >= endTime) {
        errors.push({
          path: "withdrawalEndTime",
          msg: "Withdrawal end time must be later than start time.",
        });
      }
    }

    if (errors.length) {
      setErrors(errors);
      return;
    }

    const submitData = {};

    for (let i in formData) {
      if (
        formData[i] === "" ||
        formData[i] === null ||
        formData[i] === undefined
      )
        continue;
      submitData[i] = formData[i];
    }

    // Upsert the withdrawal default values
    upsertWithdrawalDefaultValues(submitData, withdrawalDefaultValueID);

    setSubmitting(false);
    setDisabled(true);
  };

  const onClickCancel = (e) => {
    e.preventDefault();
    toggleEdit();
  };

  const timeOptions = generateTimeOptions();

  // Filter end time options based on start time
  const filteredEndTimeOptions = withdrawalStartTime
    ? timeOptions.filter((time) => time > withdrawalStartTime)
    : timeOptions;

  return (
    <Container>
      <AppBreadCrumb
        pageTitle="Withdrawal Default Values"
        crumbs={[{ name: "Withdrawal Default Values" }]}
      />
      {loadingWithdrawalDefaultValues ? (
        <BouncingLoader />
      ) : (
        <MainCard className="card-body">
          <Form onSubmit={(e) => onSubmit(e)} autoComplete="off">
            <Row className="row-gap-3">
              <Col xs={12} className="card-heading mb-3">
                <Col xs={8} className="header-title">
                  Withdrawal Default Values
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
                  <Form.Label htmlFor="withdrawalStartTime">
                    Withdrawal Start Time <span>*</span>
                  </Form.Label>

                  <Form.Control
                    as="select"
                    className={errorList.withdrawalStartTime ? "invalid" : ""}
                    id="withdrawalStartTime"
                    name="withdrawalStartTime"
                    value={withdrawalStartTime}
                    onChange={(e) => onChange(e)}
                    disabled={isDisabled}
                  >
                    <option value="">Select Time</option>
                    {timeOptions.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </Form.Control>

                  <Errors
                    current_key="withdrawalStartTime"
                    key="withdrawalStartTime"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={6} lg={4}>
                <Form.Group className="form-group">
                  <Form.Label htmlFor="withdrawalEndTime">
                    Withdrawal End Time <span>*</span>
                  </Form.Label>

                  <Form.Control
                    as="select"
                    className={errorList.withdrawalEndTime ? "invalid" : ""}
                    id="withdrawalEndTime"
                    name="withdrawalEndTime"
                    value={withdrawalEndTime}
                    onChange={(e) => onChange(e)}
                    disabled={isDisabled}
                  >
                    <option value="">Select Time</option>
                    {filteredEndTimeOptions.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </Form.Control>
                  <Errors
                    current_key="withdrawalEndTime"
                    key="withdrawalEndTime"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={6} lg={4}>
                <Form.Group className="form-group">
                  <Form.Label htmlFor="dailyTransactionLimit">
                    Daily Transaction Limit <span>*</span>
                  </Form.Label>

                  <Form.Control
                    className={errorList.dailyTransactionLimit ? "invalid" : ""}
                    type="text"
                    id="dailyTransactionLimit"
                    name="dailyTransactionLimit"
                    maxLength="2"
                    value={dailyTransactionLimit}
                    onChange={(e) => onChange(e)}
                    disabled={isDisabled}
                    onKeyPress={(event) => {
                      if (!/[0-9]/.test(event.key)) {
                        event.preventDefault();
                      }
                    }}
                  />
                  <Errors
                    current_key="dailyTransactionLimit"
                    key="dailyTransactionLimit"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={6} lg={4}>
                <Form.Group className="form-group">
                  <Form.Label htmlFor="minWithdrawalAmount">
                    Min Withdrawal Amount <span>*</span>
                  </Form.Label>

                  <Form.Control
                    className={errorList.minWithdrawalAmount ? "invalid" : ""}
                    type="text"
                    id="minWithdrawalAmount"
                    name="minWithdrawalAmount"
                    maxLength="5"
                    value={minWithdrawalAmount}
                    onChange={(e) => onChange(e)}
                    disabled={isDisabled}
                    onKeyPress={(event) => {
                      if (!/[0-9]/.test(event.key)) {
                        event.preventDefault();
                      }
                    }}
                  />
                  <Errors
                    current_key="minWithdrawalAmount"
                    key="minWithdrawalAmount"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={6} lg={4}>
                <Form.Group className="form-group">
                  <Form.Label htmlFor="maxWithdrawalAmount">
                    Max Withdrawal Amount <span>*</span>
                  </Form.Label>

                  <Form.Control
                    className={errorList.maxWithdrawalAmount ? "invalid" : ""}
                    type="text"
                    id="maxWithdrawalAmount"
                    name="maxWithdrawalAmount"
                    maxLength="6"
                    value={maxWithdrawalAmount}
                    onChange={(e) => onChange(e)}
                    disabled={isDisabled}
                    onKeyPress={(event) => {
                      if (!/[0-9]/.test(event.key)) {
                        event.preventDefault();
                      }
                    }}
                  />
                  <Errors
                    current_key="maxWithdrawalAmount"
                    key="maxWithdrawalAmount"
                  />
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
          </Form>
        </MainCard>
      )}
    </Container>
  );
};

const mapStateToProps = (state) => ({
  errorList: state.errors,
  adminWithdrawalDefaultValues: state.adminWithdrawalDefaultValues,
});

export default connect(mapStateToProps, {
  setErrors,
  resetComponentStore,
  upsertWithdrawalDefaultValues,
  getAllWithdrawalDefaultValues,
})(AdminWithdrawalDefaultValues);
