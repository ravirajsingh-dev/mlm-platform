import React from "react";
import { Container, Row, Col } from "react-bootstrap";

const About = () => {
  return (
    <section className="about-editorial">
      <Container>
        {/* HEADER */}
        <div className="about-editorial__header">
          <span className="about-editorial__tag">ABOUT EKPAHAL</span>

          <h2 className="about-editorial__title">
            Our Mission & Vision
            <br />
            <span>to End Hunger</span>
          </h2>

          <p className="about-editorial__intro">
            EKPAHAL works to eliminate hunger and food waste by creating a
            meaningful connection between donors and communities in need. Every
            shared meal restores dignity, hope, and humanity.
          </p>
        </div>

        {/* MISSION + VISION (ALWAYS ONE ROW) */}
        <Row className="about-editorial__row">
          <Col xs={6}>
            <div className="about-editorial__block">
              <h3>Our Mission</h3>
              <p>
                To eliminate hunger by connecting food donors with homeless
                individuals and families, ensuring that no meal is wasted and
                everyone has access to nutritious food with dignity and respect.
              </p>
            </div>
          </Col>

          <Col xs={6}>
            <div className="about-editorial__block about-editorial__block--right">
              <h3>Our Vision</h3>
              <p>
                To create a world where hunger no longer exists, through a
                trusted network of compassionate donors and volunteers who make
                food donation simple, impactful, and human.
              </p>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default About;
