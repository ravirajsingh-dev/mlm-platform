import React from "react";
import { Card, Row, Col, Container } from "react-bootstrap";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  FaUser,
  FaShieldAlt,
  FaKey,
  FaMoneyCheckAlt,
  FaUserLock,
  FaQrcode,
  FaLandmark,
  FaWallet,
  FaUniversity,
} from "react-icons/fa";

const EpinsLayout = () => {
  const location = useLocation();
  const settingsLinks = [
    {
      path: "/user/e-pins",
      label: "EP-Keys List",
      icon: FaUser,
      description: "List of EP-Keys information",
    },
    {
      path: "/user/epins/transfer-reports",
      label: "Transfer Reports",
      icon: FaKey,
      description: "Details of EP-Keys transfer",
    },
  ];

  return (
    <Container className="settings-layout">
      <div className="card-heading-unique">
        <div className="heading-underline">Account Settings !</div>
      </div>
      <Row className="g-4 mb-5">
        {settingsLinks.map((link) => {
          const isActive = location.pathname === link.path;
          const Icon = link.icon;

          return (
            <Col key={link.path} xs={12} md={6} lg={4}>
              <NavLink
                to={link.path}
                className={`settings-card-link ${isActive ? "active" : ""}`}
              >
                <Card className="h-100 settings-card">
                  <Card.Body className="d-flex align-items-center">
                    <div className="settings-card-icon">
                      <Icon size={24} />
                    </div>
                    <div className="ms-3">
                      <Card.Title className="mb-1 text-muted-desc">
                        {link.label}
                      </Card.Title>
                      <Card.Text className="text-muted-desc small">
                        {link.description}
                      </Card.Text>
                    </div>
                  </Card.Body>
                </Card>
              </NavLink>
            </Col>
          );
        })}
      </Row>

      <div className="settings-content">
        <Outlet />
      </div>
    </Container>
  );
};

export default EpinsLayout;
