import React, { useState, useEffect } from "react";
import { Row, Col, Container, Badge, Button, Form } from "react-bootstrap";
import { Link } from "react-router-dom";
import { PropTypes } from "prop-types";
import { connect } from "react-redux";
import { VscEye } from "react-icons/vsc";
import moment from "moment";

import PiDataTable from "@src/view/commonComponents/dataTable/PiDataTable";
import AppBreadCrumb from "@src/view/commonComponents/dataTable/AppBreadCrumb";
import MainCard from "@src/view/commonComponents/mainCard/MainCard";
import VerificationConfirmModal from "@src/view/admin/modals/VerificationConfirmModal";

import {
  getDonationRequests,
  approveDonationRequest,
  rejectDonationRequest,
} from "@src/actions/adminDonationActions";
import { formatIndianNumber } from "@src/utils/helper";

const DonationRequestsList = ({
  loggedInAdmin,
  donationRequests,
  getDonationRequests,
  approveDonationRequest,
  rejectDonationRequest,
  loadingDonationRequests,
  loadingOnDonationRequestAction,
}) => {
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [filters, setFilters] = useState({
    status: "",
    phone: "",
    email: "",
    fromDate: "",
    toDate: "",
  });
  const [params, setParams] = useState({
    page: 1,
    limit: 20,
    status: "",
    phone: "",
    email: "",
    fromDate: "",
    toDate: "",
  });

  useEffect(() => {
    getDonationRequests(params);
  }, [getDonationRequests, params]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setParams((prev) => ({
      ...prev,
      [field]: value,
      page: 1, // Reset to first page on filter change
    }));
  };

  const handleApproveClick = (request) => {
    setSelectedRequest(request);
    setShowApproveModal(true);
  };

  const handleRejectClick = (request) => {
    setSelectedRequest(request);
    setShowRejectModal(true);
  };

  const handleConfirmApprove = async () => {
    await approveDonationRequest(selectedRequest._id);
    setShowApproveModal(false);
    setSelectedRequest(null);
    // Refresh the list with current filters
    getDonationRequests(params);
  };

  const handleConfirmReject = async () => {
    await rejectDonationRequest(selectedRequest._id);
    setShowRejectModal(false);
    setSelectedRequest(null);
    // Refresh the list with current filters
    getDonationRequests(params);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: "warning", text: "Pending" },
      approved: { bg: "success", text: "Approved" },
      rejected: { bg: "danger", text: "Rejected" },
    };
    const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;
    return <Badge bg={config.bg}>{config.text}</Badge>;
  };

  const columns = [
    {
      name: "Donor Name",
      selector: (row) => row.donorName || "N/A",
      sortable: false,
      width: "150px",
      wrap: true,
    },
    {
      name: "Phone",
      selector: (row) => row.phone || "N/A",
      sortable: false,
      width: "120px",
      wrap: true,
    },
    {
      name: "Email",
      selector: (row) => row.email || "N/A",
      sortable: false,
      width: "200px",
      wrap: true,
    },
    {
      name: "Amount",
      cell: (row) => `₹${formatIndianNumber(row.amount) || 0}`,
      sortable: false,
      width: "100px",
      wrap: true,
    },
    {
      name: "Mode",
      selector: (row) => (
        <Badge bg={row.paymentMode === "UPI" ? "info" : "secondary"}>
          {row.paymentMode || "N/A"}
        </Badge>
      ),
      sortable: false,
      width: "120px",
      wrap: true,
    },
    {
      name: "UTR Number",
      selector: (row) => row.utrNumber || "N/A",
      sortable: false,
      width: "200px",
      wrap: true,
    },
    {
      name: "Status",
      cell: (row) => getStatusBadge(row.status),
      sortable: false,
      width: "100px",
      wrap: true,
    },
    {
      name: "Created At",
      cell: (row) =>
        row.createdAt
          ? moment(row.createdAt).format("DD/MM/YYYY, hh:mm a")
          : "N/A",
      sortable: false,
      width: "170px",
      wrap: true,
    },
    {
      name: "Actions",
      width: "200px",
      cell: (row) => (
        <div className="d-flex gap-2">
          {row.status === "pending" && (
            <>
              <Button
                variant="success"
                size="sm"
                onClick={() => handleApproveClick(row)}
                disabled={loadingOnDonationRequestAction}
              >
                Approve
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleRejectClick(row)}
                disabled={loadingOnDonationRequestAction}
              >
                Reject
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  const data = donationRequests?.data || [];
  const pagination = donationRequests?.pagination || {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  };

  const handlePageChange = (page) => {
    setParams((prev) => ({ ...prev, page }));
  };

  const handleLimitChange = (limit) => {
    setParams((prev) => ({ ...prev, limit, page: 1 }));
  };

  return (
    <Container>
      <AppBreadCrumb
        pageTitle="Donation Requests"
        crumbs={[{ name: "Donations" }]}
      />

      <MainCard>
        {/* Filters */}
        <div className="table-filter-section mb-3">
          <Row>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                >
                  <option value="">All</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Phone</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search by phone"
                  value={filters.phone}
                  onChange={(e) => handleFilterChange("phone", e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Search by email"
                  value={filters.email}
                  onChange={(e) => handleFilterChange("email", e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>From Date</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) =>
                    handleFilterChange("fromDate", e.target.value)
                  }
                />
              </Form.Group>
            </Col>
            <Col md={3} className="mt-3">
              <Form.Group>
                <Form.Label>To Date</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => handleFilterChange("toDate", e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
        </div>

        <PiDataTable
          columns={columns}
          data={data}
          count={pagination.total}
          params={{
            page: pagination.page,
            limit: pagination.limit,
          }}
          setParams={(newParams) => {
            if (newParams.page !== undefined) handlePageChange(newParams.page);
            if (newParams.limit !== undefined)
              handleLimitChange(newParams.limit);
          }}
          pagination
          responsive
          striped={true}
          progressPending={loadingDonationRequests}
          highlightOnHover
          persistTableHead={true}
          paginationServer
        />
      </MainCard>

      {/* Approve Confirmation Modal */}
      <VerificationConfirmModal
        show={showApproveModal}
        handleClose={() => {
          setShowApproveModal(false);
          setSelectedRequest(null);
        }}
        handleConfirm={handleConfirmApprove}
        title="Approve Donation Request"
        body={`Are you sure you want to approve the donation request from ${selectedRequest?.donorName} for ₹${selectedRequest?.amount}?`}
        submitBtnText="Approve"
        isLoading={loadingOnDonationRequestAction}
      />

      {/* Reject Confirmation Modal */}
      <VerificationConfirmModal
        show={showRejectModal}
        handleClose={() => {
          setShowRejectModal(false);
          setSelectedRequest(null);
        }}
        handleConfirm={handleConfirmReject}
        title="Reject Donation Request"
        body={`Are you sure you want to reject the donation request from ${selectedRequest?.donorName} for ₹${selectedRequest?.amount}?`}
        submitBtnText="Reject"
        isLoading={loadingOnDonationRequestAction}
      />
    </Container>
  );
};

DonationRequestsList.propTypes = {
  getDonationRequests: PropTypes.func.isRequired,
  approveDonationRequest: PropTypes.func.isRequired,
  rejectDonationRequest: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  donationRequests: state.adminDonation.donationRequests,
  loadingDonationRequests: state.adminDonation.loadingDonationRequests,
  loadingOnDonationRequestAction:
    state.adminDonation.loadingOnDonationRequestAction,
  loggedInAdmin: state.adminAuth.admin,
});

export default connect(mapStateToProps, {
  getDonationRequests,
  approveDonationRequest,
  rejectDonationRequest,
})(DonationRequestsList);
