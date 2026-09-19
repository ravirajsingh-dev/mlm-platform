import React, { useState } from "react";
import { Form, Button, Container, Row, Col } from "react-bootstrap";

const DepositRequestFilters = (props) => {
  const { onSearch } = props;
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusType, setEarningType] = useState("");
  const [searchType, setSearchType] = useState("");
  const [searchValue, setSearchValue] = useState("");

  const handleFilterClick = () => {
    props.onSearch(fromDate, toDate, statusType, searchType, searchValue);
  };

  return (
    <Container className="filter-row">
      <Form>
        <Row className="row-gap-2 pb-3">
          <Col xs={12} sm={6} lg={3}>
            <Form.Group>
              <Form.Label>Status Type</Form.Label>
              <Form.Control
                as="select"
                value={statusType}
                onChange={(e) => setEarningType(e.target.value)}
              >
                <option value="">All</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="pending">Pending</option>
              </Form.Control>
            </Form.Group>
          </Col>

          <Col xs={12} sm={6} lg={3}>
            <Form.Group>
              <Form.Label>Search Type</Form.Label>
              <Form.Control
                as="select"
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
              >
                <option value="">Select</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="myReferCode">Referral Code</option>
              </Form.Control>
            </Form.Group>
          </Col>

          <Col xs={12} sm={6} lg={3}>
            <Form.Group>
              <Form.Label>Search Value</Form.Label>
              <Form.Control
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </Form.Group>
          </Col>

          <Col xs={12} sm={6} lg={3}>
            <Form.Group>
              <Form.Label>From Date</Form.Label>
              <Form.Control
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col xs={12} sm={6} lg={3}>
            <Form.Group>
              <Form.Label>To Date</Form.Label>
              <Form.Control
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col xs={12} sm={6} lg={3} className="d-flex align-items-end">
            <Button variant="outline-primary" onClick={handleFilterClick}>
              Filter
            </Button>
          </Col>
        </Row>
      </Form>
    </Container>
  );
};

export default DepositRequestFilters;
