import React from "react";
import { Button, Badge, Col, Row } from "react-bootstrap";
import Tile from "@src/views/Common/Tile";

const RecevingPaymentOne = ({
  link,
  onClickApprove,
  onClickCancel,
  loadingBtn,
  params,
  index,
}) => {
  const sr_no = (params.page - 1) * params.limit + index + 1;
  return (
    <>
      <Row className="tile-body">
        <div className="s-no">{sr_no}.</div>
        <Col xs="12" sm="6" md="4" lg="3">
          <Tile
            label={"Sender Name"}
            value={
              link?.senderInfo && link?.senderInfo?.name ? (
                `${link?.senderInfo?.name} (${link.senderInfo?.EP_ID})`
              ) : (
                <p>Sender Not Assigned.</p>
              )
            }
            copyable={
              link?.senderInfo && link?.senderInfo?.EP_ID ? true : false
            }
            copyableValue={link.senderInfo?.EP_ID}
          />
        </Col>

        <Col xs="12" sm="6" md="4" lg="3">
          <Tile
            label={"Sender Phone"}
            value={
              link?.senderInfo && link?.senderInfo?.name ? (
                link?.senderInfo?.phone
              ) : (
                <p className="dash">-</p>
              )
            }
            copyable={
              link?.senderInfo && link?.senderInfo?.phone ? true : false
            }
            copyableValue={link?.senderInfo?.phone}
          />
        </Col>

        <Col xs="12" sm="6" md="4" lg="3">
          <Tile label={"Help Type"} value={link?.payment_type} />
        </Col>

        <Col xs="12" sm="6" md="4" lg="3">
          <Tile label={"Amount"} value={link?.amount} />
        </Col>

        <Col xs="12" sm="6" md="4" lg="3">
          <Tile
            label={"Status"}
            value={
              <Badge
                bg={link.sender_status === "pending" ? "warning" : "success"}
              >
                {link?.sender_status.toUpperCase()}
              </Badge>
            }
          />
        </Col>

        <div className="border-line"></div>

        <Col xs="12" className="tile-body">
          <div className="card-footer">
            {link.sender_status === "pending" ? (
              <p className="dash">-</p>
            ) : null}

            {link.sender_status === "paid" &&
            link.receiver_status === "pending" ? (
              <>
                <Button
                  className="me-2"
                  variant="success"
                  onClick={() => {
                    onClickApprove(
                      "confirmed",
                      link._id,
                      `link-confirmed-${index}`
                    );
                  }}
                  disabled={
                    loadingBtn[`link-confirmed-${index}`] ||
                    loadingBtn[`link-cancelled-${index}`]
                  }
                >
                  {loadingBtn[`link-confirmed-${index}`]
                    ? "Approving..."
                    : "Approve"}
                </Button>

                <Button
                  variant="danger"
                  className="ml-2"
                  onClick={() => {
                    onClickCancel(
                      "cancelled",
                      link._id,
                      `link-cancelled-${index}`
                    );
                  }}
                  disabled={
                    loadingBtn[`link-confirmed-${index}`] ||
                    loadingBtn[`link-cancelled-${index}`]
                  }
                >
                  {loadingBtn[`link-cancelled-${index}`]
                    ? "Cancelling..."
                    : "Cancel"}
                </Button>
              </>
            ) : null}

            {link.receiver_status === "confirmed" ? (
              <Badge bg="success" className="action-badge">
                Approved
              </Badge>
            ) : link.receiver_status === "cancelled" ? (
              <Badge bg="danger" className="action-badge">
                Cancelled
              </Badge>
            ) : null}
          </div>
        </Col>
      </Row>
    </>
  );
};

export default RecevingPaymentOne;
