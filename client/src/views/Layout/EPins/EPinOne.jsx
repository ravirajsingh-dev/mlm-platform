import React from "react";
import { Col, Row } from "react-bootstrap";
import moment from "moment";
import Tile from "@src/views/Common/Tile";

const EPinOne = ({ epin, params, index }) => {
  const sr_no = (params.page - 1) * params.limit + index + 1;
  return (
    <>
      <Row className="tile-body">
        <div className="s-no">{sr_no}.</div>

        <Col xs="12" sm="6" md="4">
          <Tile
            label={"EPin ID"}
            value={epin?.EPin_ID}
            copyable={!epin.is_expired ? true : false}
            copyableValue={epin?.EPin_ID}
          />
        </Col>

        <Col xs="12" sm="6" md="4">
          <Tile
            label={"Status"}
            value={epin.is_expired ? `Used By: ${epin.used_by}` : "Unused"}
          />
        </Col>
      </Row>
    </>
  );
};

export default EPinOne;
