import React from "react";
import { Button, Row, Col, Container } from "react-bootstrap";
import { Link } from "react-router-dom";
import { PropTypes } from "prop-types";
import { connect } from "react-redux";
import moment from "moment";

// icons
import { VscEye } from "react-icons/vsc";
import { IoRefresh } from "react-icons/io5";

// custom imports
import InactiveUserFilters from "./InactiveUserFilters";
import PiDataTable from "@src/view/commonComponents/dataTable/PiDataTable";
import AppBreadCrumb from "@src/view/commonComponents/dataTable/AppBreadCrumb";
import VerificationConfirmModal from "@src/view/admin/modals/VerificationConfirmModal";

import {
  getUsersList,
  resetComponentStore,
  reactivateUser,
} from "@actions/adminUserActions";
import { removeErrors } from "@src/reducers/errors";

import { handleTableChange as handleTableChangeHelper } from "@utils/helper";
import { useDebouncedValue } from "@utils/useDebouncedValue";
import MainCard from "@src/view/commonComponents/mainCard/MainCard";

const InactiveUsersList = ({
  loggedInAdmin,
  usersList: { data, count },
  getUsersList,
  loadingUsersList,
  resetComponentStore,
  sortingParams,
  reactivateUser,
  removeErrors,
}) => {
  const [onlyOnce, setOnce] = React.useState(true);
  const [reactivatingId, setReactivatingId] = React.useState(null);
  const [showConfirmModal, setShowConfirmModal] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState(null);

  const initialSortingParams = {
    limit: 20,
    page: 1,
    orderBy: "createdAt",
    ascending: "desc",
    query: {
      status: { value: 2, type: "Number" },
    },
    filters: ["status"],
  };

  const [userParams, setUserParams] = React.useState(initialSortingParams);
  const debouncedUserParams = useDebouncedValue(userParams, 300);

  const columns = [
    {
      name: "EP ID",
      selector: (row) => (row.EP_ID ? row.EP_ID : "-"),
      sortable: true,
      sortField: "EP_ID",
      width: "120px",
      wrap: true,
    },
    {
      name: "Name",
      selector: (row) => row.name,
      sortable: true,
      sortField: "name",
      width: "180px",
      wrap: true,
    },
    {
      name: "Phone",
      selector: (row) => row.phone,
      sortable: true,
      sortField: "phone",
      width: "130px",
      wrap: true,
    },
    {
      name: "Sponsor EP",
      selector: (row) =>
        row.sponsorEP ? (
          <div>
            <div>{row.sponsorEP}</div>
            {row.sponsorName && (
              <div className="text-muted small">{row.sponsorName}</div>
            )}
          </div>
        ) : (
          "-"
        ),
      sortable: true,
      sortField: "sponsorEP",
      width: "150px",
      wrap: true,
    },
    {
      name: "Upline EP",
      selector: (row) =>
        row.uplineEP ? (
          <div>
            <div>{row.uplineEP}</div>
            {row.uplineName && (
              <div className="text-muted small">{row.uplineName}</div>
            )}
          </div>
        ) : (
          "-"
        ),
      sortable: true,
      sortField: "uplineEP",
      width: "150px",
      wrap: true,
    },
    {
      name: "City & State",
      selector: (row) => {
        const city = row.city || "";
        const state = row.state || "";
        return city || state
          ? `${city}${city && state ? ", " : ""}${state}`
          : "-";
      },
      sortable: true,
      sortField: "city",
      width: "180px",
      wrap: true,
    },
    {
      name: "Created At",
      selector: (row) =>
        row.createdAt
          ? moment(row.createdAt).format("DD/MM/YYYY, hh:mm a")
          : "-",
      sortable: true,
      sortField: "createdAt",
      width: "170px",
      wrap: true,
    },
    {
      name: "Actions",
      width: "140px",
      cell: (row) => (
        <div className="d-flex gap-2 align-items-center justify-content-center">
          <Link
            to={`/admin/users/edit/${row._id}`}
            title="View User"
            className="text-primary"
          >
            <VscEye size={20} />
          </Link>
          <Button
            variant="success"
            size="sm"
            title="Reactivate User"
            disabled={reactivatingId === row._id}
            onClick={() => handleOpenReactivateModal(row)}
          >
            {reactivatingId === row._id ? (
              <span className="spinner-border spinner-border-sm" />
            ) : (
              <>
                <IoRefresh size={16} className="me-1" />
                Reactivate
              </>
            )}
          </Button>
        </div>
      ),
    },
  ];

  const isAdminLoggedIn = Boolean(loggedInAdmin);
  React.useEffect(() => {
    if (onlyOnce) {
      resetComponentStore();
      setOnce(false);
    }

    if (!isAdminLoggedIn) return;

    getUsersList(debouncedUserParams);
  }, [getUsersList, debouncedUserParams, resetComponentStore, isAdminLoggedIn]);

  const searchFields = [
    { name: "name", type: "String" },
    { name: "EP_ID", type: "String" },
    { name: "phone", type: "String" },
  ];

  const handleTableChange = (type, searchText) => {
    handleTableChangeHelper(
      type,
      searchText,
      sortingParams,
      setUserParams,
      searchFields
    );
  };

  const onFilterChange = (newParams) => {
    setUserParams((params) => ({
      ...params,
      ...newParams,
      page: 1,
    }));
  };

  const handleOpenReactivateModal = (user) => {
    setSelectedUser(user);
    setShowConfirmModal(true);
  };

  const handleCloseModal = () => {
    setShowConfirmModal(false);
    setSelectedUser(null);
    removeErrors();
  };

  const handleConfirmReactivate = async (txn_password) => {
    if (!selectedUser) return;
    setReactivatingId(selectedUser._id);
    try {
      const success = await reactivateUser(selectedUser._id, txn_password);
      if (success) {
        handleCloseModal();
        getUsersList(userParams);
      }
    } finally {
      setReactivatingId(null);
    }
  };

  return (
    <Container>
      <AppBreadCrumb
        pageTitle="Inactive Users"
        crumbs={[{ name: "Inactive Users (deactiveUnpaidAndPaymentLinks)" }]}
      />

      <MainCard>
        <div className="table-filter-section mb-3">
          <Row className="mb-3">
            <Col md="12">
              <div>
                <h5>Inactive Users List</h5>
                <p className="text-muted mb-0">
                  Users deactivated by deactiveUnpaidAndPaymentLinks (status 2).
                  Reactivate to restore payment links.
                </p>
                {count > 0 && (
                  <p className="text-muted mb-0 mt-1">Total: {count}</p>
                )}
              </div>
            </Col>
          </Row>
          <InactiveUserFilters
            filterParams={userParams}
            onFilterChange={onFilterChange}
          />
        </div>

        <PiDataTable
          columns={columns}
          data={data}
          count={count}
          params={userParams}
          setParams={setUserParams}
          pagination
          responsive
          striped={true}
          progressPending={loadingUsersList}
          highlightOnHover
          persistTableHead={true}
          paginationServer
        />
      </MainCard>

      <VerificationConfirmModal
        show={showConfirmModal}
        handleClose={handleCloseModal}
        handleConfirm={handleConfirmReactivate}
        title="Confirm Reactivate User"
        body={
          selectedUser
            ? `Reactivate user ${selectedUser.EP_ID || selectedUser.name}? Payment links will be recreated. Enter your transaction password to confirm.`
            : "Enter your transaction password to confirm."
        }
        submitBtnText="Reactivate"
      />
    </Container>
  );
};

InactiveUsersList.propTypes = {
  getUsersList: PropTypes.func.isRequired,
  reactivateUser: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  usersList: state.adminUsers.usersList,
  loadingUsersList: state.adminUsers.loadingUsersList,
  sortingParams: state.adminUsers.sortingParams,
  loggedInAdmin: state.adminAuth.admin,
});

export default connect(mapStateToProps, {
  getUsersList,
  resetComponentStore,
  reactivateUser,
  removeErrors,
})(InactiveUsersList);
