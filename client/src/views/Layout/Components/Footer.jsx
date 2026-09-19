import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import logo from "@assets/img/logo/logo.png";
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaAngleDoubleUp,
  FaVideo,
} from "react-icons/fa";
import { Button } from "react-bootstrap";
import LoadingSkeleton from "@src/views/Common/Loaders/LoadingSkeleton";
import { getCommonSettings } from "@src/actions/commonActions";
import CopyIcon from "@src/views/Common/CopyIcon";

const Footer = ({
  common: { commonSettings, loadingCommonSettings },
  getCommonSettings,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fetch common settings on component mount
    getCommonSettings();
  }, [getCommonSettings]);

  useEffect(() => {
    const toggleVisibility = () => setIsVisible(window.scrollY > 300);
    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  // Default values
  const defaultName = "EK PAHAL";
  const defaultSubtitle = "A Step Towards Humanity & Hope";
  const defaultAddress = "";
  const defaultContact = "";
  const defaultEmail = "";

  // Get settings with defaults
  const name = commonSettings?.name || defaultName;
  const subtitle = defaultSubtitle;
  const address = commonSettings?.address || defaultAddress;
  const contactUs = commonSettings?.contactUs || defaultContact;
  const email = commonSettings?.email || defaultEmail;
  const socialMedia = commonSettings?.socialMedia || {};

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

  // Parse phone numbers (handle comma, newline, or semicolon separated)
  const parsePhoneNumbers = (phoneString) => {
    if (!phoneString) return [];
    return phoneString
      .split(/[,;\n]/)
      .map((phone) => phone.trim())
      .filter((phone) => phone.length > 0);
  };

  const phoneNumbers = parsePhoneNumbers(contactUs);

  // Render skeleton loader while loading
  if (loadingCommonSettings) {
    return (
      <footer className="footer-area">
        <div className="main-footer-area">
          <div className="container">
            <div className="footer-center-wrapper">
              {/* Logo */}
              <div className="footer-logo">
                <img src={logo} alt="Ek Pahal" />
              </div>

              {/* Brand Text - Skeleton */}
              <LoadingSkeleton width="200px" height="28px" borderRadius="4px" />
              <div style={{ marginTop: "8px", marginBottom: "20px" }}>
                <LoadingSkeleton
                  width="250px"
                  height="16px"
                  borderRadius="4px"
                />
              </div>

              {/* Social Icons - Skeleton */}
              <div className="social-info" style={{ marginBottom: "30px" }}>
                <LoadingSkeleton
                  count={3}
                  circle={true}
                  width="40px"
                  height="40px"
                  baseColor="#ffe082"
                />
              </div>

              {/* Contact - Skeleton */}
              <div className="footer-contact">
                <LoadingSkeleton
                  width="300px"
                  height="16px"
                  borderRadius="4px"
                />
                <div style={{ marginTop: "8px" }}>
                  <LoadingSkeleton
                    width="200px"
                    height="16px"
                    borderRadius="4px"
                  />
                </div>
                <div style={{ marginTop: "8px" }}>
                  <LoadingSkeleton
                    width="250px"
                    height="16px"
                    borderRadius="4px"
                  />
                </div>
                <div style={{ marginTop: "8px" }}>
                  <LoadingSkeleton
                    width="280px"
                    height="16px"
                    borderRadius="4px"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="footer-area">
      <div className="main-footer-area">
        <div className="container">
          <div className="footer-center-wrapper">
            {/* Logo */}
            <div className="footer-logo">
              <img src={logo} alt={name} />
            </div>

            {/* Brand Text */}
            <h4 className="footer-brand">{name.toUpperCase()}</h4>
            {subtitle && <p className="footer-subtitle">{subtitle}</p>}

            {/* Social Icons - Only show if links are available */}
            {socialLinks.length > 0 && (
              <div className="social-info mb-3">
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
            <div className="footer-contact">
              {address && <p>{address}</p>}
              {phoneNumbers.length > 0 && (
                <>
                  {phoneNumbers.map((phone, index) => (
                    <p key={index}>
                      {index === 0 && <span>Phone:</span>} {phone}
                      <CopyIcon
                        textToCopy={phone}
                        iconSize={16}
                        className="ms-2"
                      />
                    </p>
                  ))}
                </>
              )}
              {email && (
                <p>
                  <span>Email:</span> {email}
                  <CopyIcon textToCopy={email} iconSize={16} className="ms-2" />
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {isVisible && (
        <Button
          className="scrollUp"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <FaAngleDoubleUp />
        </Button>
      )}
    </footer>
  );
};

Footer.propTypes = {
  common: PropTypes.object.isRequired,
  getCommonSettings: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  common: state.common,
});

export default connect(mapStateToProps, { getCommonSettings })(Footer);
