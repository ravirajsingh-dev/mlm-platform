import React, { useState, useEffect } from "react";
import { Form, Button, Row, Col } from "react-bootstrap";
import { UserStatuses } from "@src/constants/CustomSelectValues";

const UserFilters = (props) => {
  const { filterParams = {}, onFilterChange } = props;
  const [epId, setEpId] = useState(filterParams.epId || "");
  const [phone, setPhone] = useState(filterParams.phone || "");
  const [status, setStatus] = useState(filterParams.status || "");
  const [fromDate, setFromDate] = useState(filterParams.fromDate || "");
  const [toDate, setToDate] = useState(filterParams.toDate || "");
  const [filterToday, setFilterToday] = useState(false);

  useEffect(() => {
    if (filterToday) {
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      setFromDate(todayStr);
      setToDate(todayStr);
    }
  }, [filterToday]);

  const handleApplyFilters = () => {
    const filters = [];
    const query = {};

    // EP ID filter
    if (epId) {
      filters.push("EP_ID");
      query.EP_ID = { value: epId.trim(), type: "String" };
    }

    // Phone filter
    if (phone) {
      filters.push("phone");
      query.phone = { value: phone.trim(), type: "String" };
    }

    // Status filter
    if (status) {
      filters.push("status");
      query.status = { value: parseInt(status), type: "Number" };
    }

    // Date range filter
    if (fromDate || toDate) {
      filters.push("createdAt");
      const startDate = fromDate || new Date(0).toISOString().split("T")[0];
      const endDate = toDate || new Date().toISOString().split("T")[0];
      // Use "|" as separator to avoid conflict with date format dashes
      query.createdAt = { value: `${startDate}|${endDate}`, type: "Date" };
    }

    if (onFilterChange) {
      onFilterChange({
        filters,
        query,
        epId: epId || null,
        phone: phone || null,
        status: status || null,
        fromDate: fromDate || null,
        toDate: toDate || null,
      });
    }
  };

  const handleResetFilters = () => {
    setEpId("");
    setPhone("");
    setStatus("");
    setFromDate("");
    setToDate("");
    setFilterToday(false);
    if (onFilterChange) {
      onFilterChange({
        filters: [],
        query: {},
        epId: null,
        phone: null,
        status: null,
        fromDate: null,
        toDate: null,
      });
    }
  };

  const handleTodayFilter = (e) => {
    const checked = e.target.checked;
    setFilterToday(checked);
    if (!checked) {
      setFromDate("");
      setToDate("");
    }
  };

  return (
    <div className="mb-3">
      <Row className="row-gap-2">
        <Col xs={12} sm={6} md={3} lg={2}>
          <Form.Group>
            <Form.Label>EP ID</Form.Label>
            <Form.Control
              type="text"
              value={epId}
              onChange={(e) => setEpId(e.target.value)}
              placeholder="Enter EP ID"
            />
          </Form.Group>
        </Col>

        <Col xs={12} sm={6} md={3} lg={2}>
          <Form.Group>
            <Form.Label>Phone</Form.Label>
            <Form.Control
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter Phone"
            />
          </Form.Group>
        </Col>

        <Col xs={12} sm={6} md={3} lg={2}>
          <Form.Group>
            <Form.Label>Status</Form.Label>
            <Form.Control
              as="select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All</option>
              {UserStatuses.map((statusOption) => (
                <option key={statusOption.value} value={statusOption.value}>
                  {statusOption.label}
                </option>
              ))}
            </Form.Control>
          </Form.Group>
        </Col>

        <Col xs={12} sm={6} md={3} lg={2}>
          <Form.Group>
            <Form.Label>From Date</Form.Label>
            <Form.Control
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              disabled={filterToday}
            />
          </Form.Group>
        </Col>

        <Col xs={12} sm={6} md={3} lg={2}>
          <Form.Group>
            <Form.Label>To Date</Form.Label>
            <Form.Control
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              disabled={filterToday}
            />
          </Form.Group>
        </Col>

        <Col xs={12} sm={6} md={3} lg={2}>
          <Form.Group className="d-flex align-items-end h-100">
            <Form.Check
              type="checkbox"
              label="Today"
              checked={filterToday}
              onChange={handleTodayFilter}
              className="pt-3"
            />
          </Form.Group>
        </Col>

        <Col
          xs={12}
          sm={6}
          md={3}
          lg={2}
          className="d-flex align-items-end gap-2"
        >
          <Button variant="primary" onClick={handleApplyFilters}>
            Filter
          </Button>
          <Button variant="outline-secondary" onClick={handleResetFilters}>
            Reset
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default UserFilters;
