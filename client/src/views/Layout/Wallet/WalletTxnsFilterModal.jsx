import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import PropTypes from "prop-types";
import moment from "moment";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  getWalletTypeOptions,
  getTransactionTypeOptions,
  normalizeWalletType,
  normalizeTransactionType,
} from "@src/utils/walletFilterConstants";

const WalletTxnsFilterModal = ({
  show,
  onHide,
  onApply,
  initialFilters = {},
}) => {
  const [type, setType] = useState("");
  const [walletType, setWalletType] = useState("");
  const [amountRange, setAmountRange] = useState({ min: "", max: "" });
  const [description, setDescription] = useState("");
  const [dateRange, setDateRange] = useState({ start: null, end: null });

  useEffect(() => {
    if (show) {
      setType(initialFilters.type || "");
      setWalletType(initialFilters.walletType || "");
      setAmountRange({
        min:
          initialFilters.min !== undefined && initialFilters.min !== null
            ? String(initialFilters.min)
            : "",
        max:
          initialFilters.max !== undefined && initialFilters.max !== null
            ? String(initialFilters.max)
            : "",
      });
      setDescription(initialFilters.description || "");

      // Parse date strings (YYYY-MM-DD or ISO) to Date objects for DatePicker
      let startDate = null;
      let endDate = null;
      if (initialFilters.startDate) {
        // Try parsing as YYYY-MM-DD first, then ISO string
        const parsed = moment(initialFilters.startDate, [
          "YYYY-MM-DD",
          moment.ISO_8601,
        ]).toDate();
        if (moment(parsed).isValid()) {
          startDate = parsed;
        }
      }
      if (initialFilters.endDate) {
        // Try parsing as YYYY-MM-DD first, then ISO string
        const parsed = moment(initialFilters.endDate, [
          "YYYY-MM-DD",
          moment.ISO_8601,
        ]).toDate();
        if (moment(parsed).isValid()) {
          endDate = parsed;
        }
      }
      setDateRange({ start: startDate, end: endDate });
    }
  }, [show, initialFilters]);

  // Reset all form fields when modal is closed
  useEffect(() => {
    if (!show) {
      setType("");
      setWalletType("");
      setAmountRange({ min: "", max: "" });
      setDescription("");
      setDateRange({ start: null, end: null });
    }
  }, [show]);

  const handleApply = () => {
    const filterValues = {};

    // Validate and normalize type filter
    if (type && type !== "") {
      const normalizedType = normalizeTransactionType(type);
      if (normalizedType) {
        filterValues.type = normalizedType;
      }
    }

    // Validate and normalize walletType filter
    if (walletType && walletType !== "") {
      const normalizedWalletType = normalizeWalletType(walletType);
      if (normalizedWalletType) {
        filterValues.walletType = normalizedWalletType;
      }
    }

    // Amount range filters - validate numeric values
    if (amountRange.min && amountRange.min.trim()) {
      const minValue = parseFloat(amountRange.min.trim());
      if (!isNaN(minValue) && minValue >= 0) {
        filterValues.min = minValue;
      }
    }
    if (amountRange.max && amountRange.max.trim()) {
      const maxValue = parseFloat(amountRange.max.trim());
      if (!isNaN(maxValue) && maxValue >= 0) {
        filterValues.max = maxValue;
      }
    }

    // Description filter - case-insensitive partial match
    if (description && description.trim()) {
      filterValues.description = description.trim();
    }

    // Date range filters - format as YYYY-MM-DD for timezone-safe full-day filtering
    if (dateRange.start) {
      const startDateFormatted = moment(dateRange.start).format("YYYY-MM-DD");
      if (moment(startDateFormatted, "YYYY-MM-DD").isValid()) {
        filterValues.startDate = startDateFormatted;
      }
    }
    if (dateRange.end) {
      const endDateFormatted = moment(dateRange.end).format("YYYY-MM-DD");
      if (moment(endDateFormatted, "YYYY-MM-DD").isValid()) {
        filterValues.endDate = endDateFormatted;
      }
    }

    onApply(filterValues);
    onHide();
  };

  const handleReset = () => {
    setType("");
    setWalletType("");
    setAmountRange({ min: "", max: "" });
    setDescription("");
    setDateRange({ start: null, end: null });
    onApply({});
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="maroon-color">Filter Transactions</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="label-color">Type</Form.Label>
                <Form.Select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="">All</option>
                  {getTransactionTypeOptions().map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="label-color">Wallet Type</Form.Label>
                <Form.Select
                  value={walletType}
                  onChange={(e) => setWalletType(e.target.value)}
                >
                  <option value="">All</option>
                  {getWalletTypeOptions().map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="label-color">Min Amount</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  step="0.01"
                  value={amountRange.min}
                  onChange={(e) =>
                    setAmountRange((prev) => ({ ...prev, min: e.target.value }))
                  }
                  placeholder="Minimum amount"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="label-color">Max Amount</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  step="0.01"
                  value={amountRange.max}
                  onChange={(e) =>
                    setAmountRange((prev) => ({ ...prev, max: e.target.value }))
                  }
                  placeholder="Maximum amount"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label className="label-color">Description</Form.Label>
                <Form.Control
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Search in description"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mt-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="label-color">Start Date</Form.Label>
                <DatePicker
                  selected={dateRange.start}
                  onChange={(date) =>
                    setDateRange((prev) => ({ ...prev, start: date }))
                  }
                  className="form-control"
                  placeholderText="Select start date"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="label-color">End Date</Form.Label>
                <DatePicker
                  selected={dateRange.end}
                  onChange={(date) =>
                    setDateRange((prev) => ({ ...prev, end: date }))
                  }
                  className="form-control"
                  placeholderText="Select end date"
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

WalletTxnsFilterModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
};

export default WalletTxnsFilterModal;
