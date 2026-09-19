import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Offcanvas, ListGroup, Col, Accordion, Row } from "react-bootstrap";
import PropTypes from "prop-types";
import { connect } from "react-redux";

// icons
import { TbChevronDown, TbChevronUp } from "react-icons/tb";
import { IoMdClose } from "react-icons/io";
import { MdPowerSettingsNew } from "react-icons/md";
import { IoSettingsOutline } from "react-icons/io5";

// custom import
import AdminSidebarItems from "./Index";
import AdminLogoutModal from "../../modals/AdminLogoutModal";
import { updateSidebarExpendedAction } from "@src/actions/adminAuth";

const AdminSidebar = ({
  setHeading,
  adminAuth: { isSidebarExpended },
  updateSidebarExpendedAction,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [modalShow, setModalShow] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [openItem, setOpenItem] = useState(null);

  useEffect(() => {
    const currentPath = location.pathname;
    AdminSidebarItems.forEach((item) => {
      if (item.path === currentPath) {
        setHeading(item.heading);
        setActiveItem(item.key);
      } else if (item.children) {
        item.children.forEach((child) => {
          if (child.path === currentPath) {
            setHeading(child.heading);
            setActiveItem(child.key);
            setOpenItem(item.key);
          }
        });
      }
    });
  }, [location.pathname, setHeading]);

  const handleItemActive = (item) => {
    setHeading(item.heading);
    setActiveItem(item.key);
    navigate(item.path);
  };

  const handleAccordionToggle = (key) => {
    setOpenItem(openItem === key ? null : key);
  };

  const handleSidebarClose = () => {
    updateSidebarExpendedAction();
  };

  return (
    <>
      <Offcanvas
        show={isSidebarExpended}
        backdrop="static"
        scroll={true}
        className="slider"
      >
        <Offcanvas.Header className="slider-header">
          <Offcanvas.Title>{"Ek Pahal Admin"}</Offcanvas.Title>
          <IoMdClose
            size={25}
            onClick={handleSidebarClose}
            className="pointer-icon cross-icon-admin-sidebar"
          />
        </Offcanvas.Header>
        <Offcanvas.Body className="mt-3 slider-body">
          <Accordion activeKey={openItem} className="accordian-sidebar">
            {AdminSidebarItems.map((item) => (
              <Accordion.Item
                eventKey={item.key}
                key={item.key}
                className="sidebar-items"
              >
                <Accordion.Header
                  onClick={() => handleAccordionToggle(item.key)}
                >
                  <Col
                    className={`sideBarItem ${
                      activeItem === item.key ? "activeItem" : ""
                    }`}
                    onClick={() => !item.children && handleItemActive(item)}
                  >
                    {item.icon} {item.label}
                    {item.children &&
                      (openItem === item.key ? (
                        <TbChevronUp style={{ marginLeft: "auto" }} />
                      ) : (
                        <TbChevronDown style={{ marginLeft: "auto" }} />
                      ))}
                  </Col>
                </Accordion.Header>
                {item.children && (
                  <Accordion.Body>
                    <ListGroup variant="flush" className="pt-1">
                      {item.children.map((child) => (
                        <ListGroup.Item
                          key={child.key}
                          className={`sideBarItem sidebar-childrens ${
                            activeItem === child.key
                              ? "active-sidebar-childrens"
                              : ""
                          }`}
                          onClick={() => handleItemActive(child)}
                        >
                          {child.icon} {child.label}
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </Accordion.Body>
                )}
              </Accordion.Item>
            ))}
          </Accordion>
          <Row className="m-0 sidebar-bottom">
            <Col xs={12} className="admin-logout-button">
              <IoSettingsOutline size={18} /> Setting
            </Col>
            <Col
              className="text-danger admin-logout-button"
              onClick={() => setModalShow(true)}
            >
              <MdPowerSettingsNew size={18} /> Logout
            </Col>
          </Row>
        </Offcanvas.Body>
      </Offcanvas>
      <AdminLogoutModal show={modalShow} onHide={() => setModalShow(false)} />
    </>
  );
};

AdminSidebar.propTypes = {
  setHeading: PropTypes.func.isRequired,
  adminAuth: PropTypes.object.isRequired,
  updateSidebarExpendedAction: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  adminAuth: state.adminAuth,
  errorList: state.errors,
});

export default connect(mapStateToProps, { updateSidebarExpendedAction })(
  AdminSidebar
);
