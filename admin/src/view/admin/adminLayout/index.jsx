import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Routes, Route } from "react-router-dom";

// custom imports
import AdminRoutes from "@src/view/routing/AdminRoutes";
import { isAdmin } from "@src/utils/helper";
import NoDataFoundPage from "@src/view/commonComponents/notFataFoundPage/NoDataFoundPage";
import AdminHeader from "../components/adminHeaderAndSidebar/AdminHeader";
import ShowAlert from "@src/notifications/ShowAlert";

const AdminLayout = ({ adminAuth: { admin, isSidebarExpended } }) => {
  return (
    <div
      id="Admin"
      className={`admin-dashboard ${isSidebarExpended ? "show" : "hide"}`}
    >
      <AdminHeader />
      <ShowAlert />
      <div className="adminScroll py-3">
        <Routes>
          {AdminRoutes.map((route, i) => {
            return isAdmin(admin) ? (
              <Route path={route.path} element={route.element} key={i} />
            ) : (
              <Route path="/*" element={<NoDataFoundPage />} key={i} />
            );
          })}
        </Routes>
      </div>
    </div>
  );
};

AdminLayout.propTypes = {
  adminAuth: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
  adminAuth: state.adminAuth,
});
export default connect(mapStateToProps, {})(AdminLayout);
