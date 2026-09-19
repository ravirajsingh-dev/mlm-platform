import React, { useState, useEffect } from "react";
import { Form, Button, Row, Col } from "react-bootstrap";

const InactiveUserFilters = (props) => {
  const { filterParams = {}, onFilterChange } = props;
  const [epId, setEpId] = useState(filterParams.epId || "");
  const [phone, setPhone] = useState(filterParams.phone || "");
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
    const filters = ["status"];
    const query = {
      status: { value: 2, type: "Number" },
    };

    if (epId) {
      filters.push("EP_ID");
      query.EP_ID = { value: epId.trim(), type: "String" };
    }

    if (phone) {
      filters.push("phone");
      query.phone = { value: phone.trim(), type: "String" };
    }

    if (fromDate || toDate) {
      filters.push("createdAt");
      const startDate = fromDate || new Date(0).toISOString().split("T")[0];
      const endDate = toDate || new Date().toISOString().split("T")[0];
      query.createdAt = { value: `${startDate}|${endDate}`, type: "Date" };
    }

    if (onFilterChange) {
      onFilterChange({
        filters,
        query,
        epId: epId || null,
        phone: phone || null,
        fromDate: fromDate || null,
        toDate: toDate || null,
      });
    }
  };

  const handleResetFilters = () => {
    setEpId("");
    setPhone("");
    setFromDate("");
    setToDate("");
    setFilterToday(false);
    if (onFilterChange) {
      onFilterChange({
        filters: ["status"],
        query: { status: { value: 2, type: "Number" } },
        epId: null,
        phone: null,
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

export default InactiveUserFilters;
