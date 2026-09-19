import React from "react";
import { Col, Row, Badge } from "react-bootstrap";
import moment from "moment";
import Tile from "@src/views/Common/Tile";

const EPinTransferReportOne = ({ epin, params, index }) => {
  const sr_no = (params.page - 1) * params.limit + index + 1;
  return (
    <>
      <Row className="tile-body">
        <div className="s-no">{sr_no}.</div>

        <Col xs="12" sm="6" md="4">
          <Tile label={"Quantity"} value={epin?.quantity} />
        </Col>

        <Col xs="12" sm="6" md="4">
          <Tile
            label={"Transferred By"}
            value={epin?.transferredBy}
            copyable={true}
            copyableValue={epin?.transferredBy}
          />
        </Col>

        <Col xs="12" sm="6" md="4">
          <Tile
            label={"Transferred To"}
            value={epin?.transferredTo}
            copyable={true}
            copyableValue={epin?.transferredTo}
          />
        </Col>

        <Col xs="12" sm="6" md="4">
          <Tile
            label={"Status"}
            value={<Badge bg={"success"}>{epin.status.toUpperCase()}</Badge>}
          />
        </Col>

        <Col xs="12" sm="6" md="4" lg="3">
          <Tile label={"Date"} value={moment(epin?.createdAt).format("ll")} />
        </Col>
      </Row>
    </>
  );
};

export default EPinTransferReportOne;
