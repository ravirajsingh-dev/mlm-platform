import React, { useEffect, useState } from "react";
import { Modal, Table, Badge, Row, Col } from "react-bootstrap";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { getReceivePaymentLinksByUserID } from "@src/actions/helpLinkActions";
import moment from "moment";
import { formatIndianNumber } from "@src/utils/helper";
import CopyIcon from "@src/views/Common/CopyIcon";
import PreLoader from "@src/views/Common/Loaders/PreLoader";

const PotentialEarningsModal = ({
  show,
  onHide,
  level,
  loggedInUser,
  getReceivePaymentLinksByUserID,
  receiveHelpLinksList: { data, count },
  loadingReceiveHelpLinksList,
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
            operator: "eq",
            value: "Upgrade",
          },
          {
            field: "payment_for_level",
            operator: "eq",
            value: level.level,
          },
        ],
      };
      getReceivePaymentLinksByUserID(params);
      setLastFetchedLevel(level.level);
    }
  }, [
    show,
    level,
    loggedInUser,
    lastFetchedLevel,
    getReceivePaymentLinksByUserID,
  ]);

  useEffect(() => {
    if (!show) {
      setLastFetchedLevel(null);
    }
  }, [show]);

  const totalReceived =
    (Array.isArray(data) &&
      data.reduce((sum, item) => {
        return sum + (item.status === "completed" ? Number(item.amount) : 0);
      }, 0)) ||
    0;

  const totalPending =
    (Array.isArray(data) &&
      data.reduce((sum, item) => {
        return sum + (item.status === "pending" ? Number(item.amount) : 0);
      }, 0)) ||
    0;

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Potential Earnings - Level {level?.level}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loadingReceiveHelpLinksList ? (
          <div className="text-center py-4">
            <PreLoader />
          </div>
        ) : (
          <>
            <Row className="mb-3">
              <Col md={6}>
                <strong>Total Received:</strong>{" "}
                <span className="text-success">
                  ₹ {formatIndianNumber(totalReceived)}
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
                      <th>Sender Name</th>
                      <th>Sender EP ID</th>
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
                          {item?.senderInfo?.name || "Sender Not Assigned"}
                          {item?.senderInfo?.phone && (
                            <div className="text-muted small">
                              {item.senderInfo.phone}
                              <CopyIcon textToCopy={item.senderInfo.phone} />
                            </div>
                          )}
                        </td>
                        <td>
                          {item?.senderInfo?.EP_ID ? (
                            <>
                              {item.senderInfo.EP_ID}
                              <CopyIcon textToCopy={item.senderInfo.EP_ID} />
                            </>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td>₹ {formatIndianNumber(item.amount)}</td>
                        <td>
                          <Badge
                            bg={
                              item.status === "completed"
                                ? "success"
                                : "warning"
                            }
                          >
                            {item.status === "completed"
                              ? "APPROVED"
                              : "PENDING"}
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
                <p>No earnings records found for this level.</p>
              </div>
            )}
          </>
        )}
      </Modal.Body>
    </Modal>
  );
};

PotentialEarningsModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  level: PropTypes.shape({
    level: PropTypes.number,
    title: PropTypes.string,
  }),
  loggedInUser: PropTypes.object,
  getReceivePaymentLinksByUserID: PropTypes.func.isRequired,
  receiveHelpLinksList: PropTypes.shape({
    data: PropTypes.array,
    count: PropTypes.number,
  }),
  loadingReceiveHelpLinksList: PropTypes.bool,
};

const mapStateToProps = (state) => ({
  loggedInUser: state.auth.user,
  receiveHelpLinksList: state.helpLink.receiveHelpLinksList,
  loadingReceiveHelpLinksList: state.helpLink.loadingReceiveHelpLinksList,
});

export default connect(mapStateToProps, {
  getReceivePaymentLinksByUserID,
})(PotentialEarningsModal);
