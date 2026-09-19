import React, { useEffect, useState } from "react";
import { Modal, Table, Badge, Row, Col } from "react-bootstrap";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { getSendPaymentLinksByUserID } from "@src/actions/helpLinkActions";
import moment from "moment";
import { formatIndianNumber } from "@src/utils/helper";
import CopyIcon from "@src/views/Common/CopyIcon";
import PreLoader from "@src/views/Common/Loaders/PreLoader";

const UpgradeCostModal = ({
  show,
  onHide,
  level,
  loggedInUser,
  getSendPaymentLinksByUserID,
  sendHelpLinksList: { data, count },
  loadingSendHelpLinksList,
}) => {
  const [lastFetchedLevel, setLastFetchedLevel] = useState(null);

  useEffect(() => {
    const hasValidLevel = level && level.level !== undefined;
    const levelChanged = lastFetchedLevel !== level?.level;

    if (show && hasValidLevel && loggedInUser && levelChanged) {
      const params = {
        limit: 100,
        page: 1,
        orderBy: "updatedAt",
        ascending: "desc",
        query: "",
        filters: [
          {
            field: "payment_type",
            operator: "in",
            value: ["Upgrade", "Passive", "Direct", "Help"],
          },
          {
            field: "payment_for_level",
            operator: "eq",
            value: level.level,
          },
        ],
      };
      getSendPaymentLinksByUserID(params);
      setLastFetchedLevel(level.level);
    }
  }, [
    show,
    level,
    loggedInUser,
    lastFetchedLevel,
    getSendPaymentLinksByUserID,
  ]);

  useEffect(() => {
    if (!show) {
      setLastFetchedLevel(null);
    }
  }, [show]);

  const totalPaid =
    (Array.isArray(data) &&
      data.reduce((sum, item) => {
        return sum + (item.sender_status === "paid" ? Number(item.amount) : 0);
      }, 0)) ||
    0;

  const totalPending =
    (Array.isArray(data) &&
      data.reduce((sum, item) => {
        return (
          sum + (item.sender_status === "pending" ? Number(item.amount) : 0)
        );
      }, 0)) ||
    0;

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Upgrade Cost - Level {level?.level}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loadingSendHelpLinksList ? (
          <div className="text-center py-4">
            <PreLoader />
          </div>
        ) : (
          <>
            <Row className="mb-3">
              <Col md={6}>
                <strong>Total Paid:</strong>{" "}
                <span className="text-success">
                  ₹ {formatIndianNumber(totalPaid)}
                </span>
              </Col>
              <Col md={6}>
                <strong>Total Pending:</strong>{" "}
                <span className="text-warning">
                  ₹ {formatIndianNumber(totalPending)}
                </span>
              </Col>
            </Row>

            {data && data.length > 0 ? (
              <div className="table-responsive" style={{ maxHeight: "400px" }}>
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>SR.</th>
                      <th>Receiver Name</th>
                      <th>Receiver EP ID</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((item, index) => (
                      <tr key={item._id}>
                        <td>{index + 1}</td>
                        <td>
                          {item?.receiverInfo?.name || "ADMIN"}
                          {item?.receiverInfo?.phone && (
                            <div className="text-muted small">
                              {item.receiverInfo.phone}
                              <CopyIcon textToCopy={item.receiverInfo.phone} />
                            </div>
                          )}
                        </td>
                        <td>
                          {item?.receiverInfo?.EP_ID ? (
                            <>
                              {item.receiverInfo.EP_ID}
                              <CopyIcon textToCopy={item.receiverInfo.EP_ID} />
                            </>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td>{item.payment_type}</td>
                        <td>₹ {formatIndianNumber(item.amount)}</td>
                        <td>
                          <Badge
                            bg={
                              item.sender_status === "paid"
                                ? "success"
                                : "warning"
                            }
                          >
                            {item.sender_status.toUpperCase()}
                          </Badge>
                        </td>
                        <td>
                          {moment(item.updatedAt).format(
                            "MMM DD, YYYY, hh:mm a"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-4">
                <p>No payment records found for this level.</p>
              </div>
            )}
          </>
        )}
      </Modal.Body>
    </Modal>
  );
};

UpgradeCostModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  level: PropTypes.shape({
    level: PropTypes.number,
    title: PropTypes.string,
  }),
  loggedInUser: PropTypes.object,
  getSendPaymentLinksByUserID: PropTypes.func.isRequired,
  sendHelpLinksList: PropTypes.shape({
    data: PropTypes.array,
    count: PropTypes.number,
  }),
  loadingSendHelpLinksList: PropTypes.bool,
};

const mapStateToProps = (state) => ({
  loggedInUser: state.auth.user,
  sendHelpLinksList: state.helpLink.sendHelpLinksList,
  loadingSendHelpLinksList: state.helpLink.loadingSendHelpLinksList,
});

export default connect(mapStateToProps, {
  getSendPaymentLinksByUserID,
})(UpgradeCostModal);
