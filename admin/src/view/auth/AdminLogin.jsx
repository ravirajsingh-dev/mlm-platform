import React, { useEffect, useState } from "react";
import {
  Row,
  Col,
  Button,
  Form,
  InputGroup,
  Image,
  Container,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { connect } from "react-redux";

// Custom Imports
import { validateForm } from "@src/utils/validation";
import Errors from "@src/notifications/Errors";
import {
  adminLogin,
  setErrors,
  removeAdminLoginErrors,
} from "@src/actions/adminAuth";
import { getAdminCredentials } from "@src/utils/credentialsHelper";

// Icons
import { AiOutlineEyeInvisible, AiOutlineEye } from "react-icons/ai";
import { FaRegUser } from "react-icons/fa";
import { BiLockAlt } from "react-icons/bi";
import logo from "@assets/images/logo/logo.png";

const AdminLogin = ({
  errorList,
  setErrors,
  removeAdminLoginErrors,
  adminLogin,
}) => {
  const navigate = useNavigate();

  const initialFormData = {
    admin_id: "",
    password: "",
    rememberPassword: false,
  };

  const [formData, setFormData] = useState(initialFormData);
  const [validated, setValidated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { admin_id, password, rememberPassword } = formData;

  const toggleShowPassword = () => setShowPassword(!showPassword);

  useEffect(() => {
    const storedCredentials = getAdminCredentials();
    if (
      storedCredentials?.rememberPassword &&
      storedCredentials?.admin_id &&
      storedCredentials?.password
    ) {
      setFormData({
        ...formData,
        admin_id: storedCredentials.admin_id,
        password: storedCredentials.password,
        rememberPassword: true,
      });
    }
  }, []);

  const onChange = (e) => {
    if (!e.target) {
      return;
    }
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    const newFormData = { ...formData, [name]: newValue };
    setFormData(newFormData);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    removeAdminLoginErrors();

    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
    }

    setValidated(true);

    let validationRules = [
      {
        path: "admin_id",
        msg: "Please provide a valid Admin ID.",
      },
      {
        path: "password",
        msg: "Please provide a valid password.",
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

    // do validation here
    adminLogin(submitData, navigate);
  };

  return (
    <Container className="auth-container" fluid>
      <Row className="e2e-auth-login ">
        <Col xs={12} className="text-center mb-0">
          <Image src={logo} className="user-register-data-icon" />
        </Col>
        <Col xs={11} sm={11} md={6} lg={4} className="e2e-auth-login-card mt-0">
          <Form
            noValidate
            validated={validated}
            onSubmit={onSubmit}
            className="p-2 my-2 registration-form"
          >
            <Row className="mb-4">
              <Col xs={12} className="user-auth-heading  ">
                <span className="secondary-color-border">Admin Login</span>
              </Col>
              <Form.Group as={Col} md="12">
                <Form.Label htmlFor="admin_id" className="auth-lable">
                  <FaRegUser size={20} className="auth-lable-icon" />
                  Admin ID
                </Form.Label>
                <Row>
                  <Col xs={12}>
                    <Form.Control
                      required
                      type="text"
                      id="admin_id"
                      name="admin_id"
                      value={admin_id}
                      maxLength="15"
                      minLength="8"
                      onChange={(e) => onChange(e)}
                      placeholder="Please enter Admin ID"
                      className={`text-muted ${
                        errorList.admin_id ? "invalid" : ""
                      }`}
                    />
                    <Errors current_key="admin_id" key="admin_id" />
                  </Col>
                </Row>
              </Form.Group>
            </Row>
            <Row className="mb-3">
              <Form.Group as={Col} md="12">
                <Form.Label htmlFor="password" className="auth-lable">
                  <BiLockAlt size={23} className="auth-lable-icon" />
                  Password
                </Form.Label>
                <InputGroup>
                  <Form.Control
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                    id="password"
                    name="password"
                    className={`text-muted ${
                      errorList.password ? "invalid" : ""
                    }`}
                    onChange={(e) => onChange(e)}
                    placeholder="Password"
                  />
                  <InputGroup.Text
                    className="show-password-icon text-muted"
                    onClick={toggleShowPassword}
                  >
                    {showPassword ? (
                      <AiOutlineEye size={20} />
                    ) : (
                      <AiOutlineEyeInvisible size={20} />
                    )}
                  </InputGroup.Text>
                  <Errors current_key="password" key="password" />
                </InputGroup>
              </Form.Group>
            </Row>

            <Form.Group className="mb-3 remember-me" htmlFor="rememberPassword">
              <Form.Check
                label="Remember password"
                feedback="You must agree before submitting."
                feedbackType="invalid"
                className="text-muted"
                id="rememberPassword"
                name="rememberPassword"
                checked={rememberPassword}
                onChange={(e) => onChange(e)}
              />
            </Form.Group>

            <Row className="form-button">
              <Col xs={12} className="text-center">
                <Button type="submit" className="default-auth-button">
                  Login
                </Button>
              </Col>
            </Row>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

const mapStateToProps = (state) => ({
  errorList: state.errors,
});

export default connect(mapStateToProps, {
  setErrors,
  removeAdminLoginErrors,
  adminLogin,
})(AdminLogin);
