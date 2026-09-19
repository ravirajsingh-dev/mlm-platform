import React from "react";
import { Link } from "react-router-dom";
import Breadcrumb from "react-bootstrap/Breadcrumb";
import { connect } from "react-redux";
import { capitalizeFirst } from "@utils/helper";
import MainCard from "../mainCard/MainCard";
import { Row, Container, Col } from "react-bootstrap";

const AppBreadcrumb = ({ pageTitle, crumbs }) => {
  return (
    <Container>
      {/* <h4>{pageTitle}</h4> */}

      <Row className="bread-crumb">
        {crumbs ? (
          <Breadcrumb>
            <Breadcrumb.Item
              linkProps={{
                to: "/admin/dashboard",
              }}
              linkAs={Link}
            >
              Dashboard
            </Breadcrumb.Item>
            {crumbs.map((item, i) => (
              <React.Fragment key={i}>
                {item.path ? (
                  <Breadcrumb.Item linkProps={{ to: item.path }} linkAs={Link}>
                    {capitalizeFirst(item.name)}
                  </Breadcrumb.Item>
                ) : (
                  <Breadcrumb.Item active>
                    {capitalizeFirst(item.name)}
                  </Breadcrumb.Item>
                )}
              </React.Fragment>
            ))}
          </Breadcrumb>
        ) : undefined}
      </Row>
    </Container>
  );
};
const mapStateToProps = (state) => ({});

export default connect(mapStateToProps)(AppBreadcrumb);
