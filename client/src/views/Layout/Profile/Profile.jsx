import React, { useEffect, useState } from "react";
import { Col, Container, Row, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { PropTypes } from "prop-types";
import { connect } from "react-redux";

// custom imports
import LogoutModal from "@src/views/Common/Modal/LogoutModal";
import { toRoman } from "@src/utils/helper";

import EditProfile from "./EditProfile";
import AppBreadCrumb from "@src/views/Common/AppBreadCrumb";
import CopyIcon from "@src/views/Common/CopyIcon";
import { getLevelTitle } from "@src/utils/levelHelper";

const Profile = ({ auth: { user }, unreadNotificationsList: { count } }) => {
  const navigate = useNavigate();

  const [uuid, setUID] = useState(null);
  const [avatarName, setAvatarName] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copyTrigger, setCopyTrigger] = useState(5000);
  const [modalShow, setModalShow] = useState(false);
  const [showEditOption, setShowEditOption] = useState(false);

  useEffect(() => {
    if (!user) return;

    if (user?.uuid) {
      setUID(user?.uuid);
    }
    if (user?.avatar) {
      setAvatarName(user?.avatar);
    }
  }, [user]);

  useEffect(() => {
    setCopied(false);
  }, []);

  const otherCopy = () => {
    setCopied(true);
    setCopyTrigger(copyTrigger + 1);
  };

  const changeAvatar = () => {
    navigate("/user/change-avatar");
  };

  const handleShowEditOption = () => {
    setShowEditOption((prev) => !prev); // Toggle the state
  };

  return (
    <>
      <Container className="profile-container">
        <AppBreadCrumb
          title="Profile"
          breadcrumbs={[
            { label: "Dashboard", link: "/user/dashboard" },
            { label: "Profile" },
          ]}
        />

        <Card className="profile-card">
          <div className="profile-content">
            {user?.is_root ? (
              <Row>
                <Col>
                  <span className="dashboard-desc">
                    Hello, You are a root user.
                  </span>
                </Col>
              </Row>
            ) : null}
            <div className="avatar-wrapper">
              {/* <Image
                src={userimg}
                roundedCircle
                className="profile-avatar"
                alt="Profile"
              /> */}
              <div className="profile-avatar">{toRoman(user?.user_level)}</div>
            </div>
            <h2 className="user-id">{getLevelTitle(user?.user_level)}</h2>
            <h2 className="user-id">
              {user?.EP_ID}

              <CopyIcon textToCopy={user?.EP_ID} />
            </h2>
            <p className="user-name">
              Welcome, <span>{user?.name} !</span>
            </p>
          </div>
          <Card className="stats-container">
            <Row className="g-2">
              <Col xs={6} md={3}>
                <div className="stat-card">
                  <div className="stat-value">
                    {user?.sponsorEP}
                    <CopyIcon textToCopy={user?.sponsorEP} />
                  </div>
                  <div className="stat-label">Sponsor</div>
                </div>
              </Col>

              <Col xs={6} md={3}>
                <div className="stat-card">
                  <div className="stat-value">
                    {user?.uplineEP}
                    <CopyIcon textToCopy={user?.uplineEP} />
                  </div>
                  <div className="stat-label">Upline</div>
                </div>
              </Col>
              <Col xs={6} md={3}>
                <div className="stat-card">
                  <div className="stat-value">
                    {user?.phone}
                    <CopyIcon textToCopy={user?.phone} />
                  </div>
                  <div className="stat-label">Phone</div>
                </div>
              </Col>

              <Col xs={6} md={3}>
                <div className="stat-card">
                  <div className="stat-value">
                    {getLevelTitle(user?.user_level)}
                  </div>
                  <div className="stat-label">Level</div>
                </div>
              </Col>
            </Row>
            {/* <Row className=" profile-edit-btn">
            <Col xs={12} className="d-flex justify-content-center">
              <Button
                className="mobile_common_btn"
                title={showEditOption ? "Close Edit" : "Edit User"}
                onClick={handleShowEditOption}
              >
                <LiaUserEditSolid size={30} />
                {showEditOption ? "Close Edit" : "Edit User"}{" "}
              </Button>
            </Col>
          </Row> */}
          </Card>
        </Card>
      </Container>
      {showEditOption && (
        <Col className="my-3">
          <EditProfile closeEditSec={setShowEditOption} user={user} />
        </Col>
      )}

      <LogoutModal show={modalShow} onHide={() => setModalShow(false)} />
    </>
  );
};

Profile.propTypes = {
  unreadNotificationsList: PropTypes.object.isRequired,
  auth: PropTypes.object,
};

const mapStateToProps = (state) => ({
  auth: state.auth,
  unreadNotificationsList: state.notifications.unreadNotificationsList,
  wallet: state.wallet,
});

export default connect(mapStateToProps, {})(Profile);
