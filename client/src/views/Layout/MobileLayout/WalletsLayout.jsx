import React from "react";
import { Card, Row, Col, Container } from "react-bootstrap";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { FaExchangeAlt, FaHistory, FaMoneyBillAlt } from "react-icons/fa";

const WalletsLayout = () => {
  const location = useLocation();

  const walletLinks = [
    {
      path: "/user/wallet-transfer",
      label: "Transfer E-Cash",
      icon: FaExchangeAlt,
      description: "Send E-Cash to other users E-Cash wallets",
    },
    {
      path: "/user/withdrawal-layout",
      label: "Withdrawal",
      icon: FaMoneyBillAlt,
      description: "Withdraw your E-Cash to your bank account",
    },
    {
      path: "/user/wallet",
      label: "Wallet History",
      icon: FaHistory,
      description: "View transaction history and track all wallet activities",
    },
  ];

  return (
    <Container className="settings-layout">
      <div className="card-heading-unique">
        <div className="heading-underline">Wallet !</div>
      </div>
      <Row className="g-4 mb-5">
        {walletLinks.map((link) => {
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

export default WalletsLayout;
