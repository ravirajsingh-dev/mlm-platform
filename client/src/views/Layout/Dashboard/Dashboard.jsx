import React, { useEffect } from "react";
import { connect } from "react-redux";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import Alert from "react-bootstrap/Alert";
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaVideo,
  FaFilePdf,
} from "react-icons/fa";

import { capitalizeAll, toRoman } from "@src/utils/helper";
import { getLevelTitle } from "@src/utils/levelHelper";
import CopyIcon from "@src/views/Common/CopyIcon";
import { getCommonSettings } from "@src/actions/commonActions";
import ReferralModal from "@src/views/Common/Modal/ReferralModal";
import CountdownTimer from "@src/views/Common/CountdownTimer";
import ConfirmModal from "@src/views/Common/Modal/ConfirmModal";
import { entryToEPool, fetchCurrentBalance } from "@src/actions/walletActions";

const Dashboard = ({
  loggedInUser,
  loadingCurrentBalance,
  currentTxnDetails,
  entryToEPool,
  fetchCurrentBalance,
  getCommonSettings,
  common: { commonSettings },
}) => {
  const [showEPoolModal, setShowEPoolModal] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [showReferralModal, setShowReferralModal] = React.useState(false);
  const hasBalanceData =
    currentTxnDetails && typeof currentTxnDetails === "object";
  const eCashBalance = hasBalanceData
    ? Number(currentTxnDetails?.e_cash || 0)
    : 0;

  useEffect(() => {
    if (!loggedInUser) return;
    getCommonSettings();
  }, [getCommonSettings, loggedInUser]);

  const handleEPoolEntry = async () => {
    if (!loggedInUser) return;
    const balanceRes = await fetchCurrentBalance(loggedInUser._id);
    const latestBalance = Number(
      balanceRes?.response?.e_cash ?? currentTxnDetails?.e_cash ?? 0,
    );
    if (latestBalance < 500) return;
    setShowEPoolModal(true);
  };

  const handleConfirmEPoolEntry = async () => {
    if (!loggedInUser) return;

    setIsProcessing(true);
    try {
      const result = await entryToEPool(loggedInUser._id);
      if (result.status) {
        setShowEPoolModal(false);
        // Balance will be refreshed automatically by the action
      }
    } catch (error) {
      console.error("Error entering E-Pool:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseEPoolModal = () => {
    if (!isProcessing) {
      setShowEPoolModal(false);
    }
  };

  // Parse phone numbers (handle comma, newline, or semicolon separated)
  const parsePhoneNumbers = (phoneString) => {
    if (!phoneString) return [];
    return phoneString
      .split(/[,;\n]/)
      .map((phone) => phone.trim())
      .filter((phone) => phone.length > 0);
  };

  // Get contact information from commonSettings
  const address = commonSettings?.address || "";
  const contactUs = commonSettings?.contactUs || "";
  const email = commonSettings?.email || "";
  const socialMedia = commonSettings?.socialMedia || {};
  const phoneNumbers = parsePhoneNumbers(contactUs);

  // Filter social media icons - only show if link is available
  const socialLinks = [];
  if (socialMedia?.facebook) {
    socialLinks.push({
      icon: FaFacebookF,
      url: socialMedia.facebook,
      key: "facebook",
    });
  }
  if (socialMedia?.instagram) {
    socialLinks.push({
      icon: FaInstagram,
      url: socialMedia.instagram,
      key: "instagram",
    });
  }
  if (socialMedia?.youtube) {
    socialLinks.push({
      icon: FaYoutube,
      url: socialMedia.youtube,
      key: "youtube",
    });
  }
  if (socialMedia?.zoomMeeting) {
    socialLinks.push({
      icon: FaVideo,
      url: socialMedia.zoomMeeting,
      key: "zoomMeeting",
    });
  }

  return (
    <Container className="profile-container">
      {/* Marquee/Announcement Alert - Fixed and Readable */}
      {commonSettings?.marqueeEnabled && commonSettings?.marqueeMessage && (
        <Alert
          variant={commonSettings.marqueeType || "warning"}
          className="mb-3"
          style={{
            fontSize: "1rem",
            lineHeight: "1.5",
            wordWrap: "break-word",
            whiteSpace: "normal",
          }}
        >
          <Alert.Heading className="mb-2">
            <i
              className={`bi ${
                commonSettings.marqueeType === "danger"
                  ? "bi-exclamation-triangle-fill"
                  : commonSettings.marqueeType === "success"
                    ? "bi-check-circle-fill"
                    : "bi-info-circle-fill"
              } me-2`}
            ></i>
            Announcement
          </Alert.Heading>
          <div>{commonSettings.marqueeMessage}</div>
        </Alert>
      )}

      {!loggedInUser?.isTxnPassSet && (
        <Alert
          variant="warning"
          className="d-flex align-items-center justify-content-between"
        >
          <div>
            <Alert.Heading className="mb-1">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              Transaction Password Required
            </Alert.Heading>
            You must set a transaction password to use wallet features
          </div>
          <Link
            to="/user/transaction-password"
            className="btn btn-sm btn-warning"
          >
            Set Transaction Password Now
          </Link>
        </Alert>
      )}

      {loggedInUser?.status === 3 && (
        <Alert
          variant="danger"
          className="d-flex align-items-center justify-content-between"
        >
          <div>
            <Alert.Heading className="mb-1">
              <i className="bi bi-clock me-2"></i>
              Welcome to EK PAHAL!
            </Alert.Heading>
            You have{" "}
            <CountdownTimer
              createdAt={loggedInUser.createdAt}
              reactivatedAt={loggedInUser.reactivatedAt}
            />{" "}
            to activate your account. After 7 days, your account will be
            deactivated automatically.
          </div>
          {/* <Link to="/user/activation" className="btn btn-sm btn-info">
            Activate Account Now
          </Link> */}
        </Alert>
      )}

      <Card className="profile-card">
        <div className="profile-content">
          {loggedInUser?.is_root ? (
            <Row>
              <Col>
                <span className="dashboard-desc">
                  Hello, You are a root user.
                </span>
              </Col>
            </Row>
          ) : null}
          {/* <div className="avatar-wrapper">
            <div
              className={`profile-avatar ${
                loggedInUser?.status === 1 ? "" : "invalid-text"
              }`}
            >
              {toRoman(loggedInUser?.user_level)}
            </div>
          </div> */}
          <h2 className="user-id">
            {getLevelTitle(loggedInUser?.user_level)} -{" "}
            {toRoman(loggedInUser?.user_level)}{" "}
          </h2>

          <h2 className="user-id">
            {loggedInUser?.EP_ID}

            <CopyIcon textToCopy={loggedInUser?.EP_ID} />
          </h2>
          <p className="user-name">
            Welcome, <span>{`${capitalizeAll(loggedInUser?.name)}`} !</span>
          </p>

          {/* Add Referral Button Here */}
          <div className="text-center mt-3">
            <Button
              className="theme_btn me-3"
              onClick={() => setShowReferralModal(true)}
            >
              <i className="bi bi-share me-2"></i>
              Referral Link
            </Button>

            {/* <div className="text-center mt-3"> */}
            <Link
              to={`/user/seva-kendra`}
              title="Seva-Kendra"
              className="theme_btn"
            >
              Seva Kendra
            </Link>
            {commonSettings?.planPdfUrl && (
              <a
                href={commonSettings.planPdfUrl}
                className="theme_btn ms-3 mt-3"
                target="_blank"
                rel="noopener noreferrer"
                download
              >
                <FaFilePdf className="me-2" />
                EK PAHAL PDF
              </a>
            )}
            {/* </div> */}
          </div>
          {/* End of Referral Button */}

          <div>
            {!loggedInUser?.is_root && (
              <Row className="mt-3">
                <p className="user-id"></p>
                <Col className="text-center">
                  {loggedInUser?.has_entered_e_pool ? (
                    <div className="alert alert-dark">
                      <h3 className="maroon-color">
                        Already entered in E-Pool
                      </h3>
                      <p className="mb-0 mt-2 maroon-color">
                        You have already entered the E-Pool. Entry is allowed
                        only once.
                      </p>
                    </div>
                  ) : (
                    <>
                      <Button
                        variant="primary"
                        className="blinking-button m-3"
                        onClick={handleEPoolEntry}
                        disabled={
                          loadingCurrentBalance ||
                          isProcessing ||
                          (hasBalanceData && eCashBalance < 500)
                        }
                      >
                        {isProcessing ? "Processing..." : "Entry in E-Pool"}
                      </Button>
                      {hasBalanceData && eCashBalance < 500 && (
                        <p className="mt-2 golden-color">
                          Minimum ₹500 required in E-Cash to enter E-Pool
                        </p>
                      )}
                    </>
                  )}
                </Col>
              </Row>
            )}
          </div>

          {/* Social Icons - Only show if links are available */}
          {socialLinks.length > 0 && (
            <div className="social-info">
              {socialLinks.map(({ icon: Icon, url, key }) => (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon />
                </a>
              ))}
            </div>
          )}

          {/* Contact */}
          <div className="footer-contact mt-3">
            {/* {address && <p>{address}</p>} */}
            {email && (
              <p>
                <span>Email:</span> {email}
                <CopyIcon textToCopy={email} iconSize={16} className="ms-2" />
              </p>
            )}
            {phoneNumbers.length > 0 && (
              <>
                {phoneNumbers.map((phone, index) => (
                  <p key={index}>
                    {index === 0 && <span>Contact Us:</span>} {phone}
                    <CopyIcon
                      textToCopy={phone}
                      iconSize={16}
                      className="ms-2"
                    />
                  </p>
                ))}
              </>
            )}
          </div>
        </div>
        {/* <Card className="stats-container">
          <Row className="g-2">
            <Col xs={6} md={3}>
              <div className="stat-card">
                <div className="stat-value">
                  {loggedInUser?.sponsorEP}
                  <CopyIcon textToCopy={loggedInUser?.sponsorEP} />
                </div>
                <div className="stat-label">Sponsor</div>
              </div>
            </Col>

            <Col xs={6} md={3}>
              <div className="stat-card">
                <div className="stat-value">
                  {loggedInUser?.uplineEP}
                  <CopyIcon textToCopy={loggedInUser?.uplineEP} />
                </div>
                <div className="stat-label">Upline</div>
              </div>
            </Col>

            <Col xs={6} md={3}>
              <div className="stat-card">
                <div className="stat-value">
                  {getLevelTitle(loggedInUser?.user_level)}
                </div>
                <div className="stat-label">Level</div>
              </div>
            </Col>

            <Col xs={6} md={3}>
              <Link
                to={`/user/epins-layout`}
                title="EP-Keys"
                className="text-primary"
              >
                <div className="stat-card">
                  <div className="stat-value">{unusedEPins}</div>
                  <div className="stat-label">EP-Keys</div>
                </div>
              </Link>
            </Col>
          </Row>
        </Card> */}
      </Card>

      {/* <Card className="stats-container">
        <div className="card-heading-unique">
          <div className="heading-underline">Wallet Section !</div>
        </div>
        <Row className="g-2">
          {walletStatsData.map(({ value, label, path }, index) => (
            <Col key={index} xs={6} md={3}>
              <Link
                to={path}
                title={label}
                className="text-primary text-decoration-none"
              >
                <div className="stat-card">
                  <div className="stat-value">{value}</div>
                  <div className="stat-label">{label}</div>
                </div>
              </Link>
            </Col>
          ))}
        </Row>
      </Card>

      <Card className="stats-container">
        <div className="card-heading-unique">
          <div className="heading-underline">Help Section !</div>
        </div>
        <Row className="g-2">
          {paymentStatsData.map(({ value, label, path }, index) => (
            <Col key={index} xs={6} md={3}>
              <Link
                to={path}
                title={label}
                className="text-primary text-decoration-none"
              >
                <div className="stat-card">
                  <div className="stat-value">{value}</div>
                  <div className="stat-label">{label}</div>
                </div>
              </Link>
            </Col>
          ))}
        </Row>
      </Card>

      <Card className="stats-container">
        <div className="card-heading-unique">
          <div className="heading-underline">Team Section !</div>
        </div>
        <Row className="g-2">
          {teamSummaryData.map(({ value, label, path }, index) => (
            <Col key={index} xs={6} md={3}>
              <Link
                to={path}
                title={label}
                className="text-primary text-decoration-none"
              >
                <div className="stat-card">
                  <div className="stat-value">{value}</div>
                  <div className="stat-label">{label}</div>
                </div>
              </Link>
            </Col>
          ))}
        </Row>
      </Card> */}
      {loggedInUser && (
        <ReferralModal
          show={showReferralModal}
          onHide={() => setShowReferralModal(false)}
          userId={loggedInUser.EP_ID}
        />
      )}

      <ConfirmModal
        show={showEPoolModal}
        handleClose={handleCloseEPoolModal}
        handleConfirm={handleConfirmEPoolEntry}
        title="Confirm E-Pool Entry"
        body="Are you sure you want to enter E-Pool? This will debit ₹500 from your E-Cash wallet and credit it to your E-Pool Upgrade wallet."
        submitBtnText={isProcessing ? "Processing..." : "Yes"}
        cancelBtnText="No"
      />
    </Container>
  );
};

Dashboard.propTypes = {};

const mapStateToProps = (state) => ({
  loggedInUser: state.auth.user,
  currentTxnDetails: state.wallet.currentTxnDetails,
  loadingCurrentBalance: state.wallet.loadingCurrentBalance,
  common: state.common,
});

export default connect(mapStateToProps, {
  entryToEPool,
  fetchCurrentBalance,
  getCommonSettings,
})(Dashboard);
