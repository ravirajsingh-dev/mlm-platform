import React, { useEffect } from "react";
import { Container, Row, Col, Button, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import AppBreadCrumb from "@src/views/Common/AppBreadCrumb";
import { fetchWithdrawalSettings } from "@src/actions/withdrawalActions";
import WithdrawalHistory from "./WithdrawalHistory";
import BouncingLoader from "@src/views/Common/Loaders/BouncingLoader";

const WithdrawalLayout = ({
  withdrawalSettings,
  loadingWithdrawalSettings,
  fetchWithdrawalSettings,
}) => {
  useEffect(() => {
    fetchWithdrawalSettings();
  }, [fetchWithdrawalSettings]);

  const hasPendingRequest = withdrawalSettings?.hasPendingRequest || false;
  const withdrawalEnabled = withdrawalSettings?.withdrawalEnabled || false;

  return (
    <Container>
      <Row className="grid grid-cols-2 gap-4">
        <Col xs={12}>
          <AppBreadCrumb
            title="Withdrawal"
            breadcrumbs={[
              { label: "Dashboard", link: "/user/dashboard" },
              { label: "Withdrawal Overview" },
            ]}
          />
        </Col>

        <Col xs={12}>
          {loadingWithdrawalSettings ? (
            <BouncingLoader />
          ) : !withdrawalSettings ? (
            <Alert variant="warning">
              Withdrawal is currently disabled. Please contact support.
            </Alert>
          ) : !withdrawalEnabled ? (
            <Alert variant="warning">
              Withdrawal is currently disabled. Please contact support.
            </Alert>
          ) : (
            <>
              <Button
                as={Link}
                to="/user/withdraw-e-cash"
                className="me-2 theme_btn"
                disabled={hasPendingRequest || loadingWithdrawalSettings}
                title={
                  hasPendingRequest
                    ? "You have a pending withdrawal request"
                    : ""
                }
              >
                {hasPendingRequest
                  ? "Withdraw E-Cash (Pending Request)"
                  : "Withdraw E-Cash"}
              </Button>
            </>
          )}
        </Col>
      </Row>
      <Row>
        <WithdrawalHistory />
      </Row>
    </Container>
  );
};

WithdrawalLayout.propTypes = {
  withdrawalSettings: PropTypes.object,
  loadingWithdrawalSettings: PropTypes.bool,
  fetchWithdrawalSettings: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  withdrawalSettings: state.wallet.withdrawalSettings,
  loadingWithdrawalSettings: state.wallet.loadingWithdrawalSettings,
});

export default connect(mapStateToProps, {
  fetchWithdrawalSettings,
})(WithdrawalLayout);
