import React, { useEffect, useState } from "react";
import { PropTypes } from "prop-types";
import { connect } from "react-redux";
import { Container, Row, Col, Form, Button, Card } from "react-bootstrap";

// icons
import { MdEdit } from "react-icons/md";
import { FaRegEye } from "react-icons/fa";

// custom imports
import MainCard from "@src/view/commonComponents/mainCard/MainCard";
import { validateForm } from "@src/utils/validation";
import { setErrors } from "@src/actions/adminAuth";
import Errors from "@src/notifications/Errors";
import AppBreadCrumb from "@src/view/commonComponents/dataTable/AppBreadCrumb";
import {
  getCommonSettings,
  updateCommonSettings,
  resetComponentStore,
} from "@src/actions/adminCommonSettingsActions";
import BouncingLoader from "@src/view/spinners/BouncingLoader";
import VerificationConfirmModal from "@src/view/admin/modals/VerificationConfirmModal";

const ApplicationSettings = ({
  setErrors,
  errorList,
  getCommonSettings,
  updateCommonSettings,
  resetComponentStore,
  adminCommonSettings: {
    commonSettings,
    loadingCommonSettings,
    loadingOnSubmit,
  },
}) => {
  // Initial form data structure
  const initialFormData = {
    // General Information
    name: "",
    contactUs: "",
    email: "",
    address: "",
    planPdfUrl: "",

    // Social Media Links
    socialMedia: {
      instagram: "",
      facebook: "",
      youtube: "",
      zoomMeeting: "",
    },

    // Withdrawal Settings
    withdrawalEnabled: true,
    minWithdrawalAmount: "",
    maxWithdrawalAmount: "",
    dailyTxnLimit: "",
    withdrawalSurcharge: "",

    // Donation Settings
    donationEnabled: true,
    donationMessage: "",

    // Marquee Settings
    marqueeEnabled: false,
    marqueeMessage: "",
    marqueeType: "warning",

    // Authentication Settings
    loginEnabled: true,
    registerEnabled: true,

    // UPI Details
    upi: {
      upiId: "",
      upiHolderName: "",
    },

    // Bank Details
    bank: {
      bankName: "",
      accountNo: "",
      accountHolderName: "",
      ifscCode: "",
    },
  };

  const [formData, setFormData] = useState(initialFormData);
  const [planPdfFile, setPlanPdfFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [onlyOnce, setOnce] = useState(true);
  const [isDisabled, setDisabled] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] = useState(null);

  const toggleEdit = () => setDisabled(!isDisabled);

  // Fetch settings on component mount
  useEffect(() => {
    if (onlyOnce) {
      resetComponentStore();
      setOnce(false);
    }

    getCommonSettings();
  }, [getCommonSettings, resetComponentStore]);

  // Update form data when settings are fetched
  useEffect(() => {
    if (commonSettings && Object.keys(commonSettings).length > 0) {
      setFormData({
        name: commonSettings.name || "",
        contactUs: commonSettings.contactUs || "",
        email: commonSettings.email || "",
        address: commonSettings.address || "",
        planPdfUrl: commonSettings.planPdfUrl || "",
        socialMedia: {
          instagram: commonSettings.socialMedia?.instagram || "",
          facebook: commonSettings.socialMedia?.facebook || "",
          youtube: commonSettings.socialMedia?.youtube || "",
          zoomMeeting: commonSettings.socialMedia?.zoomMeeting || "",
        },
        withdrawalEnabled:
          commonSettings.withdrawalEnabled !== undefined
            ? commonSettings.withdrawalEnabled
            : true,
        minWithdrawalAmount: commonSettings.minWithdrawalAmount || "",
        maxWithdrawalAmount: commonSettings.maxWithdrawalAmount || "",
        dailyTxnLimit: commonSettings.dailyTxnLimit || "",
        withdrawalSurcharge: commonSettings.withdrawalSurcharge || "",
        donationEnabled:
          commonSettings.donationEnabled !== undefined
            ? commonSettings.donationEnabled
            : true,
        donationMessage: commonSettings.donationMessage || "",
        marqueeEnabled:
          commonSettings.marqueeEnabled !== undefined
            ? commonSettings.marqueeEnabled
            : false,
        marqueeMessage: commonSettings.marqueeMessage || "",
        marqueeType: commonSettings.marqueeType || "warning",
        loginEnabled:
          commonSettings.loginEnabled !== undefined
            ? commonSettings.loginEnabled
            : true,
        registerEnabled:
          commonSettings.registerEnabled !== undefined
            ? commonSettings.registerEnabled
            : true,
        upi: {
          upiId: commonSettings.upi?.upiId || "",
          upiHolderName: commonSettings.upi?.upiHolderName || "",
        },
        bank: {
          bankName: commonSettings.bank?.bankName || "",
          accountNo: commonSettings.bank?.accountNo || "",
          accountHolderName: commonSettings.bank?.accountHolderName || "",
          ifscCode: commonSettings.bank?.ifscCode || "",
        },
      });
    }
  }, [commonSettings]);

  // Handle input changes
  const onChange = (e) => {
    if (!e.target) {
      return;
    }

    const { name, value, type, checked } = e.target;

    if (name === "planPdf") {
      const selectedFile = e.target.files?.[0];
      if (!selectedFile) {
        setPlanPdfFile(null);
        return;
      }

      const maxPdfSize = 15 * 1024 * 1024;
      if (selectedFile.type !== "application/pdf") {
        setErrors([{ path: "planPdf", msg: "Only PDF file is allowed." }]);
        e.target.value = "";
        return;
      }
      if (selectedFile.size > maxPdfSize) {
        setErrors([
          {
            path: "planPdf",
            msg: "PDF size must be 15MB or less.",
          },
        ]);
        e.target.value = "";
        return;
      }

      setPlanPdfFile(selectedFile);
      return;
    }

    // Handle nested fields (upi, bank, socialMedia)
    if (name.startsWith("upi.") || name.startsWith("bank.") || name.startsWith("socialMedia.")) {
      const [parent, child] = name.split(".");
      // Convert IFSC code to uppercase
      const processedValue =
        name === "bank.ifscCode" ? value.toUpperCase() : value;
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: processedValue,
        },
      });
    } else {
      // Handle regular fields and checkboxes
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value,
      });
    }
  };

  // Handle form submission
  const onSubmit = (e) => {
    e.preventDefault();

    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    setSubmitting(true);

    // Validation rules
    let validationRules = [
      {
        path: "name",
        msg: "Please provide a valid name.",
      },
      {
        path: "contactUs",
        msg: "Please provide contact information.",
      },
      {
        path: "email",
        msg: "Please provide a valid email address.",
      },
      {
        path: "minWithdrawalAmount",
        msg: "Please provide a valid minimum withdrawal amount.",
      },
      {
        path: "maxWithdrawalAmount",
        msg: "Please provide a valid maximum withdrawal amount.",
      },
      {
        path: "dailyTxnLimit",
        msg: "Please provide a valid daily transaction limit.",
      },
    ];

    const errors = validateForm(formData, validationRules);

    // Custom validation: min should be less than max
    if (
      formData.minWithdrawalAmount &&
      formData.maxWithdrawalAmount &&
      parseFloat(formData.minWithdrawalAmount) >=
        parseFloat(formData.maxWithdrawalAmount)
    ) {
      errors.push({
        path: "maxWithdrawalAmount",
        msg: "Maximum withdrawal amount must be greater than minimum withdrawal amount.",
      });
    }

    if (errors.length) {
      setErrors(errors);
      setSubmitting(false);
      return;
    }

    // Prepare submit data
    const submitData = new FormData();
    submitData.append("name", formData.name);
    submitData.append("contactUs", formData.contactUs);
    submitData.append("email", formData.email);
    submitData.append("address", formData.address);
    submitData.append("socialMedia", JSON.stringify(formData.socialMedia));
    submitData.append("withdrawalEnabled", String(formData.withdrawalEnabled));
    submitData.append(
      "minWithdrawalAmount",
      String(parseFloat(formData.minWithdrawalAmount))
    );
    submitData.append(
      "maxWithdrawalAmount",
      String(parseFloat(formData.maxWithdrawalAmount))
    );
    submitData.append("dailyTxnLimit", String(parseFloat(formData.dailyTxnLimit)));
    submitData.append(
      "withdrawalSurcharge",
      String(parseFloat(formData.withdrawalSurcharge) || 0)
    );
    submitData.append("donationEnabled", String(formData.donationEnabled));
    submitData.append("donationMessage", formData.donationMessage);
    submitData.append("marqueeEnabled", String(formData.marqueeEnabled));
    submitData.append("marqueeMessage", formData.marqueeMessage);
    submitData.append("marqueeType", formData.marqueeType);
    submitData.append("loginEnabled", String(formData.loginEnabled));
    submitData.append("registerEnabled", String(formData.registerEnabled));
    submitData.append("upi", JSON.stringify(formData.upi));
    submitData.append("bank", JSON.stringify(formData.bank));
    if (planPdfFile) {
      submitData.append("planPdf", planPdfFile);
    }

    // Store submit data and show confirmation modal
    setPendingSubmitData(submitData);
    setShowConfirmModal(true);
    setSubmitting(false);
  };

  // Handle confirmation from modal
  const handleConfirmSave = (txn_password) => {
    if (pendingSubmitData) {
      // Add transaction password to submit data
      const submitDataWithPassword = new FormData();
      for (const [key, value] of pendingSubmitData.entries()) {
        submitDataWithPassword.append(key, value);
      }
      submitDataWithPassword.append("txn_password", txn_password);
      updateCommonSettings(submitDataWithPassword);
      setShowConfirmModal(false);
      setPendingSubmitData(null);
      setPlanPdfFile(null);
      setDisabled(true); // Switch back to view mode after save
    }
  };

  const handleCloseModal = () => {
    setShowConfirmModal(false);
    setPendingSubmitData(null);
  };

  const onClickCancel = (e) => {
    e.preventDefault();
    // Reset form data to original settings
    if (commonSettings && Object.keys(commonSettings).length > 0) {
      setFormData({
        name: commonSettings.name || "",
        contactUs: commonSettings.contactUs || "",
        email: commonSettings.email || "",
        address: commonSettings.address || "",
        planPdfUrl: commonSettings.planPdfUrl || "",
        socialMedia: {
          instagram: commonSettings.socialMedia?.instagram || "",
          facebook: commonSettings.socialMedia?.facebook || "",
          youtube: commonSettings.socialMedia?.youtube || "",
          zoomMeeting: commonSettings.socialMedia?.zoomMeeting || "",
        },
        withdrawalEnabled:
          commonSettings.withdrawalEnabled !== undefined
            ? commonSettings.withdrawalEnabled
            : true,
        minWithdrawalAmount: commonSettings.minWithdrawalAmount || "",
        maxWithdrawalAmount: commonSettings.maxWithdrawalAmount || "",
        dailyTxnLimit: commonSettings.dailyTxnLimit || "",
        withdrawalSurcharge: commonSettings.withdrawalSurcharge || "",
        donationEnabled:
          commonSettings.donationEnabled !== undefined
            ? commonSettings.donationEnabled
            : true,
        donationMessage: commonSettings.donationMessage || "",
        marqueeEnabled:
          commonSettings.marqueeEnabled !== undefined
            ? commonSettings.marqueeEnabled
            : false,
        marqueeMessage: commonSettings.marqueeMessage || "",
        marqueeType: commonSettings.marqueeType || "warning",
        loginEnabled:
          commonSettings.loginEnabled !== undefined
            ? commonSettings.loginEnabled
            : true,
        registerEnabled:
          commonSettings.registerEnabled !== undefined
            ? commonSettings.registerEnabled
            : true,
        upi: {
          upiId: commonSettings.upi?.upiId || "",
          upiHolderName: commonSettings.upi?.upiHolderName || "",
        },
        bank: {
          bankName: commonSettings.bank?.bankName || "",
          accountNo: commonSettings.bank?.accountNo || "",
          accountHolderName: commonSettings.bank?.accountHolderName || "",
          ifscCode: commonSettings.bank?.ifscCode || "",
        },
      });
    }
    setPlanPdfFile(null);
    toggleEdit();
  };

  if (loadingCommonSettings) {
    return (
      <Container>
        <AppBreadCrumb
          pageTitle="Application Settings"
          crumbs={[{ name: "Application Settings" }]}
        />
        <BouncingLoader />
      </Container>
    );
  }

  return (
    <Container>
      <AppBreadCrumb
        pageTitle="Application Settings"
        crumbs={[{ name: "Application Settings" }]}
      />
      <MainCard className="card-body">
        <Form onSubmit={(e) => onSubmit(e)} autoComplete="off">
          <Row className="row-gap-3">
            <Col xs={12} className="card-heading mb-3">
              <Col xs={8} className="header-title">
                Application Settings
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

            {/* Section 1: General Information */}
            <Col xs={12}>
              <Card className="mb-4">
                <Card.Header className="bg-primary text-white">
                  <h5 className="mb-0">General Information</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
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
                          value={formData.name}
                          onChange={(e) => onChange(e)}
                          required
                          disabled={isDisabled}
                        />
                        <Errors current_key="name" key="name" />
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6} lg={4}>
                      <Form.Group className="form-group">
                        <Form.Label htmlFor="contactUs">
                          Contact Us <span>*</span>
                        </Form.Label>
                        <Form.Control
                          className={errorList.contactUs ? "invalid" : ""}
                          type="text"
                          id="contactUs"
                          name="contactUs"
                          value={formData.contactUs}
                          onChange={(e) => onChange(e)}
                          required
                          disabled={isDisabled}
                        />
                        <Errors current_key="contactUs" key="contactUs" />
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6} lg={4}>
                      <Form.Group className="form-group">
                        <Form.Label htmlFor="email">
                          Email <span>*</span>
                        </Form.Label>
                        <Form.Control
                          className={errorList.email ? "invalid" : ""}
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={(e) => onChange(e)}
                          required
                          disabled={isDisabled}
                        />
                        <Errors current_key="email" key="email" />
                      </Form.Group>
                    </Col>
                    <Col xs={12}>
                      <Form.Group className="form-group">
                        <Form.Label htmlFor="address">Address</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={(e) => onChange(e)}
                          placeholder="Enter address"
                          disabled={isDisabled}
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6} lg={6}>
                      <Form.Group className="form-group">
                        <Form.Label htmlFor="planPdf">
                          Plan PDF (Max 15MB)
                        </Form.Label>
                        <Form.Control
                          className={errorList.planPdf ? "invalid" : ""}
                          type="file"
                          id="planPdf"
                          name="planPdf"
                          accept="application/pdf"
                          onChange={(e) => onChange(e)}
                          disabled={isDisabled}
                        />
                        {formData.planPdfUrl && (
                          <Form.Text className="d-block mt-1">
                            Current file:{" "}
                            <a
                              href={formData.planPdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View / Download
                            </a>
                          </Form.Text>
                        )}
                        {planPdfFile && (
                          <Form.Text className="d-block mt-1">
                            Selected: {planPdfFile.name}
                          </Form.Text>
                        )}
                        <Errors current_key="planPdf" key="planPdf" />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>

            {/* Section 2: Social Media Links */}
            <Col xs={12}>
              <Card className="mb-4">
                <Card.Header className="bg-primary text-white">
                  <h5 className="mb-0">Social Media Links</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col xs={12} md={6}>
                      <Form.Group className="form-group">
                        <Form.Label htmlFor="socialMedia.instagram">
                          Instagram URL
                        </Form.Label>
                        <Form.Control
                          type="url"
                          id="socialMedia.instagram"
                          name="socialMedia.instagram"
                          value={formData.socialMedia.instagram}
                          onChange={(e) => onChange(e)}
                          placeholder="https://instagram.com/yourprofile"
                          disabled={isDisabled}
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6}>
                      <Form.Group className="form-group">
                        <Form.Label htmlFor="socialMedia.facebook">
                          Facebook URL
                        </Form.Label>
                        <Form.Control
                          type="url"
                          id="socialMedia.facebook"
                          name="socialMedia.facebook"
                          value={formData.socialMedia.facebook}
                          onChange={(e) => onChange(e)}
                          placeholder="https://facebook.com/yourprofile"
                          disabled={isDisabled}
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6}>
                      <Form.Group className="form-group">
                        <Form.Label htmlFor="socialMedia.youtube">
                          YouTube URL
                        </Form.Label>
                        <Form.Control
                          type="url"
                          id="socialMedia.youtube"
                          name="socialMedia.youtube"
                          value={formData.socialMedia.youtube}
                          onChange={(e) => onChange(e)}
                          placeholder="https://youtube.com/yourchannel"
                          disabled={isDisabled}
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6}>
                      <Form.Group className="form-group">
                        <Form.Label htmlFor="socialMedia.zoomMeeting">
                          Zoom Meeting URL
                        </Form.Label>
                        <Form.Control
                          type="url"
                          id="socialMedia.zoomMeeting"
                          name="socialMedia.zoomMeeting"
                          value={formData.socialMedia.zoomMeeting}
                          onChange={(e) => onChange(e)}
                          placeholder="https://zoom.us/j/meetingid"
                          disabled={isDisabled}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>

            {/* Section 3: Withdrawal Settings */}
            <Col xs={12}>
              <Card className="mb-4">
                <Card.Header className="bg-primary text-white">
                  <h5 className="mb-0">Withdrawal Settings</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col xs={12} md={6} lg={4}>
                      <Form.Group className="form-group">
                        <Form.Check
                          type="switch"
                          id="withdrawalEnabled"
                          name="withdrawalEnabled"
                          label="Enable Withdrawal"
                          checked={formData.withdrawalEnabled}
                          onChange={(e) => onChange(e)}
                          disabled={isDisabled}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col xs={12} md={6} lg={4}>
                      <Form.Group className="form-group">
                        <Form.Label htmlFor="minWithdrawalAmount">
                          Minimum Withdrawal Amount <span>*</span>
                        </Form.Label>
                        <Form.Control
                          className={
                            errorList.minWithdrawalAmount ? "invalid" : ""
                          }
                          type="number"
                          id="minWithdrawalAmount"
                          name="minWithdrawalAmount"
                          min="0"
                          value={formData.minWithdrawalAmount}
                          onChange={(e) => onChange(e)}
                          required
                          disabled={isDisabled}
                          onKeyPress={(event) => {
                            if (!/[0-9.]/.test(event.key)) {
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
                          Maximum Withdrawal Amount <span>*</span>
                        </Form.Label>
                        <Form.Control
                          className={
                            errorList.maxWithdrawalAmount ? "invalid" : ""
                          }
                          type="number"
                          id="maxWithdrawalAmount"
                          name="maxWithdrawalAmount"
                          min="0"
                          value={formData.maxWithdrawalAmount}
                          onChange={(e) => onChange(e)}
                          required
                          disabled={isDisabled}
                          onKeyPress={(event) => {
                            if (!/[0-9.]/.test(event.key)) {
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
                    <Col xs={12} md={6} lg={4}>
                      <Form.Group className="form-group">
                        <Form.Label htmlFor="dailyTxnLimit">
                          Daily Transaction Limit <span>*</span>
                        </Form.Label>
                        <Form.Control
                          className={errorList.dailyTxnLimit ? "invalid" : ""}
                          type="number"
                          id="dailyTxnLimit"
                          name="dailyTxnLimit"
                          min="0"
                          value={formData.dailyTxnLimit}
                          onChange={(e) => onChange(e)}
                          required
                          disabled={isDisabled}
                          onKeyPress={(event) => {
                            if (!/[0-9]/.test(event.key)) {
                              event.preventDefault();
                            }
                          }}
                        />
                        <Errors
                          current_key="dailyTxnLimit"
                          key="dailyTxnLimit"
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6} lg={4}>
                      <Form.Group className="form-group">
                        <Form.Label htmlFor="withdrawalSurcharge">
                          Withdrawal Surcharge <span>*</span>
                        </Form.Label>
                        <Form.Control
                          className={
                            errorList.withdrawalSurcharge ? "invalid" : ""
                          }
                          type="number"
                          id="withdrawalSurcharge"
                          name="withdrawalSurcharge"
                          min="0"
                          step="0.01"
                          value={formData.withdrawalSurcharge}
                          onChange={(e) => onChange(e)}
                          required
                          disabled={isDisabled}
                          onKeyPress={(event) => {
                            if (!/[0-9.]/.test(event.key)) {
                              event.preventDefault();
                            }
                          }}
                        />
                        <Errors
                          current_key="withdrawalSurcharge"
                          key="withdrawalSurcharge"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>

            {/* Section 4: Donation Settings */}
            <Col xs={12}>
              <Card className="mb-4">
                <Card.Header className="bg-primary text-white">
                  <h5 className="mb-0">Donation Settings</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col xs={12} md={6}>
                      <Form.Group className="form-group">
                        <Form.Check
                          type="switch"
                          id="donationEnabled"
                          name="donationEnabled"
                          label="Enable Donation"
                          checked={formData.donationEnabled}
                          onChange={(e) => onChange(e)}
                          disabled={isDisabled}
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6}>
                      <Form.Group className="form-group">
                        <Form.Label htmlFor="donationMessage">
                          Donation Message
                        </Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          id="donationMessage"
                          name="donationMessage"
                          value={formData.donationMessage}
                          onChange={(e) => onChange(e)}
                          placeholder="Optional donation message"
                          disabled={isDisabled}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>

            {/* Section 5: Marquee Settings */}
            <Col xs={12}>
              <Card className="mb-4">
                <Card.Header className="bg-primary text-white">
                  <h5 className="mb-0">Marquee Settings</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col xs={12} md={6}>
                      <Form.Group className="form-group">
                        <Form.Check
                          type="switch"
                          id="marqueeEnabled"
                          name="marqueeEnabled"
                          label="Show Marquee"
                          checked={formData.marqueeEnabled}
                          onChange={(e) => onChange(e)}
                          disabled={isDisabled}
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6}>
                      <Form.Group className="form-group">
                        <Form.Label htmlFor="marqueeType">
                          Marquee Type
                        </Form.Label>
                        <Form.Select
                          id="marqueeType"
                          name="marqueeType"
                          value={formData.marqueeType}
                          onChange={(e) => onChange(e)}
                          disabled={isDisabled}
                        >
                          <option value="danger">Danger</option>
                          <option value="success">Success</option>
                          <option value="warning">Warning</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col xs={12}>
                      <Form.Group className="form-group">
                        <Form.Label htmlFor="marqueeMessage">
                          Marquee Message
                        </Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          id="marqueeMessage"
                          name="marqueeMessage"
                          value={formData.marqueeMessage}
                          onChange={(e) => onChange(e)}
                          placeholder="Enter marquee message to display on client dashboard"
                          disabled={isDisabled}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>

            {/* Section 6: Authentication Settings */}
            <Col xs={12}>
              <Card className="mb-4">
                <Card.Header className="bg-primary text-white">
                  <h5 className="mb-0">Authentication Settings</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col xs={12} md={6}>
                      <Form.Group className="form-group">
                        <Form.Check
                          type="switch"
                          id="loginEnabled"
                          name="loginEnabled"
                          label="Enable Login"
                          checked={formData.loginEnabled}
                          onChange={(e) => onChange(e)}
                          disabled={isDisabled}
                        />
                        <Form.Text className="text-muted">
                          When disabled, users will not be able to login
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6}>
                      <Form.Group className="form-group">
                        <Form.Check
                          type="switch"
                          id="registerEnabled"
                          name="registerEnabled"
                          label="Enable Registration"
                          checked={formData.registerEnabled}
                          onChange={(e) => onChange(e)}
                          disabled={isDisabled}
                        />
                        <Form.Text className="text-muted">
                          When disabled, new user registration will be blocked
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>

            {/* Section 7: UPI Details */}
            <Col xs={12}>
              <Card className="mb-4">
                <Card.Header className="bg-primary text-white">
                  <h5 className="mb-0">UPI Details</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col xs={12} md={6}>
                      <Form.Group className="form-group">
                        <Form.Label htmlFor="upi.upiId">UPI ID</Form.Label>
                        <Form.Control
                          type="text"
                          id="upi.upiId"
                          name="upi.upiId"
                          value={formData.upi.upiId}
                          onChange={(e) => onChange(e)}
                          placeholder="e.g., yourname@paytm"
                          disabled={isDisabled}
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6}>
                      <Form.Group className="form-group">
                        <Form.Label htmlFor="upi.upiHolderName">
                          UPI Holder Name
                        </Form.Label>
                        <Form.Control
                          type="text"
                          id="upi.upiHolderName"
                          name="upi.upiHolderName"
                          value={formData.upi.upiHolderName}
                          onChange={(e) => onChange(e)}
                          placeholder="Account holder name"
                          disabled={isDisabled}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>

            {/* Section 8: Bank Details */}
            <Col xs={12}>
              <Card className="mb-4">
                <Card.Header className="bg-primary text-white">
                  <h5 className="mb-0">Bank Details</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col xs={12} md={6} lg={3}>
                      <Form.Group className="form-group">
                        <Form.Label htmlFor="bank.bankName">
                          Bank Name
                        </Form.Label>
                        <Form.Control
                          type="text"
                          id="bank.bankName"
                          name="bank.bankName"
                          value={formData.bank.bankName}
                          onChange={(e) => onChange(e)}
                          placeholder="Bank name"
                          disabled={isDisabled}
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6} lg={3}>
                      <Form.Group className="form-group">
                        <Form.Label htmlFor="bank.accountNo">
                          Account Number
                        </Form.Label>
                        <Form.Control
                          type="text"
                          id="bank.accountNo"
                          name="bank.accountNo"
                          value={formData.bank.accountNo}
                          onChange={(e) => onChange(e)}
                          placeholder="Account number"
                          disabled={isDisabled}
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6} lg={3}>
                      <Form.Group className="form-group">
                        <Form.Label htmlFor="bank.accountHolderName">
                          Account Holder Name
                        </Form.Label>
                        <Form.Control
                          type="text"
                          id="bank.accountHolderName"
                          name="bank.accountHolderName"
                          value={formData.bank.accountHolderName}
                          onChange={(e) => onChange(e)}
                          placeholder="Account holder name"
                          disabled={isDisabled}
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6} lg={3}>
                      <Form.Group className="form-group">
                        <Form.Label htmlFor="bank.ifscCode">
                          IFSC Code
                        </Form.Label>
                        <Form.Control
                          type="text"
                          id="bank.ifscCode"
                          name="bank.ifscCode"
                          value={formData.bank.ifscCode}
                          onChange={(e) => onChange(e)}
                          placeholder="IFSC code"
                          style={{ textTransform: "uppercase" }}
                          disabled={isDisabled}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>

            {/* Submit Button */}
            <Col xs={12} className="text-end">
              <Button
                className="m-2"
                type="submit"
                variant="primary"
                disabled={submitting || loadingOnSubmit || isDisabled}
              >
                {submitting || loadingOnSubmit ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm"
                      aria-hidden="true"
                    ></span>
                    {` Saving... `}
                  </>
                ) : (
                  <>Save Changes</>
                )}
              </Button>
              <Button
                className="ml-2"
                type="button"
                variant="danger"
                onClick={onClickCancel}
                disabled={submitting || loadingOnSubmit || isDisabled}
              >
                Cancel
              </Button>
            </Col>
          </Row>
        </Form>
      </MainCard>

      {/* Verification Confirm Modal */}
      <VerificationConfirmModal
        show={showConfirmModal}
        handleClose={handleCloseModal}
        handleConfirm={handleConfirmSave}
        title="Confirm Settings Update"
        body="Please enter your transaction password to confirm the settings update."
        submitBtnText="Confirm & Save"
      />
    </Container>
  );
};

const mapStateToProps = (state) => ({
  errorList: state.errors,
  adminCommonSettings: state.adminCommonSettings,
});

export default connect(mapStateToProps, {
  setErrors,
  resetComponentStore,
  getCommonSettings,
  updateCommonSettings,
})(ApplicationSettings);
