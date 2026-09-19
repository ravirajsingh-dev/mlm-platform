import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Image,
  InputGroup,
} from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import { connect } from "react-redux";

// Custom Imports
import { validateForm } from "@src/utils/validation";
import Errors from "@src/notifications/Errors";
import {
  login,
  setErrors,
  removeRegistrationErrors,
  forgotPasswordStep1,
  forgotPasswordStep2,
} from "@src/actions/auth";

// Icons
import { AiOutlineEyeInvisible, AiOutlineEye } from "react-icons/ai";
import { BiLockAlt } from "react-icons/bi";
import { FaRegUser, FaHome } from "react-icons/fa";
import logo from "@assets/img/logo/logo.png";
import { getUserCredentials } from "@src/utils/credentialsHelper";
import ForgotPasswordModal from "../Common/Modal/ForgotPasswordModal";

const Login = ({
  errorList,
  setErrors,
  removeRegistrationErrors,
  login,
  forgotPasswordStep1,
  forgotPasswordStep2,
  auth,
}) => {
  const navigate = useNavigate();

  const initialFormData = {
    EP_ID: "",
    password: "",
    rememberPassword: false,
  };

  const [formData, setFormData] = useState(initialFormData);
  const [validated, setValidated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState("");
  const [forgotPasswordError, setForgotPasswordError] = useState("");

  const { EP_ID, password, rememberPassword } = formData;

  // Get loading states from Redux
  const isVerifying = auth.forgotPasswordStep1Loading;
  const isResetting = auth.forgotPasswordStep2Loading;

  const onChange = (e) => {
    if (!e.target) return;
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    setFormData({ ...formData, [name]: newValue });
  };

  const toggleShowPassword = () => setShowPassword(!showPassword);

  useEffect(() => {
    const storedCredentials = getUserCredentials();
    if (
      storedCredentials?.rememberPassword &&
      storedCredentials?.EP_ID &&
      storedCredentials?.password
    ) {
      setFormData({
        ...formData,
        EP_ID: storedCredentials.EP_ID,
        password: storedCredentials.password,
        rememberPassword: true,
      });
    }
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();
    removeRegistrationErrors();

    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
    }

    setValidated(true);

    const validationRules = [
      { path: "EP_ID", msg: "Please provide a valid user Id." },
      { path: "password", msg: "Please provide a valid password." },
    ];

    const errors = validateForm(formData, validationRules);
    if (errors.length) {
      setErrors(errors);
      return;
    }

    const submitData = Object.fromEntries(
      Object.entries(formData).filter(
        ([_, v]) => v !== "" && v !== null && v !== undefined
      )
    );

    login(submitData, navigate);
  };

  const handleVerifyE2eId = async (EP_ID) => {
    setForgotPasswordError("");
    try {
      const response = await forgotPasswordStep1(EP_ID);
      return response; // Contains maskedPhone
    } catch (err) {
      setForgotPasswordError(err.message);
      throw err;
    }
  };

  const handleResetPassword = async ({ EP_ID, phone }) => {
    setForgotPasswordError("");
    try {
      await forgotPasswordStep2(EP_ID, phone);
      setForgotPasswordSuccess(
        "Your password reset request has been submitted successfully. You'll receive your new password shortly."
      );
    } catch (err) {
      setForgotPasswordError(err.message);
      throw err;
    }
  };

  const handleCloseModal = () => {
    setShowForgotPasswordModal(false);
    setTimeout(() => {
      setForgotPasswordSuccess("");
      setForgotPasswordError("");
    }, 300);
  };

  return (
    <>
      <Container className="auth-container" fluid>
        <Row className="e2e-auth-login ">
          {/* <Col xs={12} className="text-center mb-0">
            <Link to={"/"}>
              <Image src={logo} className="user-register-data-icon" />
            </Link>
          </Col> */}
          <Col
            xs={11}
            sm={11}
            md={6}
            lg={4}
            className="e2e-auth-login-card mt-0"
          >
            <Form
              noValidate
              validated={validated}
              onSubmit={onSubmit}
              className="p-2 my-2 registration-form "
            >
              <Row className="mb-3">
                <Col
                  xs={12}
                  className="d-flex justify-content-center align-items-center mb-2"
                >
                  <Link
                    to="/"
                    className="d-flex align-items-center gap-2 text-decoration-none"
                  >
                    <FaHome size={20} /> Back to Home
                  </Link>
                </Col>
                <Col xs={12} className="user-auth-heading  ">
                  <span className="secondary-color-border">
                    Welcome to EK PAHAL
                  </span>
                </Col>
                <Form.Group as={Col} md="12">
                  <Form.Label htmlFor="EP_ID" className="mb-2 register-lable">
                    <FaRegUser size={20} className="register-lable-icon" />
                    EP ID *
                  </Form.Label>
                  <Row>
                    <Col xs={12}>
                      <Form.Control
                        required
                        type="text"
                        id="EP_ID"
                        name="EP_ID"
                        minLength="9"
                        maxLength="9"
                        value={EP_ID.toLocaleUpperCase()}
                        onChange={(e) => onChange(e)}
                        placeholder="EPXXXXXX"
                        className="text-muted"
                      />

                      <Errors current_key="EP_ID" key="EP_ID" />
                    </Col>
                  </Row>
                </Form.Group>
              </Row>

              <Row className="mb-3">
                <Form.Group as={Col} md="12">
                  <Form.Label htmlFor="password" className="register-lable">
                    <BiLockAlt size={23} className="register-lable-icon" />
                    Password
                  </Form.Label>
                  <InputGroup>
                    <Form.Control
                      required
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      name="password"
                      className={`text-muted ${
                        errorList.password ? "invalid" : ""
                      }`}
                      onChange={(e) => {
                        onChange(e);
                      }}
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

              <div className="d-flex justify-content-between align-items-center mb-3">
                <Form.Group htmlFor="rememberPassword" className="remember-me">
                  <Form.Check
                    label="Remember password"
                    id="rememberPassword"
                    name="rememberPassword"
                    checked={rememberPassword}
                    onChange={(e) => onChange(e)}
                  />
                </Form.Group>

                {/* <Button
                  variant="link"
                  className="p-0"
                  onClick={() => setShowForgotPasswordModal(true)}
                >
                  Forgot Password?
                </Button> */}
              </div>

              <Row className="form-button">
                <Col xs={12} className="text-center py-3">
                  <Button type="submit" className="common_btn w-100">
                    Submit
                  </Button>
                </Col>
              </Row>

              <Row className="form-button">
                <Col xs={12} className="text-center">
                  <span className="">
                    Don't have an account?{" "}
                    <Link to="/register" className="link-register">
                      Register
                    </Link>
                  </span>
                </Col>
              </Row>
            </Form>
          </Col>
        </Row>
      </Container>

      {/* Enhanced Forgot Password Modal */}
      <ForgotPasswordModal
        show={showForgotPasswordModal}
        onHide={handleCloseModal}
        onVerifyE2eId={handleVerifyE2eId}
        onResetPassword={handleResetPassword}
        isVerifying={isVerifying}
        isResetting={isResetting}
        successMessage={forgotPasswordSuccess}
      />
    </>
  );
};

const mapStateToProps = (state) => ({
  errorList: state.errors,
  auth: state.auth,
});

export default connect(mapStateToProps, {
  setErrors,
  removeRegistrationErrors,
  login,
  forgotPasswordStep1,
  forgotPasswordStep2,
})(Login);
