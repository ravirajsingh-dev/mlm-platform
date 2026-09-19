import React from "react";
import { Col, Row, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import Tile from "@src/views/Common/Tile";
import { getLevelTitle } from "@src/utils/levelHelper";

const LevelWiseOne = ({ level, params, index }) => {
  const navigate = useNavigate();
  const sr_no = (params.page - 1) * params.limit + index + 1;
  return (
    <>
      <Row>
        <div className="s-no">{sr_no}.</div>

        <Col xs="12" sm="6" md="4" lg="3">
          <Tile label={"Level"} value={getLevelTitle(level?.level)} />
        </Col>

        <Col xs="12" sm="6" md="4" lg="3">
          <Tile label={"Required Team"} value={level?.requireTeam} />
        </Col>

        <Col xs="12" sm="6" md="4" lg="3">
          <Tile label={"Total Team"} value={level?.totalTeam} />
        </Col>

        <Col xs="12" sm="6" md="4" lg="3">
          <div className="card-footer">
            <Button
              className="theme_btn"
              onClick={() =>
                navigate("/user/level-wise-team", {
                  state: { team: level.users || [], level: level.level || "-" },
                })
              }
              disabled={!level?.totalTeam}
            >
              Show Users
            </Button>
          </div>
        </Col>
      </Row>
    </>
  );
};

export default LevelWiseOne;
