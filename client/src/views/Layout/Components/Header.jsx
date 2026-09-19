import React, { useState } from "react";
import { Container, Row, Col, Button, Image } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import { FaBars, FaSignOutAlt, FaSignInAlt, FaUserPlus } from "react-icons/fa";
import logo from "@assets/img/logo/logo.png";
import PortalItems from "@src/views/Routing/PortalItems";
import { BiSolidChevronDown } from "react-icons/bi";
import Sidebar from "./Sidebar";
import { connect } from "react-redux";
import { logout } from "@src/actions/auth";
import LogoutModal from "@src/views/Common/Modal/LogoutModal";
import MobileBottomNav from "./MobileBottomNav";

const Header = ({ logout, isAuthenticated }) => {
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleLogoutModal = () => setShowLogoutModal(!showLogoutModal);

  // Separate items based on authentication
  const publicItems = PortalItems.filter((item) => !item.isAuth);
  const privateItems = isAuthenticated
    ? PortalItems.filter((item) => item.isAuth)
    : [];

  React.useEffect(() => {
    const handleScroll = () => {
      const scroll = window.scrollY || document.documentElement.scrollTop;
      const header = document.querySelector(".main-header-area");

      if (scroll < 245) {
        header.classList.remove("sticky");
      } else {
        header.classList.add("sticky");
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header id="top-menu">
      <div className="main-header-area p-2">
        <Container fluid>
          <Row className="align-items-center justify-content-between header-border">
            <Col className="col-xl-2 col-lg-3 col-md-4 col-6">
              <div className="logo">
                <Link to="/" title="EP-Logo">
                  <Image src={logo} alt="ekpahal" />
                </Link>
              </div>
            </Col>
            <Col className="col-xl-8 col-lg-8 d-none d-xl-block">
              <div className="main-menu text-center">
                <nav>
                  <ul>
                    {[...publicItems, ...privateItems].map((item, i) => (
                      <li key={i}>
                        <Link to={item.path || "#"}>
                          {item.label} {item.children && <BiSolidChevronDown />}
                        </Link>
                        {item.children && (
                          <ul className="submenu">
                            {item.children.map((subItem, j) => (
                              <li key={j}>
                                <Link to={subItem.path}>{subItem.label}</Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            </Col>
            <Col className="col-xl-2 col-lg-1 col-md-4 col-6 text-right justify-content-end d-flex">
              <div className="hamburger-menu d-none d-lg-block">
                <Button onClick={toggleSidebar}>
                  <FaBars />
                </Button>
              </div>
              <div className="side-nav auth-btn d-block d-md-none d-xl-block">
                {isAuthenticated ? (
                  <Button
                    className={`nav-item ${
                      location.pathname === "/logout" ? "active" : ""
                    }`}
                    onClick={toggleLogoutModal}
                  >
                    <FaSignOutAlt className="nav-icon" />
                    <span className="nav-label">Logout</span>
                  </Button>
                ) : (
                  <div className="d-flex gap-2">
                    <Button
                      className={`nav-item ${
                        location.pathname === "/register" ? "active" : ""
                      }`}
                      href="/register"
                    >
                      <FaUserPlus className="nav-icon" />
                      <span className="nav-label">Register</span>
                    </Button>

                    <Button
                      className={`nav-item ${
                        location.pathname === "/login" ? "active" : ""
                      }`}
                      href="/login"
                    >
                      <FaSignInAlt className="nav-icon" />
                      <span className="nav-label">Login</span>
                    </Button>
                  </div>
                )}
              </div>
            </Col>
          </Row>
        </Container>
      </div>
      <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />
      {!isSidebarOpen && (
        <MobileBottomNav
          isAuthenticated={isAuthenticated}
          onLogout={toggleLogoutModal}
        />
      )}

      <LogoutModal
        show={showLogoutModal}
        onHide={toggleLogoutModal}
        logout={logout}
      />
    </header>
  );
};

const mapStateToProps = (state) => ({
  isAuthenticated: state.auth.isAuthenticated,
});

export default connect(mapStateToProps, { logout })(Header);
