import React from "react";
import { Button, Row, Col, Container, Badge } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { PropTypes } from "prop-types";
import { connect } from "react-redux";
import moment from "moment";

// icons
import { VscEye } from "react-icons/vsc";
import { RiDeleteBin5Line } from "react-icons/ri";
import { FiDownload } from "react-icons/fi";

// custom imports
import UserFilters from "./UserFilters";
import PiDataTable from "@src/view/commonComponents/dataTable/PiDataTable";
import AppBreadCrumb from "@src/view/commonComponents/dataTable/AppBreadCrumb";

import {
  getUsersList,
  deleteUser,
  resetComponentStore,
  exportUsersList,
} from "@actions/adminUserActions";

import { handleTableChange as handleTableChangeHelper } from "@utils/helper";
import { useDebouncedValue } from "@utils/useDebouncedValue";
import MainCard from "@src/view/commonComponents/mainCard/MainCard";
import { UserStatuses } from "@src/constants/CustomSelectValues";

const UsersList = ({
  loggedInAdmin,
  usersList: { data, count },
  getUsersList,
  deleteUser,
  loadingUsersList,
  resetComponentStore,
  sortingParams,
  exportUsersList,
}) => {
  const [onlyOnce, setOnce] = React.useState(true);
  const { page, limit } = sortingParams;

  const initialSortingParams = {
    limit: 20,
    page: 1,
    orderBy: "createdAt",
    ascending: "desc",
    query: "",
    filters: [],
  };

  const [userParams, setUserParams] = React.useState(initialSortingParams);
  const debouncedUserParams = useDebouncedValue(userParams, 300);

  const getStatusBadge = (status) => {
    const statusOption = UserStatuses.find((s) => s.value === status);
    const statusLabel = statusOption ? statusOption.label : "Unknown";
    let bgColor = "secondary";
    if (status === 1) bgColor = "success";
    else if (status === 2) bgColor = "secondary";
    else if (status === 3) bgColor = "info";
    else if (status === 4) bgColor = "danger";
    return <Badge bg={bgColor}>{statusLabel}</Badge>;
  };

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
      name: "Status",
      selector: (row) => getStatusBadge(row.status),
      sortable: true,
      sortField: "status",
      width: "140px",
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
      width: "100px",
      cell: (row) => (
        <div className="d-flex justify-content-center">
          <Link
            to={`/admin/users/edit/${row._id}`}
            title="View User"
            className="text-primary"
          >
            <VscEye size={20} />
          </Link>
        </div>
      ),
    },
  ];

  const navigate = useNavigate();
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
    { name: "uuid", type: "String" },
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
      page: 1, // Reset to first page when filters change
    }));
  };

  const handleDownloadExcel = async () => {
    try {
      // Create export params with current filters but no pagination
      const exportParams = {
        ...userParams,
        limit: 10000, // Large limit to get all filtered results
        page: 1,
      };

      const response = await exportUsersList(exportParams);

      // Create a blob from the response
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `users_list_${moment().format("YYYY-MM-DD_HH-mm-ss")}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading Excel:", error);
    }
  };

  return (
    <Container>
      <AppBreadCrumb pageTitle="Users" crumbs={[{ name: "Users" }]} />

      <MainCard>
        <div className="table-filter-section mb-3">
          <Row className="mb-3">
            <Col
              md="12"
              className="d-flex justify-content-between align-items-center"
            >
              <div>
                <h5>User Filters</h5>
                {count > 0 && (
                  <p className="text-muted mb-0">Total Users: {count}</p>
                )}
              </div>
              <Button
                variant="success"
                onClick={handleDownloadExcel}
                disabled={loadingUsersList}
              >
                <FiDownload className="me-2" />
                Download Excel
              </Button>
            </Col>
          </Row>
          <UserFilters
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
    </Container>
  );
};

UsersList.propTypes = {
  getUsersList: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  usersList: state.adminUsers.usersList,
  loadingUsersList: state.adminUsers.loadingUsersList,
  sortingParams: state.adminUsers.sortingParams,
  loggedInAdmin: state.adminAuth.admin,
});

export default connect(mapStateToProps, {
  getUsersList,
  deleteUser,
  resetComponentStore,
  exportUsersList,
})(UsersList);
