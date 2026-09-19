import React, { useState } from "react";
import { Form, Button, Container, Row, Col } from "react-bootstrap";

const WithdrawalRequestFilters = (props) => {
  const { onSearch } = props;
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusType, setEarningType] = useState("");
  const [epIdFilter, setEpIdFilter] = useState("");

  const handleFilterClick = () => {
    props.onSearch(fromDate, toDate, statusType, epIdFilter);
  };

  const handleEPIdChange = (e) => {
    const value = e.target.value;
    setEpIdFilter(value);
    if (props.onFilterChange) {
      props.onFilterChange({
        epId: value || null,
      });
    }
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
                onChange={(e) => {
                  setEarningType(e.target.value);
                  if (props.onFilterChange) {
                    props.onFilterChange({
                      filters: e.target.value
                        ? [{ field: "status", value: e.target.value.toUpperCase() }]
                        : [],
                    });
                  }
                }}
              >
                <option value="">All</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </Form.Control>
            </Form.Group>
          </Col>

          <Col xs={12} sm={6} lg={3}>
            <Form.Group>
              <Form.Label>EP ID</Form.Label>
              <Form.Control
                type="text"
                value={epIdFilter}
                onChange={handleEPIdChange}
                placeholder="Enter EP ID"
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

export default WithdrawalRequestFilters;
