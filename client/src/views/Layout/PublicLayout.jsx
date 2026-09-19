import React, { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { HelmetProvider } from "react-helmet-async";

import { setRouter } from "@src/utils/routerService";
import { removeAllErrors } from "@src/actions/commonActions";
import ShowAlert from "@src/notifications/ShowAlert";
import Header from "./Components/Header";
import Footer from "./Components/Footer";
import DefaultFooter from "./Components/DefaultFooter";
// import Header from "./Header/Header";
// import Footer from "./Footer/Footer";

const Publicayout = ({ alerts, removeAllErrors }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setRouter(navigate);
  }, [navigate]);

  useEffect(() => {
    // Clear alerts when URL changes
    removeAllErrors();
  }, [location.pathname, removeAllErrors]);

  return (
    <HelmetProvider>
      <ShowAlert />
      <div className="d-flex flex-column min-vh-100">
        <Header />

        <div className="flex-grow-1">
          <Outlet />
        </div>

        <Footer />
        <DefaultFooter />
      </div>
    </HelmetProvider>
  );
};

Publicayout.propTypes = {
  auth: PropTypes.object.isRequired,
  alerts: PropTypes.array.isRequired,
  removeAllErrors: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  auth: state.auth,
  alerts: state.alert,
});

export default connect(mapStateToProps, { removeAllErrors })(Publicayout);
