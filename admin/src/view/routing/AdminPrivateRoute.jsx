import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import Spinner from "@src/view/spinners/Spinner";
import { isAdmin } from "@src/utils/helper";

const AdminPrivateRoute = ({
  component,
  adminAuth: { isAdminAuthenticated, adminLoading, admin },
  ...rest
}) => {
  return adminLoading ? (
    <div className="center-loader">
      <Spinner minHeight="100vh" />
    </div>
  ) : !isAdminAuthenticated || (admin && !isAdmin(admin)) ? (
    <Navigate to="/" />
  ) : (
    <Outlet />
  );
};

AdminPrivateRoute.propTypes = {
  adminAuth: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
  adminAuth: state.adminAuth,
});

export default connect(mapStateToProps, {})(AdminPrivateRoute);
