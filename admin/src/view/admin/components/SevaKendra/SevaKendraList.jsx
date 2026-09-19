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
  getSevaKendrasList,
  resetComponentStore,
  deleteSevaKendra,
} from "@src/actions/sevaKendraActions";

const SevaKendraList = ({
  loggedInUser,
  sevaKendraList: { data, count },
  getSevaKendrasList,
  loadingSevaKendraList,
  resetComponentStore,
  sortingParams,
  deleteSevaKendra,
}) => {
  const [onlyOnce, setOnce] = React.useState(true);
  const [showModal, setShowModal] = React.useState(false);
  const [selectedSevaKendraDetails, setSelectedSevaKendraDetails] =
    React.useState(null);
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

  const [params, setParams] = React.useState(initialSortingParams);

  const columns = [
    {
      name: "EP ID",
      selector: (row) => <div>{row.EP_ID}</div>,
      sortable: false,
      sortField: "EP_ID",
      width: "160px",
      wrap: true,
    },

    {
      name: "Name",
      selector: (row) => <div>{row.name}</div>,
      sortable: false,
      sortField: "EP_ID",
      width: "160px",
      wrap: true,
    },
    {
      name: "Phone",
      selector: (row) => <div>{row.phone}</div>,
      sortable: false,
      sortField: "EP_ID",
      width: "160px",
      wrap: true,
    },
    {
      name: "Location",
      selector: (row) => <div>{`${row.city},${row.state}`}</div>,
      sortable: false,
      sortField: "EP_ID",
      width: "160px",
      wrap: true,
    },
    {
      name: "Actions",
      width: "50%",
      cell: (row) => (
        <div className="d-flex">
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              setSelectedSevaKendraDetails(row);
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

    getSevaKendrasList(params);
  }, [getSevaKendrasList, params, resetComponentStore, loggedInUser]);

  const handleConfirmDeletion = (txn_password) => {
    deleteSevaKendra(selectedSevaKendraDetails._id, txn_password);

    setShowModal(false);
  };

  const handleCreateSevaKendraClick = (e) => {
    e.preventDefault();
    navigate("/admin/seva-kendra/create");
  };

  return (
    <Container>
      <AppBreadCrumb
        pageTitle="Seva-Kendra List"
        crumbs={[{ name: "Seva-Kendra" }]}
      />

      <MainCard>
        <div className="table-filter-section mb-3">
          <Row className="d-flex justify-content-between">
            <Col md="4">
              <Button
                type="button"
                variant="primary"
                onClick={handleCreateSevaKendraClick}
              >
                Create Seva Kendra
              </Button>
            </Col>
          </Row>
        </div>

        <PiDataTable
          columns={columns}
          data={data}
          count={count}
          params={params}
          setParams={setParams}
          pagination
          responsive
          striped={true}
          progressPending={loadingSevaKendraList}
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
        body={`Are you sure you want to remove Seva-Kendra ${selectedSevaKendraDetails?.EP_ID}?`}
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

SevaKendraList.propTypes = {
  getSevaKendrasList: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  sevaKendraList: state.sevaKendra.sevaKendraList,
  loadingSevaKendraList: state.sevaKendra.loadingSevaKendraList,
  sortingParams: state.sevaKendra.sortingParams,
  loggedInUser: state.adminAuth.admin,
});

export default connect(mapStateToProps, {
  getSevaKendrasList,
  resetComponentStore,
  deleteSevaKendra,
})(SevaKendraList);
