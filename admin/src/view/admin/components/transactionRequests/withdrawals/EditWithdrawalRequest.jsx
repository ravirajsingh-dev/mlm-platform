import React, { useState } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Form, Container, Row, Col, Modal, Badge, Alert } from "react-bootstrap";
import { validateForm } from "@src/utils/validation";
import Errors from "@src/notifications/Errors";

// custom imports
import {
  getWithdrawalRequestById,
  approveWithdrawalRequest,
  rejectWithdrawalRequest,
  removeWithdrawalRequestErrors,
} from "@src/actions/adminWithdrawalActions";
import MainCard from "@src/view/commonComponents/mainCard/MainCard";
import BouncingLoader from "@src/view/spinners/BouncingLoader";

const EditWithdrawalRequest = ({
  loadingWithdrawalRequest,
  currentWithdrawalRequest,
  getWithdrawalRequestById,
  approveWithdrawalRequest,
  rejectWithdrawalRequest,
  errorList,
}) => {
  const navigate = useNavigate();
  const { withdrawal_id } = useParams();

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approveFormData, setApproveFormData] = useState({
    utrNumber: "",
    adminRemark: "",
  });
  const [rejectFormData, setRejectFormData] = useState({
    adminRemark: "",
  });
  const [approveSubmitting, setApproveSubmitting] = useState(false);
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  React.useEffect(() => {
    if (withdrawal_id) {
      getWithdrawalRequestById(withdrawal_id);
    }
  }, [withdrawal_id, getWithdrawalRequestById]);

  const isPending =
    currentWithdrawalRequest &&
    currentWithdrawalRequest.status === "PENDING";

  const hasInsufficientBalance =
    isPending &&
    currentWithdrawalRequest &&
    (currentWithdrawalRequest.currentECashBalance || 0) <
      (currentWithdrawalRequest.amount || 0);

  const handleApproveClick = () => {
    setShowApproveModal(true);
    setApproveFormData({ utrNumber: "", adminRemark: "" });
  };

  const handleRejectClick = () => {
    setShowRejectModal(true);
    setRejectFormData({ adminRemark: "" });
  };

  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!approveFormData.utrNumber || approveFormData.utrNumber.trim().length < 3) {
      return;
    }
    if (!approveFormData.adminRemark || approveFormData.adminRemark.trim().length < 5) {
      return;
    }

    setApproveSubmitting(true);
    try {
      const result = await approveWithdrawalRequest(
        withdrawal_id,
        approveFormData,
        navigate
      );
      if (result && result.status) {
        setShowApproveModal(false);
        // Refresh request details
        await getWithdrawalRequestById(withdrawal_id);
      }
    } catch (error) {
      console.error("Error approving withdrawal:", error);
    } finally {
      setApproveSubmitting(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!rejectFormData.adminRemark || rejectFormData.adminRemark.trim().length < 5) {
      return;
    }

    setRejectSubmitting(true);
    try {
      const result = await rejectWithdrawalRequest(
        withdrawal_id,
        rejectFormData,
        navigate
      );
      if (result && result.status) {
        setShowRejectModal(false);
        // Refresh request details
        await getWithdrawalRequestById(withdrawal_id);
      }
    } catch (error) {
      console.error("Error rejecting withdrawal:", error);
    } finally {
      setRejectSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      PENDING: "warning",
      APPROVED: "success",
      REJECTED: "danger",
    };
    return <Badge bg={variants[status] || "secondary"}>{status}</Badge>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString();
  };

  return (
    <Container>
      {loadingWithdrawalRequest ? (
        <BouncingLoader />
      ) : !currentWithdrawalRequest || !currentWithdrawalRequest._id ? (
        <Alert variant="warning">Withdrawal request not found</Alert>
      ) : (
        <Row>
          <Col>
            <MainCard className="card-body">
              <Row className="card-heading mb-3">
                <Col>Withdrawal Request Information</Col>
              </Row>

              <Errors />

              <Form autoComplete="off">
                <Row>
                  <Col xs={12} md={6} lg={4}>
                    <Form.Group className="form-group mb-3">
                      <Form.Label>User</Form.Label>
                      <Form.Control
                        type="text"
                        value={
                          currentWithdrawalRequest.userId?.name ||
                          currentWithdrawalRequest.userId?.EP_ID ||
                          "N/A"
                        }
                        disabled
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={12} md={6} lg={4}>
                    <Form.Group className="form-group mb-3">
                      <Form.Label>Amount</Form.Label>
                      <Form.Control
                        type="text"
                        value={`₹${currentWithdrawalRequest.amount || 0}`}
                        disabled
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={12} md={6} lg={4}>
                    <Form.Group className="form-group mb-3">
                      <Form.Label>Surcharge</Form.Label>
                      <Form.Control
                        type="text"
                        value={`₹${currentWithdrawalRequest.surchargeAmount || 0}`}
                        disabled
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={12} md={6} lg={4}>
                    <Form.Group className="form-group mb-3">
                      <Form.Label>Net Payable</Form.Label>
                      <Form.Control
                        type="text"
                        value={`₹${currentWithdrawalRequest.netPayableAmount || 0}`}
                        disabled
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={12} md={6} lg={4}>
                    <Form.Group className="form-group mb-3">
                      <Form.Label>Current E-Cash Balance</Form.Label>
                      <Form.Control
                        type="text"
                        value={`₹${(currentWithdrawalRequest.currentECashBalance || 0).toFixed(2)}`}
                        disabled
                        className={
                          isPending &&
                          currentWithdrawalRequest.currentECashBalance <
                            currentWithdrawalRequest.amount
                            ? "text-danger fw-bold"
                            : ""
                        }
                      />
                      {isPending &&
                        currentWithdrawalRequest.currentECashBalance <
                          currentWithdrawalRequest.amount && (
                          <Form.Text className="text-danger">
                            Insufficient balance. Withdrawal amount exceeds
                            available E-Cash. Only rejection is allowed.
                          </Form.Text>
                        )}
                    </Form.Group>
                  </Col>
                  <Col xs={12} md={6} lg={4}>
                    <Form.Group className="form-group mb-3">
                      <Form.Label>UPI ID</Form.Label>
                      <Form.Control
                        type="text"
                        value={currentWithdrawalRequest.upiId || ""}
                        disabled
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={12} md={6} lg={4}>
                    <Form.Group className="form-group mb-3">
                      <Form.Label>UPI Holder Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={currentWithdrawalRequest.upiHolderName || ""}
                        disabled
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={12} md={6} lg={4}>
                    <Form.Group className="form-group mb-3">
                      <Form.Label>Status</Form.Label>
                      <div>
                        {getStatusBadge(currentWithdrawalRequest.status)}
                      </div>
                    </Form.Group>
                  </Col>
                  <Col xs={12} md={6} lg={4}>
                    <Form.Group className="form-group mb-3">
                      <Form.Label>Request Date</Form.Label>
                      <Form.Control
                        type="text"
                        value={formatDate(currentWithdrawalRequest.createdAt)}
                        disabled
                      />
                    </Form.Group>
                  </Col>
                  {currentWithdrawalRequest.utrNumber && (
                    <Col xs={12} md={6} lg={4}>
                      <Form.Group className="form-group mb-3">
                        <Form.Label>UTR Number</Form.Label>
                        <Form.Control
                          type="text"
                          value={currentWithdrawalRequest.utrNumber}
                          disabled
                        />
                      </Form.Group>
                    </Col>
                  )}
                  {currentWithdrawalRequest.adminRemark && (
                    <Col xs={12}>
                      <Form.Group className="form-group mb-3">
                        <Form.Label>Admin Remark</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={currentWithdrawalRequest.adminRemark}
                          disabled
                        />
                      </Form.Group>
                    </Col>
                  )}
                  {currentWithdrawalRequest.actionAt && (
                    <Col xs={12} md={6} lg={4}>
                      <Form.Group className="form-group mb-3">
                        <Form.Label>Action Date</Form.Label>
                        <Form.Control
                          type="text"
                          value={formatDate(currentWithdrawalRequest.actionAt)}
                          disabled
                        />
                      </Form.Group>
                    </Col>
                  )}
                  <Col xs={12} className="text-end">
                    {isPending && (
                      <>
                        <Button
                          variant="success"
                          onClick={handleApproveClick}
                          className="me-2"
                          disabled={hasInsufficientBalance}
                          title={
                            hasInsufficientBalance
                              ? "Cannot approve: Withdrawal amount exceeds current E-Cash balance"
                              : ""
                          }
                        >
                          Approve
                        </Button>
                        <Button variant="danger" onClick={handleRejectClick}>
                          Reject
                        </Button>
                      </>
                    )}
                    <Button
                      variant="secondary"
                      onClick={() => navigate("/admin/users/withdrawal-requests/list")}
                      className="ms-2"
                    >
                      Back to List
                    </Button>
                  </Col>
                </Row>
              </Form>
            </MainCard>
          </Col>
        </Row>
      )}

      {/* Approve Modal */}
      <Modal 
        show={showApproveModal} 
        onHide={() => {
          if (!approveSubmitting) {
            setShowApproveModal(false);
          }
        }}
        backdrop={approveSubmitting ? "static" : true}
      >
        <Modal.Header closeButton={!approveSubmitting}>
          <Modal.Title>Approve Withdrawal Request</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleApproveSubmit}>
          <Modal.Body>
            <Errors />
            <Form.Group className="mb-3">
              <Form.Label>
                UTR Number <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                value={approveFormData.utrNumber}
                onChange={(e) =>
                  setApproveFormData({
                    ...approveFormData,
                    utrNumber: e.target.value,
                  })
                }
                placeholder="Enter UTR Number"
                required
                minLength={3}
                disabled={approveSubmitting}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>
                Admin Remark <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={approveFormData.adminRemark}
                onChange={(e) =>
                  setApproveFormData({
                    ...approveFormData,
                    adminRemark: e.target.value,
                  })
                }
                placeholder="Enter admin remark (min 5 characters)"
                required
                minLength={5}
                disabled={approveSubmitting}
              />
            </Form.Group>
            <Alert variant="info">
              <strong>Amount:</strong> ₹{currentWithdrawalRequest?.amount || 0}
              <br />
              <strong>Net Payable:</strong> ₹
              {currentWithdrawalRequest?.netPayableAmount || 0}
              <br />
              <strong>Surcharge:</strong> ₹
              {currentWithdrawalRequest?.surchargeAmount || 0}
              <br />
              <strong>Current E-Cash Balance:</strong> ₹
              {(currentWithdrawalRequest?.currentECashBalance || 0).toFixed(2)}
              {hasInsufficientBalance && (
                <>
                  <br />
                  <span className="text-danger fw-bold">
                    ⚠ Insufficient Balance - Approval Disabled
                  </span>
                </>
              )}
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowApproveModal(false)}
              disabled={approveSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="success"
              type="submit"
              disabled={approveSubmitting || !approveFormData.utrNumber || !approveFormData.adminRemark || approveFormData.utrNumber.trim().length < 3 || approveFormData.adminRemark.trim().length < 5}
            >
              {approveSubmitting ? "Processing..." : "Approve"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Reject Modal */}
      <Modal 
        show={showRejectModal} 
        onHide={() => {
          if (!rejectSubmitting) {
            setShowRejectModal(false);
          }
        }}
        backdrop={rejectSubmitting ? "static" : true}
      >
        <Modal.Header closeButton={!rejectSubmitting}>
          <Modal.Title>Reject Withdrawal Request</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleRejectSubmit}>
          <Modal.Body>
            <Errors />
            <Form.Group className="mb-3">
              <Form.Label>
                Admin Remark <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={rejectFormData.adminRemark}
                onChange={(e) =>
                  setRejectFormData({
                    ...rejectFormData,
                    adminRemark: e.target.value,
                  })
                }
                placeholder="Enter reason for rejection (min 5 characters)"
                required
                minLength={5}
                disabled={rejectSubmitting}
              />
            </Form.Group>
            <Alert variant="warning">
              This action will reject the withdrawal request. The user's balance
              will not be debited.
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowRejectModal(false)}
              disabled={rejectSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              type="submit"
              disabled={rejectSubmitting || !rejectFormData.adminRemark || rejectFormData.adminRemark.trim().length < 5}
            >
              {rejectSubmitting ? "Processing..." : "Reject"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

EditWithdrawalRequest.propTypes = {
  loadingWithdrawalRequest: PropTypes.bool.isRequired,
  currentWithdrawalRequest: PropTypes.object,
  getWithdrawalRequestById: PropTypes.func.isRequired,
  approveWithdrawalRequest: PropTypes.func.isRequired,
  rejectWithdrawalRequest: PropTypes.func.isRequired,
  errorList: PropTypes.array,
};

const mapStateToProps = (state) => ({
  loadingWithdrawalRequest: state.adminWithdrawals.loadingWithdrawalRequest,
  currentWithdrawalRequest: state.adminWithdrawals.currentWithdrawalRequest,
  errorList: state.errors.errorsList,
});

export default connect(mapStateToProps, {
  removeWithdrawalRequestErrors,
  getWithdrawalRequestById,
  approveWithdrawalRequest,
  rejectWithdrawalRequest,
})(EditWithdrawalRequest);
