import React from "react";
import { Card, Row, Col, Container } from "react-bootstrap";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { FaUsers, FaUserPlus, FaLayerGroup, FaSitemap } from "react-icons/fa";

const TeamsLayout = () => {
  const location = useLocation();

  const teamsLinks = [
    {
      path: "/user/all-team",
      label: "My Team",
      icon: FaUsers,
      description: "View your entire team structure and member details",
    },
    {
      path: "/user/direct-team",
      label: "Direct Team",
      icon: FaUserPlus,
      description: "Manage and analyze your direct referrals network",
    },
    {
      path: "/user/level-wise-team",
      label: "Level Wise Team",
      icon: FaLayerGroup,
      description:
        "Explore team distribution across different hierarchy levels",
    },
    {
      path: "/user/team-structure",
      label: "Team Structure",
      icon: FaSitemap,
      description: "Visualize your organizational hierarchy and relationships",
    },
  ];

  return (
    <Container className="settings-layout">
      <div className="card-heading-unique">
        <div className="heading-underline">Team Actions!</div>
      </div>
      <Row className="g-4 mb-5">
        {teamsLinks.map((link) => {
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

export default TeamsLayout;
