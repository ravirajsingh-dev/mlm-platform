import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Form, Container, Row, Col } from "react-bootstrap";

// custom imports
import {
  getDepositRequestById,
  approveDepositRequest,
  rejectDepositRequest,
  removeDepositRequestErrors,
} from "@src/actions/adminDepositActions";
import MainCard from "@src/view/commonComponents/mainCard/MainCard";
import BouncingLoader from "@src/view/spinners/BouncingLoader";

const EditDepositRequest = ({
  loadingDepositRequest,
  currentDepositRequest,
  getDepositRequestById,
  approveDepositRequest,
  rejectDepositRequest,
}) => {
  const navigate = useNavigate();
  const { deposit_id } = useParams();

  const [formData, setFormData] = React.useState({});
  const [approveSubmitting, setApproveSubmitting] = React.useState(false);
  const [rejectSubmitting, setRejectSubmitting] = React.useState(false);
  const [isDisable, setIsDisable] = React.useState(null);

  React.useEffect(() => {
    if (deposit_id) {
      getDepositRequestById(deposit_id);
    }
  }, [deposit_id]);

  React.useEffect(() => {
    if (currentDepositRequest) {
      setFormData(currentDepositRequest);

      const isPending =
        currentDepositRequest &&
        currentDepositRequest.status &&
        currentDepositRequest.status === "pending";

      setIsDisable(isPending);
    }
  }, [currentDepositRequest]);

  React.useEffect(() => {
    console.log("formData--------", formData);
  }, [formData]);

  const handleApprove = () => {
    const updatedData = { ...formData, status: "approved" };
    setApproveSubmitting(true);
    approveDepositRequest(deposit_id, navigate).then(() => {
      setApproveSubmitting(false);
    });
  };

  const handleReject = () => {
    const updatedData = { ...formData, status: "rejected" };
    setRejectSubmitting(true);
    rejectDepositRequest(deposit_id, navigate).then(() => {
      setRejectSubmitting(false);
    });
  };

  return (
    <Container>
      {loadingDepositRequest ? (
        <BouncingLoader />
      ) : (
        <Row>
          <Col>
            <MainCard className="card-body">
              <Row className="card-heading mb-3">
                <Col>Deposit Request Information</Col>
              </Row>

              <Form autoComplete="off">
                <Row>
                  <Col xs={12} md={6} lg={4}>
                    <Form.Group className="form-group mb-3">
                      <Form.Label>User ID</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.userId || ""}
                        disabled
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={12} md={6} lg={4}>
                    <Form.Group className="form-group mb-3">
                      <Form.Label>Method</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.method || ""}
                        disabled
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={12} md={6} lg={4}>
                    <Form.Group className="form-group mb-3">
                      <Form.Label>Amount</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.amount || ""}
                        disabled
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={12} md={6} lg={4}>
                    <Form.Group className="form-group mb-3">
                      <Form.Label>Status</Form.Label>
                      <Form.Control
                        type="text"
                        disabled
                        value={formData.status || ""}
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={12} className="text-end">
                    {isDisable && (
                      <Col className="mb-3">
                        <Button variant="primary" onClick={handleApprove}>
                          {approveSubmitting ? "Submitting..." : "Approve"}
                        </Button>
                        <Button
                          variant="danger"
                          onClick={handleReject}
                          className="ms-2 me-2"
                        >
                          {rejectSubmitting ? "Submitting..." : "Reject"}
                        </Button>
                      </Col>
                    )}
                  </Col>
                </Row>
              </Form>
            </MainCard>
          </Col>
        </Row>
      )}
    </Container>
  );
};

EditDepositRequest.propTypes = {
  loadingDepositRequest: PropTypes.bool.isRequired,
  getDepositRequestById: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  loadingDepositRequest: state.adminDeposits.loadingDepositRequest,
  currentDepositRequest: state.adminDeposits.currentDepositRequest,
});

export default connect(mapStateToProps, {
  removeDepositRequestErrors,
  getDepositRequestById,
  approveDepositRequest,
  rejectDepositRequest,
})(EditDepositRequest);
