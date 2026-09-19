import React from "react";
import { Button, Row, Col, Container } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { connect } from "react-redux";

// icons
import { VscEye } from "react-icons/vsc";
import { RiDeleteBin5Line } from "react-icons/ri";

// custom imports
import PiDataTable from "@src/view/commonComponents/dataTable/PiDataTable";
import AppBreadCrumb from "@src/view/commonComponents/dataTable/AppBreadCrumb";
import MainCard from "@src/view/commonComponents/mainCard/MainCard";

import VerificationConfirmModal from "../../modals/VerificationConfirmModal";
import SetTxnPasswordModal from "../../modals/SetTxnPasswordModal";

import {
  getFirstPayUsersList,
  resetComponentStore,
  deleteFirstPayUser,
} from "@src/actions/adminFirstPayUserActions";

const FirstPayUserList = ({
  loggedInUser,
  firstPayUserList: { data, count },
  getFirstPayUsersList,
  loadingFirstPayUserList,
  resetComponentStore,
  sortingParams,
  deleteFirstPayUser,
}) => {
  const [onlyOnce, setOnce] = React.useState(true);
  const [showModal, setShowModal] = React.useState(false);
  const [selectedLevelDetails, setSelectedLevelDetails] = React.useState(null);
  const [showTxnPasswordModal, setShowTxnPasswordModal] = React.useState(false);

  const { page, limit } = sortingParams;

  const initialSortingParams = {
    limit: 10,
    page: 1,
    orderBy: "createdAt",
    ascending: "desc",
    query: "",
    filters: [],
  };

  const [ePinParams, setEPinParams] = React.useState(initialSortingParams);

  const columns = [
    {
      name: "Level",
      selector: (row) => row.label,
      sortable: false,
      sortField: "type",
      width: "25%",
      wrap: true,
    },
    {
      name: "User Name",
      selector: (row) => <div>{row.assignedUserName}</div>,
      sortable: false,
      sortField: "name",
      width: "35%",
      wrap: true,
    },
    {
      name: "Count",
      selector: (row) => row.pendingLinksCount,
      sortable: false,
      sortField: "name",
      width: "20%",
      wrap: true,
    },

    {
      name: "Actions",
      width: "20%",
      cell: (row) => (
        <div className="d-flex">
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              setSelectedLevelDetails(row);
              setShowModal(true);
            }}
          >
            <RiDeleteBin5Line />
          </Button>
        </div>
      ),
    },
  ];

  const navigate = useNavigate();
  React.useEffect(() => {
    if (onlyOnce) {
      resetComponentStore();
      setOnce(false);
    }

    if (!loggedInUser) return;

    getFirstPayUsersList(ePinParams);
  }, [getFirstPayUsersList, ePinParams, resetComponentStore, loggedInUser]);

  const handleConfirmDeletion = (txn_password) => {
    deleteFirstPayUser(selectedLevelDetails._id, txn_password);

    setShowModal(false);
  };

  const handleCreateFirstPayUserClick = (e) => {
    e.preventDefault();
    navigate("/admin/first-pay-user/create");
  };

  return (
    <Container>
      <AppBreadCrumb
        pageTitle="First-Pay User List"
        crumbs={[{ name: "First-Pay User" }]}
      />

      <MainCard>
        <div className="table-filter-section mb-3">
          <Row className="d-flex justify-content-between">
            <Col md="4">
              <Button
                type="button"
                variant="primary"
                onClick={handleCreateFirstPayUserClick}
              >
                Create First-Pay User
              </Button>
            </Col>
          </Row>
        </div>

        <PiDataTable
          columns={columns}
          data={data}
          count={count}
          params={ePinParams}
          setParams={setEPinParams}
          pagination
          responsive
          striped={true}
          progressPending={loadingFirstPayUserList}
          highlightOnHover
          persistTableHead={true}
          paginationServer
        />
      </MainCard>
      <VerificationConfirmModal
        show={showModal}
        handleClose={() => setShowModal(false)}
        handleConfirm={handleConfirmDeletion}
        title="Confirm Deletion"
        body={`Are you sure you want to remove User ${selectedLevelDetails?.assignedUserName}?`}
        submitBtnText="Delete"
      />

      <SetTxnPasswordModal
        show={showTxnPasswordModal}
        handleClose={() => {
          setShowTxnPasswordModal(false);
        }}
      />
    </Container>
  );
};

FirstPayUserList.propTypes = {
  getFirstPayUsersList: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  firstPayUserList: state.firstPayUser.firstPayUserList,
  loadingFirstPayUserList: state.firstPayUser.loadingFirstPayUserList,
  sortingParams: state.firstPayUser.sortingParams,
  loggedInUser: state.adminAuth.admin,
});

export default connect(mapStateToProps, {
  getFirstPayUsersList,
  resetComponentStore,
  deleteFirstPayUser,
})(FirstPayUserList);
