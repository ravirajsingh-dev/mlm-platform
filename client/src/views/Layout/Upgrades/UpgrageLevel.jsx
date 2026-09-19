import React from "react";
import { Image } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { connect } from "react-redux";

import BouncingLoader from "@src/views/Common/Loaders/BouncingLoader";
import LevelsInfo from "./LevelsInfo";
import { Container, Col, Row } from "react-bootstrap";
import AppBreadCrumb from "@src/views/Common/AppBreadCrumb";
import { getLevelsList } from "@src/actions/upgradeActions";

const UpgrageLevel = ({ loadingLevelsList, levelsList, getLevelsList }) => {
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!levelsList?.length) {
      getLevelsList();
    }
  }, [getLevelsList, levelsList]);

  return (
    <Container>
      <Row>
        <AppBreadCrumb
          title="Upgrade Levels"
          breadcrumbs={[
            { label: "Dashboard", link: "/user/dashboard" },
            { label: "Upgrade Levels" },
          ]}
        />
      </Row>
      <Row>
        {loadingLevelsList ? (
          <BouncingLoader minHeight="400px" />
        ) : (
          <LevelsInfo />
        )}
      </Row>
    </Container>
  );
};

const mapStateToProps = (state) => ({
  loadingUpgrade: state.upgrade.loadingUpgrade,
  loadingLevelsList: state.upgrade.loadingLevelsList,
  levelsList: state.upgrade.levelsList,
  user: state.auth.user,
});

export default connect(mapStateToProps, { getLevelsList })(UpgrageLevel);
