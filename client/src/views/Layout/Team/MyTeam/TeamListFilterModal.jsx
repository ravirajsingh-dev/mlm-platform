import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import PropTypes from "prop-types";
import moment from "moment";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { SEND_LEVEL_LIST } from "@src/constants/LevelsConstants";

const TeamListFilterModal = ({ show, onHide, onApply }) => {
  const [EP_ID, setEP_ID] = useState("");
  const [sponsorEP, setSponsorEP] = useState("");
  const [uplineEP, setUplineEP] = useState("");
  const [user_level, setUser_level] = useState("");
  const [status, setStatus] = useState("");
  const [has_entered_e_pool, setHas_entered_e_pool] = useState("");
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  // Reset all form fields when modal is closed
  useEffect(() => {
    if (!show) {
      setEP_ID("");
      setSponsorEP("");
      setUplineEP("");
      setUser_level("");
      setStatus("");
      setHas_entered_e_pool("");
      setFromDate(null);
      setToDate(null);
    }
  }, [show]);

  const handleApply = () => {
    const filterValues = {};
    
    if (EP_ID && EP_ID.trim()) {
      filterValues.EP_ID = EP_ID.trim();
    }
    if (sponsorEP && sponsorEP.trim()) {
      filterValues.sponsorEP = sponsorEP.trim();
    }
    if (uplineEP && uplineEP.trim()) {
      filterValues.uplineEP = uplineEP.trim();
    }
    if (user_level && user_level !== "") {
      filterValues.user_level = user_level;
    }
    if (status && status !== "") {
      filterValues.status = status;
    }
    if (has_entered_e_pool !== "") {
      filterValues.has_entered_e_pool = has_entered_e_pool;
    }
    if (fromDate) {
      // Format date as YYYY-MM-DD to avoid timezone shifts, then convert to UTC start of day
      filterValues.fromDate = moment(fromDate).format("YYYY-MM-DD");
    }
    if (toDate) {
      // Format date as YYYY-MM-DD to avoid timezone shifts, then convert to UTC end of day
      filterValues.toDate = moment(toDate).format("YYYY-MM-DD");
    }
    
    onApply(filterValues);
    onHide();
  };

  const handleReset = () => {
    setEP_ID("");
    setSponsorEP("");
    setUplineEP("");
    setUser_level("");
    setStatus("");
    setHas_entered_e_pool("");
    setFromDate(null);
    setToDate(null);
    onApply({});
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="maroon-color">Filter Team List</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="label-color">Status</Form.Label>
                <Form.Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="1">Active</option>
                  <option value="inactive">Inactive</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="label-color">Entered in E-Pool</Form.Label>
                <Form.Select
                  value={has_entered_e_pool}
                  onChange={(e) => setHas_entered_e_pool(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="label-color">EP ID</Form.Label>
                <Form.Control
                  type="text"
                  value={EP_ID}
                  onChange={(e) => setEP_ID(e.target.value)}
                  placeholder="Enter EP ID"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="label-color">Sponsor EP</Form.Label>
                <Form.Control
                  type="text"
                  value={sponsorEP}
                  onChange={(e) => setSponsorEP(e.target.value)}
                  placeholder="Enter Sponsor EP"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="label-color">Upline EP</Form.Label>
                <Form.Control
                  type="text"
                  value={uplineEP}
                  onChange={(e) => setUplineEP(e.target.value)}
                  placeholder="Enter Upline EP"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="label-color">Level</Form.Label>
                <Form.Select
                  value={user_level}
                  onChange={(e) => setUser_level(e.target.value)}
                >
                  <option value="">All</option>
                  {SEND_LEVEL_LIST.map((lvl) => (
                    <option key={lvl.value} value={lvl.value}>
                      {lvl.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="label-color">From Date</Form.Label>
                <DatePicker
                  selected={fromDate}
                  onChange={(date) => setFromDate(date)}
                  className="form-control"
                  placeholderText="Select from date"
                  dateFormat="yyyy-MM-dd"
                  maxDate={toDate || new Date()}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="label-color">To Date</Form.Label>
                <DatePicker
                  selected={toDate}
                  onChange={(date) => setToDate(date)}
                  className="form-control"
                  placeholderText="Select to date"
                  dateFormat="yyyy-MM-dd"
                  minDate={fromDate}
                  maxDate={new Date()}
                />
              </Form.Group>
            </Col>
          </Row>
        </Form>
      </Modal.Body>
      <Modal.Footer className="justify-content-center">
        <Button className="danger_btn" onClick={handleReset}>
          Reset
        </Button>
        <Button className="common_btn" onClick={handleApply}>
          Apply
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

TeamListFilterModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
};

export default TeamListFilterModal;
