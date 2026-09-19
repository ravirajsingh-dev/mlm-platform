import React from "react";
import { Card, Row, Col, Container } from "react-bootstrap";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  FaHourglassHalf,
  FaPaperPlane,
  FaLink,
  FaChartLine,
} from "react-icons/fa";

const HelplinksLayout = () => {
  const location = useLocation();

  const helpLinks = [
    // {
    //   path: "/user/help-links/pending-links",
    //   label: "Downline Pending Links",
    //   icon: FaHourglassHalf,
    //   description: "Review pending Links",
    // },
    {
      path: "/user/help-links/send-payments",
      label: "Send Links",
      icon: FaPaperPlane,
      description:
        "Send assistance to others to upgrade your level and unlock tier benefits",
    },
    {
      path: "/user/help-links/receive-payments",
      label: "Receive Links",
      icon: FaLink,
      description:
        "Accept financial support from your network to grow your earning potential",
    },
    {
      path: "/user/upgrade",
      label: "Upgrade Details",
      icon: FaChartLine,
      description:
        "View complete level-wise upgrade details, including earning milestones and helpful links to guide your growth journey.",
    },
  ];

  return (
    <Container className="settings-layout">
      <div className="card-heading-unique">
        <div className="heading-underline">EP Links !</div>
      </div>
      <Row className="g-4 mb-5">
        {helpLinks.map((link) => {
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

export default HelplinksLayout;
