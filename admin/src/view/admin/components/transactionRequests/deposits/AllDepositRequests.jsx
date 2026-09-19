import React from "react";
import { Row, Col, Container } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { PropTypes } from "prop-types";
import { connect } from "react-redux";

// icons
import { VscEye } from "react-icons/vsc";

// custom imports
import DepositRequestFilters from "./DepositRequestFilters";
import PiDataTable from "@src/view/commonComponents/dataTable/PiDataTable";
import AppBreadCrumb from "@src/view/commonComponents/dataTable/AppBreadCrumb";

import {
  getAllDepositRequests,
  resetComponentStore,
} from "@actions/adminDepositActions";

import { handleTableChange as handleTableChangeHelper } from "@utils/helper";
import MainCard from "@src/view/commonComponents/mainCard/MainCard";

const AllDepositRequests = ({
  loggedInAdmin,
  depositRequestsList: { data, count },
  getAllDepositRequests,
  loadingDepositRequestsList,
  resetComponentStore,
  sortingParams,
}) => {
  const [onlyOnce, setOnce] = React.useState(true);
  const { page, limit } = sortingParams;

  const initialSortingParams = {
    limit,
    page,
    orderBy: "createdAt",
    ascending: "desc",
    query: "",
    filters: [],
  };

  const [depositParams, setDepositParams] =
    React.useState(initialSortingParams);

  const columns = [
    {
      name: "User",
      selector: (row) => row.userName,
      sortable: false,
      sortField: "userName",
      width: "20%",
      wrap: true,
    },
    {
      name: "Amount",
      selector: (row) => row.amount,
      sortable: false,
      sortField: "amount",
      width: "20%",
      wrap: true,
    },
    {
      name: "Status",
      selector: (row) => row.status,
      sortable: false,
      width: "15%",
      wrap: true,
    },
    {
      name: "Request Date",
      selector: (row) => new Date(row.createdAt).toLocaleString(),
      sortable: false,
      width: "25%",
      wrap: true,
    },
    {
      name: "Actions",
      width: "calc(20%)",
      cell: (row) => (
        <Row className="gap-2 justify-content-center">
          <Col xs={2} sm={4} md={4}>
            <Link
              to={`/admin/deposits/view/${row._id}`}
              title="View User"
              className="text-primary"
            >
              <VscEye size={20} />
            </Link>
          </Col>
        </Row>
      ),
    },
  ];

  const navigate = useNavigate();
  React.useEffect(() => {
    if (onlyOnce) {
      resetComponentStore();
      setOnce(false);
    }

    if (!loggedInAdmin) return;

    getAllDepositRequests(depositParams);
  }, [
    getAllDepositRequests,
    depositParams,
    resetComponentStore,
    loggedInAdmin,
  ]);

  const searchFields = [
    { name: "userName", type: "String" },
    { name: "amount", type: "Number" },
    { name: "status", type: "String" },
  ];

  const handleTableChange = (type, searchText) => {
    handleTableChangeHelper(
      type,
      searchText,
      sortingParams,
      setDepositParams,
      searchFields
    );
  };

  const onFilterChange = (newParams) => {
    setDepositParams((params) => ({ ...params, ...newParams }));
  };

  return (
    <Container>
      <AppBreadCrumb
        pageTitle="Deposit Requests"
        crumbs={[{ name: "Deposit Requests" }]}
      />

      <MainCard>
        <Row>
          <Col>
            <DepositRequestFilters
              type="text"
              onSearch={handleTableChange}
              filterType="String"
              filterName="Search"
              filterParams={depositParams}
              onFilterChange={onFilterChange}
            />
          </Col>
        </Row>

        <PiDataTable
          columns={columns}
          data={data}
          count={count}
          params={depositParams}
          setParams={setDepositParams}
          pagination
          responsive
          striped={true}
          progressPending={loadingDepositRequestsList}
          highlightOnHover
          persistTableHead={true}
          paginationServer
        />
      </MainCard>
    </Container>
  );
};

AllDepositRequests.propTypes = {
  getAllDepositRequests: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  depositRequestsList: state.adminDeposits.depositRequestsList,
  loadingDepositRequestsList: state.adminDeposits.loadingDepositRequestsList,
  sortingParams: state.adminDeposits.sortingParams,
  loggedInAdmin: state.adminAuth.admin,
});

export default connect(mapStateToProps, {
  getAllDepositRequests,
  resetComponentStore,
})(AllDepositRequests);
