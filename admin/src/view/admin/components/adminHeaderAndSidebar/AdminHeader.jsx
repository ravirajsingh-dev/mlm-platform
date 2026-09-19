import React, { useState, useEffect } from "react";
import { Container, Dropdown, Nav, Navbar, Row, Col } from "react-bootstrap";
import { useLocation } from "react-router-dom";
import { connect } from "react-redux";
import PropTypes from "prop-types";

// icons
import { RiMenu2Line } from "react-icons/ri";
import { FaUser } from "react-icons/fa";
import { FaRegCircleUser } from "react-icons/fa6";
import { MdPowerSettingsNew } from "react-icons/md";
import { IoSettingsOutline } from "react-icons/io5";

// custom imports
import AdminSidebar from "./AdminSidebar";
import AdminLogoutModal from "../../modals/AdminLogoutModal";
import { updateSidebarExpendedAction } from "@src/actions/adminAuth";
import AdminSidebarItems from "./Index";
import { capitalizeAll } from "@src/utils/helper";

const AdminHeader = ({ adminAuth: { admin }, updateSidebarExpendedAction }) => {
  const [modalShow, setModalShow] = useState(false);
  const location = useLocation();
  const [heading, setHeading] = useState("Dashboard");

  useEffect(() => {
    const currentItem = AdminSidebarItems.find(
      (item) =>
        item.path === location.pathname ||
        (item.children &&
          item.children.some((child) => child.path === location.pathname))
    );

    if (currentItem) {
      setHeading(currentItem.heading);
    } else {
      AdminSidebarItems.forEach((item) => {
        if (item.children) {
          const childItem = item.children.find(
            (child) => child.path === location.pathname
          );
          if (childItem) setHeading(childItem.heading);
        }
      });
    }
  }, [location.pathname]);

  const handleShow = () => {
    updateSidebarExpendedAction();
  };

  const handleLogout = async () => {
    setModalShow(true);
  };

  return (
    <Navbar className="navbar">
      <Container fluid>
        <Navbar.Brand>
          <RiMenu2Line
            onClick={handleShow}
            size={25}
            className="pointer-icon"
          />
          {heading}
        </Navbar.Brand>
        <Navbar.Toggle />
        <Navbar.Collapse>
          <Nav
            className="me-auto my-2 my-lg-0"
            style={{ maxHeight: "100px" }}
            navbarScroll
          ></Nav>

          <Dropdown align="end">
            <Dropdown.Toggle variant="link" bsPrefix="p-0">
              <FaUser className="text-black me-3" size={20} />
            </Dropdown.Toggle>
            <Dropdown.Menu className="admin-header-profile">
              <Container>
                <Row className="gap-2 mb-2 pb-2 admin-header-profile-icon">
                  <Col xs={12} className="text-center">
                    <FaRegCircleUser size={40} />
                  </Col>
                  <Col xs={12} className="text-center">
                    {admin && admin.name ? capitalizeAll(admin?.name) : "user"}
                  </Col>
                </Row>
              </Container>
              <Dropdown.Item>
                <IoSettingsOutline size={18} /> Settings
              </Dropdown.Item>
              <Dropdown.Item className="text-danger" onClick={handleLogout}>
                <MdPowerSettingsNew size={18} /> Logout
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Navbar.Collapse>
      </Container>
      <AdminSidebar setHeading={setHeading} />

      <AdminLogoutModal show={modalShow} onHide={() => setModalShow(false)} />
    </Navbar>
  );
};

AdminHeader.propTypes = {
  adminAuth: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
  errorList: state.errors,
  adminAuth: state.adminAuth,
});

export default connect(mapStateToProps, {
  updateSidebarExpendedAction,
})(AdminHeader);
