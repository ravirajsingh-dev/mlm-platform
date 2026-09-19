import React from "react";
import { Button, Badge, Row, Col } from "react-bootstrap";
import Tile from "@src/views/Common/Tile";

const SendingPaymentOne = ({
  link,
  setSelectedItem,
  setShowConfirmModal,
  params,
  index,
}) => {
  const sr_no = (params.page - 1) * params.limit + index + 1;

  const handleSendPayment = () => {
    setSelectedItem(link);
    setShowConfirmModal(true);
  };

  return (
    <div className="customTileCardDesign">
      <Row className="tile-body">
        <div className="s-no">{sr_no}.</div>
        <Col xs="12" sm="6" md="4" lg="3">
          <Tile
            label={"Receiver Name"}
            value={
              link?.payment_type !== "Help"
                ? `${link?.receiverInfo?.name} (${link.receiverInfo?.EP_ID})`
                : "ADMIN"
            }
            copyable={
              link?.receiverInfo && link.receiverInfo?.EP_ID ? true : false
            }
            copyableValue={link.receiverInfo?.EP_ID}
          />
        </Col>

        <Col xs="12" sm="6" md="4" lg="3">
          <Tile
            label={"Receiver Phone"}
            value={
              link?.receiverInfo && link?.receiverInfo?.name ? (
                link?.receiverInfo?.phone
              ) : (
                <p className="dash">-</p>
              )
            }
            copyable={
              link?.receiverInfo && link?.receiverInfo?.phone ? true : false
            }
            copyableValue={link?.receiverInfo?.phone}
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

        <Col xs="12" className="tile-button-body">
          <div className="card-footer">
            {link.sender_status === "pending" ? (
              <Button
                variant="outline-primary"
                className="custom-outline-primary"
                onClick={handleSendPayment} // Trigger ConfirmModal
              >
                Send Payment
              </Button>
            ) : null}

            {link.sender_status === "paid" ? (
              <>
                {link.status === "completed" ? (
                  <Badge className="ml-2 action-badge" bg="success">
                    Paid
                  </Badge>
                ) : (
                  <Badge className="ml-2 action-badge" bg="secondary">
                    Paid
                  </Badge>
                )}

                {link.sender_status === "paid" &&
                link.receiver_status === "pending" ? (
                  <span className="ms-2">Approval Pending</span>
                ) : null}
              </>
            ) : null}
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default SendingPaymentOne;
