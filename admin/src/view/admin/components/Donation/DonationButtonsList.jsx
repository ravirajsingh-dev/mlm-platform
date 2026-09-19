import React, { useState, useEffect } from "react";
import { Button, Row, Col, Container, Badge, Modal, Form } from "react-bootstrap";
import { PropTypes } from "prop-types";
import { connect } from "react-redux";
import { VscEdit } from "react-icons/vsc";
import { RiDeleteBin5Line } from "react-icons/ri";

import PiDataTable from "@src/view/commonComponents/dataTable/PiDataTable";
import AppBreadCrumb from "@src/view/commonComponents/dataTable/AppBreadCrumb";
import MainCard from "@src/view/commonComponents/mainCard/MainCard";
import Errors from "@src/notifications/Errors";
import VerificationConfirmModal from "@src/view/admin/modals/VerificationConfirmModal";
import SetTxnPasswordModal from "@src/view/admin/modals/SetTxnPasswordModal";

import {
  getDonationButtons,
  createDonationButton,
  updateDonationButton,
  deleteDonationButton,
} from "@src/actions/adminDonationActions";
import { setErrorsList } from "@src/actions/errors";
import { removeErrors } from "@src/reducers/errors";
import { validateForm } from "@src/utils/validation";

const DonationButtonsList = ({
  loggedInAdmin,
  donationButtons,
  getDonationButtons,
  createDonationButton,
  updateDonationButton,
  deleteDonationButton,
  loadingDonationButtons,
  loadingOnDonationButtonSubmit,
  setErrorsList,
  errorList,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTxnPasswordModal, setShowTxnPasswordModal] = useState(false);
  const [selectedButton, setSelectedButton] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const initialFormData = {
    amount: "",
    peopleFed: "",
    type: "FIXED",
    buttonText: "Donate Any Other Amount",
    isActive: true,
  };

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    getDonationButtons();
  }, [getDonationButtons]);

  const columns = [
    {
      name: "Amount",
      selector: (row) => row.type === "ANY" ? "Any Amount" : `₹${row.amount}`,
      sortable: true,
      width: "120px",
      wrap: true,
    },
    {
      name: "People Fed",
      selector: (row) => row.type === "ANY" ? "-" : `${row.peopleFed} people`,
      sortable: true,
      width: "150px",
      wrap: true,
    },
    {
      name: "Type",
      selector: (row) => (
        <Badge bg={row.type === "FIXED" ? "primary" : "info"}>
          {row.type}
        </Badge>
      ),
      sortable: true,
      width: "100px",
      wrap: true,
    },
    {
      name: "Status",
      selector: (row) => (
        <Badge bg={row.isActive ? "success" : "secondary"}>
          {row.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
      sortable: true,
      width: "100px",
      wrap: true,
    },
    {
      name: "Actions",
      width: "120px",
      cell: (row) => (
        <div className="d-flex gap-2">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => handleEditClick(row)}
            title="Edit"
          >
            <VscEdit size={16} />
          </Button>
          <Button
            variant="outline-danger"
            size="sm"
            onClick={() => handleDeleteClick(row)}
            title="Delete"
          >
            <RiDeleteBin5Line size={16} />
          </Button>
        </div>
      ),
    },
  ];

  const handleCreateClick = () => {
    setFormData(initialFormData);
    setIsEditMode(false);
    setSelectedButton(null);
    // Clear errors
    setErrorsList("", "amount");
    setErrorsList("", "peopleFed");
    setErrorsList("", "type");
    setErrorsList("", "buttonText");
    setShowModal(true);
  };

  const handleEditClick = (button) => {
    setFormData({
      amount: button.amount || 0,
      peopleFed: button.peopleFed || 0,
      type: button.type,
      buttonText: button.buttonText || "Donate Any Other Amount",
      isActive: button.isActive,
    });
    setSelectedButton(button);
    setIsEditMode(true);
    // Clear errors
    setErrorsList("", "amount");
    setErrorsList("", "peopleFed");
    setErrorsList("", "type");
    setErrorsList("", "buttonText");
    setShowModal(true);
  };

  const handleDeleteClick = (button) => {
    setSelectedButton(button);
    setShowDeleteModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData(initialFormData);
    setSelectedButton(null);
    setIsEditMode(false);
    // Clear errors
    setErrorsList("", "amount");
    setErrorsList("", "peopleFed");
    setErrorsList("", "type");
  };

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
    
    // Clear errors when type changes
    if (name === "type") {
      setErrorsList("", "amount");
      setErrorsList("", "peopleFed");
      setErrorsList("", "type");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Clear previous errors
    setErrorsList("", "amount");
    setErrorsList("", "peopleFed");
    setErrorsList("", "type");

    const validationRules = [
      { path: "type", msg: "Type is required." },
    ];

    // Only validate amount and peopleFed for FIXED type
    if (formData.type === "FIXED") {
      validationRules.push(
        { path: "amount", msg: "Amount is required.", type: "number" },
        { path: "peopleFed", msg: "People fed count is required.", type: "number" }
      );
    }

    const errors = validateForm(formData, validationRules);
    if (errors.length) {
      errors.forEach((error) => {
        setErrorsList(error.msg, error.path);
      });
      return;
    }

    const submitData = {
      type: formData.type,
      isActive: formData.isActive,
    };

    if (formData.type === "FIXED") {
      const amount = parseFloat(formData.amount);
      const peopleFed = parseInt(formData.peopleFed, 10);

      if (isNaN(amount) || amount <= 0) {
        setErrorsList("Amount must be greater than 0", "amount");
        return;
      }

      if (isNaN(peopleFed) || peopleFed < 0) {
        setErrorsList("People fed must be a non-negative integer", "peopleFed");
        return;
      }

      submitData.amount = amount;
      submitData.peopleFed = peopleFed;
    } else {
      // For ANY type, include buttonText
      if (!formData.buttonText || !formData.buttonText.trim()) {
        setErrorsList("Button text is required for ANY type", "buttonText");
        return;
      }
      submitData.buttonText = formData.buttonText.trim();
    }

    if (isEditMode) {
      await updateDonationButton(selectedButton._id, submitData);
    } else {
      await createDonationButton(submitData);
    }

    handleCloseModal();
  };

  const handleConfirmDelete = async () => {
    await deleteDonationButton(selectedButton._id);
    setShowDeleteModal(false);
    setSelectedButton(null);
  };

  return (
    <Container>
      <AppBreadCrumb
        pageTitle="Donation Buttons"
        crumbs={[{ name: "Donations" }]}
      />

      <MainCard>
        <div className="table-filter-section mb-3">
          <Row className="d-flex justify-content-between">
            <Col md="4">
              <Button
                type="button"
                variant="primary"
                onClick={handleCreateClick}
              >
                Create Donation Button
              </Button>
            </Col>
          </Row>
        </div>

        <PiDataTable
          columns={columns}
          data={donationButtons || []}
          count={donationButtons?.length || 0}
          params={{ page: 1, limit: 100 }}
          setParams={() => {}}
          pagination={false}
          responsive
          striped={true}
          progressPending={loadingDonationButtons}
          highlightOnHover
          persistTableHead={true}
        />
      </MainCard>

      {/* Create/Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="md" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {isEditMode ? "Edit Donation Button" : "Create Donation Button"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>
                Type <span className="text-danger">*</span>
              </Form.Label>
              <Form.Select
                name="type"
                value={formData.type}
                onChange={onChange}
                required
                className={errorList.type ? "invalid" : ""}
              >
                <option value="FIXED">FIXED</option>
                <option value="ANY">ANY</option>
              </Form.Select>
              <Errors current_key="type" />
              {formData.type === "ANY" && (
                <Form.Text className="text-muted">
                  Note: Only one "ANY" type button is allowed. Users can enter any amount.
                </Form.Text>
              )}
            </Form.Group>

            {formData.type === "ANY" && (
              <Form.Group className="mb-3">
                <Form.Label>
                  Button Text <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="buttonText"
                  value={formData.buttonText}
                  onChange={onChange}
                  placeholder="Enter button text"
                  maxLength={100}
                  required
                  className={errorList.buttonText ? "invalid" : ""}
                />
                <Errors current_key="buttonText" />
                <Form.Text className="text-muted">
                  Text to display on the donation button
                </Form.Text>
              </Form.Group>
            )}

            {formData.type === "FIXED" && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Amount <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={onChange}
                    placeholder="Enter amount"
                    min="1"
                    step="0.01"
                    required
                    className={errorList.amount ? "invalid" : ""}
                  />
                  <Errors current_key="amount" />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    People Fed <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="number"
                    name="peopleFed"
                    value={formData.peopleFed}
                    onChange={onChange}
                    placeholder="Enter number of people fed"
                    min="0"
                    required
                    className={errorList.peopleFed ? "invalid" : ""}
                  />
                  <Errors current_key="peopleFed" />
                </Form.Group>
              </>
            )}

            <Form.Group className="mb-3">
              <Form.Check
                type="switch"
                name="isActive"
                label="Active"
                checked={formData.isActive}
                onChange={onChange}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={loadingOnDonationButtonSubmit}
            >
              {loadingOnDonationButtonSubmit ? "Saving..." : isEditMode ? "Update" : "Create"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <VerificationConfirmModal
        show={showDeleteModal}
        handleClose={() => {
          setShowDeleteModal(false);
          setSelectedButton(null);
        }}
        handleConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        body={`Are you sure you want to delete the donation button of ₹${selectedButton?.amount}?`}
        submitBtnText="Delete"
      />
    </Container>
  );
};

DonationButtonsList.propTypes = {
  getDonationButtons: PropTypes.func.isRequired,
  createDonationButton: PropTypes.func.isRequired,
  updateDonationButton: PropTypes.func.isRequired,
  deleteDonationButton: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  donationButtons: state.adminDonation.donationButtons,
  loadingDonationButtons: state.adminDonation.loadingDonationButtons,
  loadingOnDonationButtonSubmit: state.adminDonation.loadingOnDonationButtonSubmit,
  loggedInAdmin: state.adminAuth.admin,
  errorList: state.errors,
});

export default connect(mapStateToProps, {
  getDonationButtons,
  createDonationButton,
  updateDonationButton,
  deleteDonationButton,
  setErrorsList,
})(DonationButtonsList);

