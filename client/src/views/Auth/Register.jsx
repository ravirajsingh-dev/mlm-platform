import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Image,
  InputGroup,
} from "react-bootstrap";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { connect } from "react-redux";
import { v4 as uuidv4 } from "uuid";

// Icons
import { AiOutlineEyeInvisible, AiOutlineEye } from "react-icons/ai";
import { TbPuzzle } from "react-icons/tb";
import logo from "@assets/img/logo/logo.png";
import { FaRegUser, FaHome } from "react-icons/fa";
import { FaRegAddressCard } from "react-icons/fa6";
import { BsSignpost2 } from "react-icons/bs";
import { MdOutlinePhone } from "react-icons/md";
import { IoMailOpenOutline } from "react-icons/io5";
import { GrMapLocation } from "react-icons/gr";
import { IoLocationOutline } from "react-icons/io5";
import { BiLockAlt } from "react-icons/bi";

// Custom Imports
import { validateForm } from "@src/utils/validation";
import Errors from "@src/notifications/Errors";
import {
  register,
  setErrors,
  removeRegistrationErrors,
  getSponsorUserDetails,
} from "@src/actions/auth";

import {
  COUNTRIES_LIST,
  POSITIONS_LIST,
  STATES_DISTRICTS,
} from "@src/constants/CustomSelectValues";
import {
  generateRandomNumberString,
  handleNumberInput,
} from "@src/utils/helper";
import CustomSelect from "../Common/CustomSelect";
import WelcomeModal from "../Common/Modal/WelcomeModal";
import PreLoaderWithText from "../Common/Loaders/PreLoaderWithText";

