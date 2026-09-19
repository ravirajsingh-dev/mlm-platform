import React from "react";
import { Button, Badge, Col, Row } from "react-bootstrap";
import Tile from "@src/views/Common/Tile";

const DownlinePendingOne = ({
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
      </Row>
    </>
  );
};

export default DownlinePendingOne;
