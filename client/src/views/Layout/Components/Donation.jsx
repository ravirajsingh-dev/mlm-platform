import React, { useEffect, useState } from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { connect } from "react-redux";
import {
  getActiveDonationButtons,
  getDonationSettings,
} from "@src/actions/donationActions";
import DonationModal from "@src/views/Common/Modal/DonationModal";
import BouncingLoader from "@src/views/Common/Loaders/BouncingLoader";

const Donation = ({
  getActiveDonationButtons,
  getDonationSettings,
  donationButtons,
  donationSettings,
  loadingDonationButtons,
  loadingDonationSettings,
}) => {
  const [showUPIModal, setShowUPIModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [isFixedAmount, setIsFixedAmount] = useState(false);

  useEffect(() => {
    getActiveDonationButtons();
    getDonationSettings();
  }, [getActiveDonationButtons, getDonationSettings]);

  // Don't render if donation is disabled
  if (!donationSettings.donationEnabled) {
    return null;
  }

  const handleDonateClick = (button) => {
    if (button.type === "ANY") {
      setSelectedAmount(null);
      setIsFixedAmount(false);
    } else {
      setSelectedAmount(button.amount);
      setIsFixedAmount(true);
    }
    setShowUPIModal(true);
  };

  const handleBankDonateClick = () => {
    setSelectedAmount(null);
    setIsFixedAmount(false);
    setShowBankModal(true);
  };

  if (loadingDonationButtons || loadingDonationSettings) {
    return (
      <section className="donation-section">
        <Container>
          <BouncingLoader />
        </Container>
      </section>
    );
  }

  return (
    <>
      <section className="donation-section">
        <Container>
          {/* HEADER */}
          <div className="donation-section__header">
            <span className="donation-section__tag">MAKE A DIFFERENCE</span>
            <h2 className="donation-section__title">
              Support Our Mission
              <br />
              <span>Help Us Feed Those in Need</span>
            </h2>
            {donationSettings.donationMessage && (
              <p className="donation-section__intro">
                {donationSettings.donationMessage}
              </p>
            )}
          </div>

          {/* UPI DONATION BUTTONS */}
          <div className="donation-section__upi">
            <h3 className="donation-section__subtitle">Donate via UPI</h3>
            <Row className="donation-section__buttons">
              {donationButtons
                .filter((btn) => btn.isActive)
                .map((button) => (
                  <Col
                    key={button._id}
                    xs={6}
                    sm={4}
                    md={4}
                    lg={button.type === "ANY" ? 12 : 2.4}
                    className="mb-3"
                  >
                    <Button
                      variant="primary"
                      className="donation-button w-100"
                      onClick={() => handleDonateClick(button)}
                    >
                      {button.type === "ANY" ? (
                        <div className="donation-button__amount">{button.buttonText || "Donate Any Other Amount"}</div>
                      ) : (
                        <>
                          <div className="donation-button__amount">₹{button.amount}</div>
                          <div className="donation-button__people">
                            {button.peopleFed} people
                          </div>
                        </>
                      )}
                    </Button>
                  </Col>
                ))}
            </Row>
          </div>

          {/* BANK DONATION SECTION */}
          <div className="donation-section__bank mt-5">
            <h3 className="donation-section__subtitle">Donate via Bank Transfer</h3>
            <Row>
              <Col md={8} className="mx-auto">
                <div className="donation-bank-info">
                  <p className="mb-3">
                    You can also donate directly to our bank account. Click the
                    button below to see bank details and submit your donation
                    request.
                  </p>
                  <Button
                    variant="outline-primary"
                    size="lg"
                    className="donation-bank-button"
                    onClick={handleBankDonateClick}
                  >
                    Donate via Bank Transfer
                  </Button>
                </div>
              </Col>
            </Row>
          </div>
        </Container>
      </section>

      {/* UPI DONATION MODAL */}
      <DonationModal
        show={showUPIModal}
        handleClose={() => {
          setShowUPIModal(false);
          setSelectedAmount(null);
        }}
        paymentMode="UPI"
        initialAmount={selectedAmount}
        isFixedAmount={isFixedAmount}
        donationSettings={donationSettings}
      />

      {/* BANK DONATION MODAL */}
      <DonationModal
        show={showBankModal}
        handleClose={() => {
          setShowBankModal(false);
          setSelectedAmount(null);
        }}
        paymentMode="BANK"
        initialAmount={null}
        isFixedAmount={false}
        donationSettings={donationSettings}
      />
    </>
  );
};

const mapStateToProps = (state) => ({
  donationButtons: state.donation.donationButtons,
  donationSettings: state.donation.donationSettings,
  loadingDonationButtons: state.donation.loadingDonationButtons,
  loadingDonationSettings: state.donation.loadingDonationSettings,
});

export default connect(mapStateToProps, {
  getActiveDonationButtons,
  getDonationSettings,
})(Donation);