const Register = ({
  errorList,
  setErrors,
  removeRegistrationErrors,
  register,
  getSponsorUserDetails,
  sponsorUser,
  loadingRegister,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const initialFormData = {
    sponsorEP: "",
    sponsorName: "",
    position: "",
    EPin_ID: "",
    name: "",
    phone: "",
    city: "",
    state: "",
    country: "IN",
    password: "",
    confirmPassword: "",
    terms_accepted: true,
  };

  const [formData, setFormData] = useState(initialFormData);
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [validated, setValidated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [districtOptions, setDistrictOptions] = useState([]);
  const [randomNumber, setRandomNumber] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    generateCaptcha();
  }, []);

  const generateCaptcha = () => {
    const randomNum = generateRandomNumberString(6);
    const newToken = uuidv4();
    setRandomNumber(randomNum);
    setCaptchaToken(newToken);
  };

  const {
    sponsorEP,
    sponsorName,
    position,
    EPin_ID,
    name,
    phone,
    city,
    state,
    country,
    password,
    confirmPassword,
    terms_accepted,
  } = formData;

  const [selectedCountry, setSelectedCountry] = useState(
    COUNTRIES_LIST.find((cntry) => cntry.abbreviation === country) || ""
  );

  const [selectedPosition, setSelectedPosition] = useState(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [registeredUser, setRegisteredUser] = useState({
    name: "",
    epID: "",
    password: "",
  });

  // Track if position came from URL
  const [positionFromUrl, setPositionFromUrl] = useState(false);
  const [sponsorEPFromUrl, setSponsorEPFromUrl] = useState(false);
  const [epinIdFromUrl, setEpinIdFromUrl] = useState(false);

  useEffect(() => {
    // Component cleanup on unmount
    return () => {
      // Reset form state
      setFormData(initialFormData);
      setSelectedCountry(
        COUNTRIES_LIST.find((cntry) => cntry.abbreviation === "IN") || ""
      );
      setSelectedPosition(null);
      setRegisteredUser({ name: "", epID: "", password: "" });

      // Clear Redux errors and sponsor state
      removeRegistrationErrors();
    };
  }, [removeRegistrationErrors]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const referralId = queryParams.get("sponsorEP");
    const positionParam = queryParams.get("position");
    const epinIdParam = queryParams.get("EPin_ID");

    if (referralId && referralId.length === 9) {
      setSponsorEPFromUrl(true);
      setFormData((prevData) => ({
        ...prevData,
        sponsorEP: referralId.toUpperCase(),
      }));
      getSponsorUserDetails(referralId);
    }

    // Handle position parameter
    if (positionParam && ["left", "right"].includes(positionParam)) {
      const posOption = POSITIONS_LIST.find(
        (pos) => pos.abbreviation === positionParam
      );

      if (posOption) {
        setSelectedPosition(posOption);
        setPositionFromUrl(true);
        setFormData((prevData) => ({
          ...prevData,
          position: positionParam,
        }));
      }
    }

    // Handle EPin_ID parameter
    if (epinIdParam) {
      setEpinIdFromUrl(true);
      setFormData((prevData) => ({
        ...prevData,
        EPin_ID: epinIdParam,
      }));
    }
  }, [location.search, getSponsorUserDetails]);

  // Properly handle position selection
  const handlePositionChange = (selectedOption) => {
    setSelectedPosition(selectedOption);
    setFormData((prevData) => ({
      ...prevData,
      position: selectedOption ? selectedOption.abbreviation : "",
    }));

    // Clear URL position flag if user changes it
    if (positionFromUrl) {
      setPositionFromUrl(false);
    }
  };

  useEffect(() => {
    console.log("password", password);
    console.log("confirmPassword", confirmPassword);
  }, [password, confirmPassword]);

  useEffect(() => {
    setFormData((prevData) => ({
      ...prevData,
      position: selectedPosition ? selectedPosition.abbreviation : "",
    }));
  }, [selectedPosition]);

  useEffect(() => {
    setFormData((prevData) => ({
      ...prevData,
      country: selectedCountry ? selectedCountry.abbreviation : "",
    }));
  }, [selectedCountry]);

  useEffect(() => {
    if (country === "IN") {
      const selectedState = STATES_DISTRICTS.find(
        (stateObj) => stateObj.state === state
      );
      setDistrictOptions(selectedState ? selectedState.districts : []);
    } else {
      setDistrictOptions([]);
    }
  }, [country, state]);

  useEffect(() => {
    if (sponsorEP.length === 9) {
      getSponsorUserDetails(sponsorEP);
    }
  }, [sponsorEP, getSponsorUserDetails]);

  // FIXED: Only set sponsorName when we have a valid sponsorEP
  useEffect(() => {
    if (sponsorEP.length === 9 && sponsorUser) {
      setFormData((prevData) => ({
        ...prevData,
        sponsorName: sponsorUser.name,
      }));
    } else if (sponsorEP.length !== 9) {
      // Clear sponsorName when sponsorEP is not 9 characters
      setFormData((prevData) => ({
        ...prevData,
        sponsorName: "",
      }));
    }
  }, [sponsorUser, sponsorEP]);

  const onChange = (e) => {
    if (!e.target) return;

    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    const newFormData = { ...formData, [name]: newValue };
    setFormData(newFormData);

    // Password match check
    if (name === "password" || name === "confirmPassword") {
      setPasswordMatch(
        name === "password" ? value === confirmPassword : password === value
      );
    }

    // Handle sponsor logic
    if (name === "sponsorEP") {
      if (newValue.length === 9) {
        getSponsorUserDetails(newValue);
      } else {
        setFormData((prevData) => ({
          ...prevData,
          sponsorName: "",
        }));
      }
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    removeRegistrationErrors();
    setIsLoading(true);

    const form = e.currentTarget;

    // Frontend form validation + password match check
    if (form.checkValidity() === false || !passwordMatch) {
      e.stopPropagation();
      setIsLoading(false);
      setValidated(true);

      if (!passwordMatch) {
        setErrors([
          { path: "confirmPassword", msg: "Passwords do not match." },
        ]);
      }

      return;
    }

    setValidated(true);

    let validationRules = [
      {
        path: "sponsorEP",
        msg: "Please provide a valid sponsorEP.",
      },
      {
        path: "position",
        msg: "Please provide a valid position.",
      },
      {
        path: "EPin_ID",
        msg: "Please provide a valid EPin_ID.",
      },
      {
        path: "name",
        msg: "Please provide a valid name.",
      },
      {
        path: "phone",
        msg: "Please provide a valid phone number.",
      },
      {
        path: "city",
        msg: "Please provide a valid city.",
      },
      {
        path: "state",
        msg: "Please provide a valid state.",
      },
      {
        path: "country",
        msg: "Please provide a valid country.",
      },
      {
        path: "password",
        msg: "Password must be at least 4 characters.",
        validator: (value) => value.length >= 4,
      },
      {
        path: "confirmPassword",
        msg: "Passwords do not match.",
        validator: (value) => value === formData.password,
      },
      {
        path: "terms_accepted",
        msg: "Terms is required.",
      },
    ];

    const errors = validateForm(formData, validationRules);

    if (errors.length) {
      setErrors(errors);
      setIsLoading(false);
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

    const formDataWithCaptcha = { ...submitData, captchaToken };

    register(formDataWithCaptcha)
      .then((response) => {
        setRegisteredUser({
          name: response?.name,
          epID: response?.EP_ID,
          password: response?.passCopy,
        });
      })
      .catch((error) => {
        console.error("Registration failed:", error);
      });
  };

  const handleCloseWelcomeModal = () => {
    setShowWelcomeModal(false);
    navigate("/login");
  };

  return (
    <>
      {loadingRegister && (
        <div className="loader-overlay">
          <PreLoaderWithText />
        </div>
      )}

      <Container className="auth-container" fluid>
        <Row className="e2e-auth-login">
          {/* <Col xs={12} className="text-center mb-0">
            <Link to={"/"}>
              <Image src={logo} className="user-register-data-icon" />
            </Link>
          </Col> */}
          <Col
            xs={11}
            sm={11}
            md={7}
            lg={5}
            className="e2e-auth-login-card mt-0"
          >
            <Form
              noValidate
              validated={validated}
              onSubmit={onSubmit}
              className="p-2 my-2 registration-form"
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
                <Col xs={12} className="user-auth-heading">
                  <span className="secondary-color-border">
                    Begin Your EK PAHAL
                  </span>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col xs={12} sm={12} md={6} lg={6} className="mb-3">
                  <Form.Group>
                    <Form.Label htmlFor="sponsorEP" className="register-lable">
                      <FaRegAddressCard
                        size={22}
                        className="register-lable-icon"
                      />
                      Sponsor ID *
                    </Form.Label>
                    <Form.Control
                      required
                      type="text"
                      id="sponsorEP"
                      name="sponsorEP"
                      minLength="9"
                      maxLength="9"
                      value={sponsorEP.toUpperCase()}
                      onChange={(e) => onChange(e)}
                      placeholder="Please enter full sponsor ID"
                      className={`text-muted ${
                        errorList.sponsorEP ? "invalid" : ""
                      }`}
                      disabled={sponsorEPFromUrl}
                    />

                    <Errors current_key="sponsorEP" key="sponsorEP" />
                  </Form.Group>
                </Col>

                <Col xs={12} sm={12} md={6} lg={6}>
                  <Form.Group>
                    <Form.Label
                      htmlFor="sponsorName"
                      className="register-lable"
                    >
                      <FaRegUser size={20} className="register-lable-icon" />
                      Sponsor Name
                    </Form.Label>

                    <Form.Control
                      required
                      type="text"
                      id="sponsorName"
                      name="sponsorName"
                      value={sponsorName || ""}
                      placeholder="Sponsor Name"
                      className="text-muted"
                      disabled
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col xs={12}>
                  <Form.Group>
                    <Form.Label htmlFor="position" className="register-lable">
                      <BsSignpost2 size={20} className="register-lable-icon" />
                      Position *
                    </Form.Label>

                    <CustomSelect
                      options={POSITIONS_LIST}
                      selectedValue={handlePositionChange}
                      value={selectedPosition}
                      isDisabled={positionFromUrl}
                    />

                    <Errors current_key="position" key="position" />
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col xs={12}>
                  <Form.Group>
                    <Form.Label htmlFor="EPin_ID" className="register-lable">
                      <FaRegUser size={20} className="register-lable-icon" />
                      EPin ID *
                    </Form.Label>
                    <Form.Control
                      required
                      type="text"
                      id="EPin_ID"
                      name="EPin_ID"
                      value={EPin_ID}
                      onChange={(e) => onChange(e)}
                      placeholder="Please enter EPin_ID "
                      className={`text-muted ${
                        errorList.EPin_ID ? "invalid" : ""
                      }`}
                      disabled={epinIdFromUrl}
                    />
                    {epinIdFromUrl && (
                      <Form.Text className="text-muted">
                        EPin ID provided in referral link
                      </Form.Text>
                    )}
                    <Errors current_key="EPin_ID" key="EPin_ID" />
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col xs={12}>
                  <Form.Group>
                    <Form.Label htmlFor="name" className="register-lable">
                      <FaRegUser size={20} className="register-lable-icon" />
                      Name *
                    </Form.Label>
                    <Form.Control
                      required
                      type="text"
                      id="name"
                      name="name"
                      value={name}
                      onChange={(e) => onChange(e)}
                      placeholder="Please enter full name "
                      className={`text-muted ${
                        errorList.name ? "invalid" : ""
                      }`}
                    />

                    <Errors current_key="name" key="name" />
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col xs={12}>
                  <Form.Group>
                    <Form.Label htmlFor="phoneInput" className="register-lable">
                      <MdOutlinePhone
                        size={24}
                        className="register-lable-icon"
                      />
                      Mobile Number *
                    </Form.Label>
                    <Form.Control
                      required
                      type="text"
                      id="phoneInput"
                      name="phone"
                      value={phone}
                      onChange={(e) => onChange(e)}
                      maxLength="10"
                      minLength="10"
                      placeholder="Please enter phone number"
                      className={`text-muted ${
                        errorList.phone ? "invalid" : ""
                      }`}
                      onKeyDown={handleNumberInput}
                    />
                    <Errors current_key="phone" key="phone" />
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mb-3 d-none">
                <Col xs={12}>
                  <Form.Group>
                    <Form.Label htmlFor="country" className="register-lable">
                      <GrMapLocation
                        size={23}
                        className="register-lable-icon"
                      />
                      Country *
                    </Form.Label>

                    <CustomSelect
                      options={COUNTRIES_LIST}
                      defaultValue={selectedCountry || {}}
                      selectedValue={setSelectedCountry}
                      isCustomLabel={true}
                    />

                    <Errors current_key="country" key="country" />
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col xs={12} sm={12} md={6} lg={6} className="mb-3">
                  <Form.Group>
                    <Form.Label htmlFor="state" className="register-lable">
                      <IoLocationOutline
                        size={23}
                        className="register-lable-icon"
                      />
                      State *
                    </Form.Label>

                    {country === "IN" ? (
                      <Form.Control
                        as="select"
                        id="state"
                        name="state"
                        value={state || ""}
                        onChange={(e) => onChange(e)}
                        className={`text-muted ${
                          errorList.state ? "invalid" : ""
                        }`}
                      >
                        <option value="">Select State</option>
                        {STATES_DISTRICTS.map((stateObj, index) => (
                          <option key={index} value={stateObj.state}>
                            {stateObj.state}
                          </option>
                        ))}
                      </Form.Control>
                    ) : (
                      <Form.Control
                        required
                        type="text"
                        id="state"
                        name="state"
                        value={state}
                        onChange={(e) => onChange(e)}
                        placeholder="Please enter state"
                        className={`text-muted ${
                          errorList.state ? "invalid" : ""
                        }`}
                      />
                    )}

                    <Errors current_key="state" key="state" />
                  </Form.Group>
                </Col>

                <Col xs={12} sm={12} md={6} lg={6} className="mb-3">
                  <Form.Group>
                    <Form.Label htmlFor="city" className="register-lable">
                      <IoLocationOutline
                        size={23}
                        className="register-lable-icon"
                      />
                      District *
                    </Form.Label>

                    {country === "IN" ? (
                      <Form.Control
                        as="select"
                        id="city"
                        name="city"
                        value={city || ""}
                        onChange={(e) => onChange(e)}
                        className={`text-muted ${
                          errorList.city ? "invalid" : ""
                        }`}
                      >
                        <option value="">Select District</option>
                        {districtOptions.map((city, index) => (
                          <option key={index} value={city}>
                            {city}
                          </option>
                        ))}
                      </Form.Control>
                    ) : (
                      <Form.Control
                        required
                        type="text"
                        id="city"
                        name="city"
                        value={city}
                        onChange={(e) => onChange(e)}
                        placeholder="Please enter city"
                        className={`text-muted ${
                          errorList.city ? "invalid" : ""
                        }`}
                      />
                    )}

                    <Errors current_key="city" key="city" />
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col xs={12}>
                  <Form.Group>
                    <Form.Label htmlFor="password" className="register-lable">
                      <BiLockAlt size={23} className="register-lable-icon" />
                      Password *
                    </Form.Label>
                    <InputGroup>
                      <Form.Control
                        required
                        type={showPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        value={password}
                        onChange={onChange}
                        placeholder="Enter Password"
                        className={`text-muted ${
                          errorList.password ? "invalid" : ""
                        }`}
                        minLength={4}
                      />
                      <InputGroup.Text
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ cursor: "pointer" }}
                      >
                        {showPassword ? (
                          <AiOutlineEyeInvisible />
                        ) : (
                          <AiOutlineEye />
                        )}
                      </InputGroup.Text>
                    </InputGroup>

                    <Errors current_key="password" key="password" />
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col xs={12}>
                  <Form.Group>
                    <Form.Label
                      htmlFor="confirmPassword"
                      className="register-lable"
                    >
                      <BiLockAlt size={23} className="register-lable-icon" />
                      Confirm Password *
                    </Form.Label>
                    <InputGroup>
                      <Form.Control
                        required
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={confirmPassword}
                        onChange={onChange}
                        placeholder="Confirm Password"
                        className={`text-muted ${
                          errorList.confirmPassword ? "invalid" : ""
                        }`}
                        minLength={4}
                      />
                      <InputGroup.Text
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        style={{ cursor: "pointer" }}
                      >
                        {showConfirmPassword ? (
                          <AiOutlineEyeInvisible />
                        ) : (
                          <AiOutlineEye />
                        )}
                      </InputGroup.Text>
                    </InputGroup>

                    <Errors
                      current_key="confirmPassword"
                      key="confirmPassword"
                    />
                    {!passwordMatch && (
                      <div className="text-danger mt-1">
                        Passwords do not match
                      </div>
                    )}
                  </Form.Group>
                </Col>
              </Row>
              <Row className="read-and-agree">
                <Col>
                  <Form.Group className="mb-3 d-flex" htmlFor="terms_accepted">
                    <Form.Check
                      required
                      label="I read and agree to Terms & Conditions"
                      feedback="You must agree before submitting."
                      feedbackType="invalid"
                      className={`remember-me ${
                        errorList.terms_accepted ? "invalid" : ""
                      }`}
                      name="terms_accepted"
                      id="terms_accepted"
                      checked={terms_accepted}
                      onChange={(e) => onChange(e)}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row className="form-button">
                <Col xs={12} className="text-center py-3">
                  <Button type="submit" className="common_btn">
                    Register
                  </Button>
                </Col>
              </Row>
              <Row className="form-button">
                <Col xs={12} className="text-center">
                  <span className="">
                    I have an account.{" "}
                    <Link to="/login" className="link-register">
                      Login
                    </Link>
                  </span>
                </Col>
              </Row>
            </Form>
          </Col>
        </Row>
      </Container>
      {registeredUser.epID && (
        <WelcomeModal
          show={!!registeredUser.epID}
          onHide={handleCloseWelcomeModal}
          name={registeredUser.name}
          epID={registeredUser.epID}
          password={registeredUser.password}
        />
      )}
    </>
  );
};

const mapStateToProps = (state) => ({
  errorList: state.errors,
  loadingRegister: state.auth.loadingRegister,
  sponsorUser: state.auth.sponsorUser,
});

export default connect(mapStateToProps, {
  setErrors,
  removeRegistrationErrors,
  register,
  getSponsorUserDetails,
})(Register);
