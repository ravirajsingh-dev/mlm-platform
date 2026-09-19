import React from "react";
import { Button, Badge, Col, Row } from "react-bootstrap";
import moment from "moment";

import Tile from "@src/views/Common/Tile";

const UserOne = ({ user, params, index }) => {
  const sr_no = (params.page - 1) * params.limit + index + 1;
  return (
    <>
      <Row className="tile-body">
        <div className="s-no">{sr_no}.</div>

        <Col xs="12" sm="6" md="4" lg="3">
          <Tile
            label={"Name"}
            value={`${user?.name} (${user?.EP_ID})`}
            copyable={user && user?.EP_ID ? true : false}
            copyableValue={user?.EP_ID}
          />
        </Col>

        <Col xs="12" sm="6" md="4" lg="3">
          <Tile
            label={"Phone"}
            value={
              user && user?.phone ? user?.phone : <p className="dash">-</p>
            }
            copyable={user && user?.phone ? true : false}
            copyableValue={user?.phone}
          />
        </Col>

        <Col xs="12" sm="6" md="4" lg="3">
          <Tile
            label={"Sponsor ID"}
            value={user?.sponsorEP}
            copyable={true}
            copyableValue={user?.sponsorEP}
          />
        </Col>

        <Col xs="12" sm="6" md="4" lg="3">
          <Tile
            label={"Upline EP"}
            value={user?.uplineEP}
            copyable={true}
            copyableValue={user?.uplineEP}
          />
        </Col>

        <Col xs="12" sm="6" md="4" lg="3">
          <Tile
            label={"Joining Date"}
            value={moment(user?.createdAt).format("ll")}
          />
        </Col>
      </Row>
    </>
  );
};

export default UserOne;
