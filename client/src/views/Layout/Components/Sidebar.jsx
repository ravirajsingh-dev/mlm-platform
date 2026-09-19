import React, { useState } from "react";
import { Button } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import { FaTimes } from "react-icons/fa";
import PortalItems from "@src/views/Routing/PortalItems";
import { connect } from "react-redux";
import { logout } from "@src/actions/auth";
import LogoutModal from "@src/views/Common/Modal/LogoutModal";

const Sidebar = ({ logout, isOpen, onClose, isAuthenticated }) => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const location = useLocation();

  const toggleDropdown = (label) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  const toggleLogoutModal = () => {
    setShowLogoutModal(!showLogoutModal);
  };

  // Filter menu items based on authentication
  const filteredItems = PortalItems.filter(
    (item) => !item.isAuth || isAuthenticated
  );

  return (
    <>
      <div
        className={`body-overlay ${isOpen ? "active" : ""}`}
        onClick={onClose}
      ></div>
      <div className={`slide-bar ${isOpen ? "show" : ""}`}>
        <div className="close-mobile-menu">
          <Link to="#" onClick={onClose}>
            <FaTimes />
          </Link>
        </div>

        <nav className="side-mobile-menu">
          <ul id="mobile-menu-active" className="metismenu">
            {filteredItems.map((item, index) => (
              <li
                key={index}
                className={`has-dropdown ${
                  item.children ? "with-children" : ""
                } ${openDropdown === item.label ? "open" : ""}`}
              >
                <Link
                  to={item.children ? "#" : item.path}
                  onClick={(e) => {
                    if (item.children) {
                      e.preventDefault();
                      toggleDropdown(item.label);
                    } else {
                      onClose();
                    }
                  }}
                >
                  {item.label}
                  {item.children && <span className="arrow"></span>}
                </Link>

                {item.children && (
                  <ul className="sub-menu">
                    {item.children.map((child, childIndex) => (
                      <li
                        key={childIndex}
                        className={
                          location.pathname === child.path ? "active" : ""
                        }
                      >
                        <Link to={child.path} onClick={onClose}>
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-auth">
          {isAuthenticated ? (
            <Button className="logout-btn" onClick={toggleLogoutModal}>
              Logout
            </Button>
          ) : (
            <Button className="theme_btn" href="/login">
              Login
            </Button>
          )}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <LogoutModal
        show={showLogoutModal}
        onHide={toggleLogoutModal}
        logout={logout}
      />
    </>
  );
};

const mapStateToProps = (state) => ({
  isAuthenticated: state.auth.isAuthenticated,
});

export default connect(mapStateToProps, { logout })(Sidebar);
