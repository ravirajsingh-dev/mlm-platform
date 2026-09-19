import React from "react";
import { connect } from "react-redux";
import { Modal, Row, Col } from "react-bootstrap";
import PropTypes from "prop-types";
import { formatIndianNumber } from "@src/utils/helper";

const LevelInfoModal = ({ show, onHide, level }) => {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="level-heading">
          {`${level?.title ? level?.title : ""} Level Details`}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row className="mb-3">
          <Col className="text-start">
            <strong>Minimum Earnings Required:</strong>
            <span className="ms-2 level-result">
              ₹ {formatIndianNumber(level?.required_EP_bits) || 0}
            </span>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col className="text-start">
            <strong>Upgrade Investment:</strong>
            <span className="ms-2 level-result">
              ₹ {formatIndianNumber(level?.upgrade_bits) || 0}
            </span>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col className="text-start">
            <strong>Upgrade Contribution Breakdown:</strong>
            {level?.bits_for_upgrade && level?.bits_for_upgrade.length > 0 ? (
              level.bits_for_upgrade.map((link, i) => (
                <div key={i} className="ms-3 mt-2">
                  <strong>
                    {link.bits_type || "Help"} {i + 1}
                    {link.link_type !== null && link.link_type !== undefined
                      ? ` (Link ${link.link_type})`
                      : ""}
                    :
                  </strong>
                  <span className="ms-2 level-result">
                    ₹ {formatIndianNumber(link.bits)}
                  </span>
                </div>
              ))
            ) : (
              <div className="ms-3 mt-2">
                No contribution details available.
              </div>
            )}
          </Col>
        </Row>

        <Row className="mb-3">
          <Col className="text-start">
            <strong>Potential Earnings from Upgrade:</strong>
            {level?.earnings_on_upgrade ? (
              <div className="ms-3 mt-2">
                <div>
                  <strong>EP Help:</strong>
                  <span className="ms-2 level-result">
                    ₹{" "}
                    {formatIndianNumber(level.earnings_on_upgrade.deal_bits) ||
                      0}
                  </span>
                  <strong className="ms-2 text-bold">x</strong>
                  <span className="ms-2 level-result">
                    {formatIndianNumber(
                      level.earnings_on_upgrade.deals_count
                    ) || 0}
                  </span>
                  <strong className="ms-2 text-bold">=</strong>
                  <span className="ms-2 level-result">
                    ₹{" "}
                    {formatIndianNumber(
                      level.earnings_on_upgrade.total_earnings
                    ) || 0}
                  </span>
                </div>
              </div>
            ) : (
              <div className="ms-3 mt-2">No earning details available.</div>
            )}
          </Col>
        </Row>
      </Modal.Body>
    </Modal>
  );
};

LevelInfoModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  level: PropTypes.shape({
    title: PropTypes.string,
    required_EP_bits: PropTypes.number,
    upgrade_bits: PropTypes.number,
    bits_for_upgrade: PropTypes.arrayOf(
      PropTypes.shape({
        bits: PropTypes.number,
      })
    ),
    earnings_on_upgrade: PropTypes.shape({
      deal_bits: PropTypes.number,
      deals_count: PropTypes.number,
      total_earnings: PropTypes.number,
    }),
  }),
};

const mapStateToProps = (state) => ({
  loggedInUser: state.auth.user,
});

export default connect(mapStateToProps, {})(LevelInfoModal);
