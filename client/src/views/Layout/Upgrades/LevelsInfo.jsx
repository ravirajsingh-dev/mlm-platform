import React from "react";

import { connect } from "react-redux";
import { Col } from "react-bootstrap";
import { formatIndianNumber } from "@src/utils/helper";
import LevelInfoModal from "./LevelInfoModal";
import UpgradeCostModal from "./UpgradeCostModal";
import PotentialEarningsModal from "./PotentialEarningsModal";
import { getLevelsList } from "@src/actions/upgradeActions";
import { FaCheck, FaArrowRight, FaSpinner } from "react-icons/fa";

const LevelCard = ({ levelInfo, status, loggedInUser }) => {
  const [showModal, setShowModal] = React.useState(false);
  const [showUpgradeCostModal, setShowUpgradeCostModal] = React.useState(false);
  const [showPotentialEarningsModal, setShowPotentialEarningsModal] =
    React.useState(false);
  const isUpcoming = status === "upcoming";

  return (
    <div className={`level-table-container ${status}`}>
      <div className="level-table-row">
        <div className="level-header-row">
          <div className="level-title">{levelInfo.title}</div>
          <span className={`status-icon ${status}`}>
            {status === "completed" && <FaCheck className="achieved-icon" />}
            {status === "processing" && (
              <FaSpinner className="achieved-icon spin-icon" />
            )}
            {status === "upcoming" && (
              <FaArrowRight className="achieved-icon" />
            )}
          </span>
        </div>

        <div className="details-row">
          <div className="detail-item">
            <div className="detail-label">Upgrade Cost</div>
            <div
              className="detail-value"
              style={{
                cursor: isUpcoming ? "not-allowed" : "pointer",
                textDecoration: isUpcoming ? "none" : "underline",
                color: isUpcoming ? "#6c757d" : "#ffe082",
              }}
              onClick={() => !isUpcoming && setShowUpgradeCostModal(true)}
              title={
                isUpcoming
                  ? "Unavailable for upcoming levels"
                  : "Click to view payment details"
              }
            >
              {formatIndianNumber(levelInfo.upgrade_bits)}
            </div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Upcoming Earnings</div>
            <div
              className="detail-value"
              style={{
                cursor: isUpcoming ? "not-allowed" : "pointer",
                textDecoration: isUpcoming ? "none" : "underline",
                color: isUpcoming ? "#6c757d" : "#ffe082",
              }}
              onClick={() => !isUpcoming && setShowPotentialEarningsModal(true)}
              title={
                isUpcoming
                  ? "Unavailable for upcoming levels"
                  : "Click to view earnings details"
              }
            >
              {levelInfo.earnings_on_upgrade?.total_earnings || "-"}
            </div>
          </div>
        </div>

        {/* <div className="button-row">
          <Button
            className="view-details-btn"
            onClick={() => setShowModal(true)}
          >
            View Full Details
          </Button>
        </div> */}
      </div>

      <LevelInfoModal
        show={showModal}
        onHide={() => setShowModal(false)}
        level={levelInfo}
      />
      <UpgradeCostModal
        show={showUpgradeCostModal}
        onHide={() => setShowUpgradeCostModal(false)}
        level={levelInfo}
        loggedInUser={loggedInUser}
      />
      <PotentialEarningsModal
        show={showPotentialEarningsModal}
        onHide={() => setShowPotentialEarningsModal(false)}
        level={levelInfo}
        loggedInUser={loggedInUser}
      />
    </div>
  );
};

const LevelsInfo = ({ levelsList, user, getLevelsList, loggedInUser }) => {
  const [completedLevels, setCompletedLevels] = React.useState([]);
  const [upcomingLevels, setUpcomingLevels] = React.useState([]);
  const [processingLevels, setProcessingLevels] = React.useState([]);

  React.useEffect(() => {
    if (!user || !levelsList.length) {
      console.log("No user or levelsList data.");
      return;
    }

    const userCurrentLevel = user.user_level;

    // Completed levels (including current level)
    const completed = levelsList.filter((l) => l.level <= userCurrentLevel);
    setCompletedLevels(completed);

    // Processing level (current level + 1 if exists)
    const processing = levelsList.find((l) => l.level === userCurrentLevel + 1);
    setProcessingLevels(processing ? [processing] : []);

    // Upcoming levels (excluding processing level)
    const upcoming = levelsList.filter(
      (l) => l.level > userCurrentLevel && l.level !== userCurrentLevel + 1
    );
    setUpcomingLevels(upcoming);
  }, [user, levelsList]);

  return (
    <>
      {/* Completed Levels - Only show if exists */}
      {completedLevels.length > 0 && (
        <>
          <div className="header-container">
            <div className="heading">Completed Levels</div>
          </div>
          {completedLevels.map((level) => (
            <Col xs={12} md={6} key={level.level}>
              <LevelCard
                levelInfo={level}
                status="completed"
                loggedInUser={loggedInUser}
              />
            </Col>
          ))}
        </>
      )}

      {/* Processing Level - Only show if exists */}
      {processingLevels.length > 0 && (
        <>
          <div className="header-container">
            <div className="heading">Processing Level</div>
          </div>
          {processingLevels.map((level) => (
            <Col xs={12} md={6} key={level.level}>
              <LevelCard
                levelInfo={level}
                status="processing"
                loggedInUser={loggedInUser}
              />
            </Col>
          ))}
        </>
      )}

      {/* Upcoming Levels - Only show if exists */}
      {upcomingLevels.length > 0 && (
        <>
          <div className="header-container">
            <div className="heading">Upcoming Levels</div>
          </div>
          {upcomingLevels.map((level) => (
            <Col xs={12} md={6} key={level.level}>
              <LevelCard
                levelInfo={level}
                status="upcoming"
                loggedInUser={loggedInUser}
              />
            </Col>
          ))}
        </>
      )}

      {/* Show message if no levels found */}
      {!processingLevels.length &&
        !upcomingLevels.length &&
        !completedLevels.length && (
          <Col xs={12} className="text-center py-5">
            <div className="empty-state-message">
              No levels information available
            </div>
          </Col>
        )}
    </>
  );
};

const mapStateToProps = (state) => ({
  user: state.auth.user,
  loggedInUser: state.auth.user,
  levelsList: state.upgrade.levelsList,
});

export default connect(mapStateToProps, { getLevelsList })(LevelsInfo);
