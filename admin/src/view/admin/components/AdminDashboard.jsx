import React, { useEffect } from "react";
import { PropTypes } from "prop-types";
import { connect } from "react-redux";
import { Container, Row, Col } from "react-bootstrap";

// icons
import { LuUsers, LuWallet } from "react-icons/lu";

// Custom imports
import MainCard from "@src/view/commonComponents/mainCard/MainCard";
import LoadingSkeleton from "@src/view/commonComponents/loadingSkeleton/LoadingSkeleton";

// Actions
import { fetchAdminDashboardData } from "@src/actions/adminActions";

const AdminDashboard = ({
  adminAuth: { admin },
  fetchAdminDashboardData,
  adminDashboard: { dashboardData, loadingDashboard },
}) => {
  const { totalUserCount, totalCurrentBalance } = dashboardData;

  useEffect(() => {
    if (!admin) return;
    fetchAdminDashboardData();
  }, [admin]);

  return (
    <Container fluid>
      <Row className="admin-dashboard-card-container ">
        <Col xs={12} md={6} lg={4}>
          <Col className="admin-dashboard-card-container-col">
            <MainCard>
              <Row>
                <Col xs={9}>Total Users </Col>
                <Col className="text-end">
                  <LuUsers size={25} />
                </Col>
                <Col xs={12} className="  dashboard-card-heading">
                  {loadingDashboard ? <LoadingSkeleton /> : totalUserCount}
                </Col>
              </Row>
            </MainCard>
          </Col>
        </Col>

        <Col xs={12} md={6} lg={4}>
          <Col className="admin-dashboard-card-container-col-3">
            <MainCard>
              <Row>
                <Col xs={9}>Users Current Balance</Col>
                <Col className="text-end">
                  <LuWallet size={25} />
                </Col>
                <Col xs={12} className="  dashboard-card-heading">
                  {loadingDashboard ? (
                    <LoadingSkeleton />
                  ) : (
                    `₹ ${totalCurrentBalance}`
                  )}
                </Col>
              </Row>
            </MainCard>
          </Col>
        </Col>
        <Col xs={12} md={6} lg={4}>
          <Col className="admin-dashboard-card-container-col-2">
            <MainCard>
              <Row>
                <Col xs={9}>Users Current Balance</Col>
                <Col className="text-end">
                  <LuWallet size={25} />
                </Col>
                <Col xs={12} className="  dashboard-card-heading">
                  {loadingDashboard ? (
                    <LoadingSkeleton />
                  ) : (
                    `₹ ${totalCurrentBalance}`
                  )}
                </Col>
              </Row>
            </MainCard>
          </Col>
        </Col>
      </Row>
    </Container>
  );
};

AdminDashboard.propTypes = {
  fetchAdminDashboardData: PropTypes.func.isRequired,
  adminAuth: PropTypes.object.isRequired,
  adminDashboard: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
  adminAuth: state.adminAuth,
  adminDashboard: state.adminDashboard,
});

export default connect(mapStateToProps, { fetchAdminDashboardData })(
  AdminDashboard
);
