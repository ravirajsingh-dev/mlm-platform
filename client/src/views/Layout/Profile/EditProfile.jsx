import React, { useEffect, useState } from "react";
import { Col, Container, Row, Button, Form } from "react-bootstrap";
import { PropTypes } from "prop-types";
import { connect } from "react-redux";

// icons
import { MdEdit } from "react-icons/md";
import { FaRegEye } from "react-icons/fa";

// custom imports
import MainCard from "@src/views/Common/Cards/MainCard";
import { validateForm } from "@src/utils/validation";
import { setErrors } from "@src/actions/auth";
import Errors from "@src/notifications/Errors";
import { updateUserById } from "@src/actions/userActions";

const EditProfile = ({
  updateUserById,
  setErrors,
  errorList,
  closeEditSec,
  user,
}) => {
  const initialFormData = {
    name: "",
    phone: "",
    state: "",
  };

  const [formData, setFormData] = React.useState(initialFormData);
  const [submitting, setSubmitting] = React.useState(false);
  const [validated, setValidated] = useState(false);
  const [isDisabled, setDisabled] = React.useState(true);
  const toggleEdit = () => setDisabled(!isDisabled);

  const { name, phone, state } = formData;

  const onChange = (e) => {
    if (!e.target) {
      return;
    }

    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    if (!user) return;

    if (user?.name) {
      setFormData({
        ...formData,
        name: user.name || "",
        phone: user.phone || "",
        state: user.state || "",
      });
    }
  }, [user]);

  const onSubmit = (e) => {
    e.preventDefault();

    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
    }

    setValidated(true);

    let validationRules = [
      {
        path: "name",
        msg: "Please provide a valid name.",
      },
      {
        path: "phone",
        msg: "Please provide a valid phone.",
      },
      {
        path: "state",
        msg: "Please provide a valid state.",
      },
    ];

    const errors = validateForm(formData, validationRules);

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

    const updatedUser = updateUserById(submitData, user._id);

    if (updatedUser) {
      closeEditSec(false);
    }
  };

  const onClickCancel = (e) => {
    e.preventDefault();
    // loadUserFormData(currentUser);
    toggleEdit();
    closeEditSec(false);
  };
  return (
    <Container>
      <MainCard className="card-body">
        <Form
          onSubmit={(e) => onSubmit(e)}
          autoComplete="off"
          validated={validated}
        >
          <Row className="row-gap-3">
            <Col xs={12} className="card-heading mb-3">
              <Col xs={8} className="header-title">
                Edit User
              </Col>
              <Col>
                <Button
                  variant="link"
                  size="sm"
                  className="custom-link-btn"
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
                  type="text"
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
            <Col xs={12} md={6} lg={4}>
              <Form.Group className="form-group">
                <Form.Label htmlFor="state">
                  State <span>*</span>
                </Form.Label>

                <Form.Control
                  className={errorList.state ? "invalid" : ""}
                  type="text"
                  id="state"
                  name="state"
                  maxLength="100"
                  value={state}
                  onChange={(e) => onChange(e)}
                  disabled={isDisabled}
                />

                <Errors current_key="state" key="state" />
              </Form.Group>
            </Col>

            <Col xs={12} className="text-end">
              <Button
                type="submit"
                className="m-2 theme_btn"
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
                className="danger_btn"
                onClick={onClickCancel}
                disabled={submitting || isDisabled}
              >
                Cancel
              </Button>
            </Col>
          </Row>
        </Form>
      </MainCard>
    </Container>
  );
};

EditProfile.propTypes = {
  updateUserById: PropTypes.func.isRequired,
  errorList: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
  errorList: state.errors,
});

export default connect(mapStateToProps, {
  setErrors,
  updateUserById,
})(EditProfile);
