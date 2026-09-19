import React from "react";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import PropTypes from "prop-types";
import { connect } from "react-redux";

// custom imports
import PiDataTable from "@src/view/commonComponents/dataTable/PiDataTable";
import AppBreadCrumb from "@src/view/commonComponents/dataTable/AppBreadCrumb";
import MainCard from "@src/view/commonComponents/mainCard/MainCard";

import { formatIndianNumber, capitalizeFirst } from "@utils/helper";

import {
  getUsersWalletBalance,
  resetComponentStore,
} from "@src/actions/adminWalletActions";

const ECashBalance = ({
  loggedInUser,
  usersWalletBalanceList: { data, count, summary },
  getUsersWalletBalance,
  loadingUsersWalletBalanceList,
  resetComponentStore,
  sortingParams,
}) => {
  const [onlyOnce, setOnce] = React.useState(true);

  const initialSortingParams = {
    limit: 20,
    page: 1,
    orderBy: "balance",
    ascending: "desc",
    query: "",
    filters: [],
  };

  const [params, setParams] = React.useState(initialSortingParams);

  // Filter states
  const [epId, setEpId] = React.useState("");
  const [walletType, setWalletType] = React.useState("e_cash");
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate] = React.useState("");

  const walletTypes = [
    { label: "E-Cash", value: "e_cash" },
    { label: "E-Pool", value: "e_pool" },
    { label: "Upgrade", value: "upgrade" },
    { label: "Help", value: "help" },
    { label: "DDF", value: "ddf" },
    { label: "E-Pool Upgrade", value: "e_pool_upgrade" },
  ];

  const columns = [
    {
      name: "EP ID",
      selector: (row) => row.user?.EP_ID || "-",
      sortable: false,
      width: "120px",
      wrap: true,
    },
    {
      name: "User Name",
      selector: (row) => row.user?.name || "-",
      sortable: false,
      width: "180px",
      wrap: true,
    },
    {
      name: "Wallet Name",
      selector: (row) => {
        const type = row.walletType || "";
        return capitalizeFirst(type.replace(/_/g, " "));
      },
      sortable: false,
      width: "150px",
      wrap: true,
    },
    {
      name: "Available Balance",
      selector: (row) => `₹ ${formatIndianNumber(row.balance || 0)}`,
      sortable: false,
      width: "180px",
      wrap: true,
    },
  ];

  React.useEffect(() => {
    if (onlyOnce) {
      resetComponentStore();
      setOnce(false);
    }

    if (!loggedInUser) return;

    // Build filters and query
    const filters = ["walletType"];
    const query = {
      walletType: { value: walletType, type: "String" },
    };

    if (epId) {
      filters.push("EP_ID");
      query.EP_ID = { value: epId.trim(), type: "String" };
    }

    if (fromDate || toDate) {
      filters.push("createdAt");
      const startDate = fromDate || new Date(0).toISOString().split("T")[0];
      const endDate = toDate || new Date().toISOString().split("T")[0];
      query.createdAt = { value: `${startDate}|${endDate}`, type: "Date" };
    }

    getUsersWalletBalance({
      ...params,
      filters,
      query,
      walletType,
    });
  }, [
    getUsersWalletBalance,
    params,
    resetComponentStore,
    loggedInUser,
    walletType,
    epId,
    fromDate,
    toDate,
  ]);

  const handleApplyFilters = () => {
    const filters = ["walletType"];
    const query = {
      walletType: { value: walletType, type: "String" },
    };

    if (epId) {
      filters.push("EP_ID");
      query.EP_ID = { value: epId.trim(), type: "String" };
    }

    if (fromDate || toDate) {
      filters.push("createdAt");
      const startDate = fromDate || new Date(0).toISOString().split("T")[0];
      const endDate = toDate || new Date().toISOString().split("T")[0];
      query.createdAt = { value: `${startDate}|${endDate}`, type: "Date" };
    }

    setParams((prev) => ({
      ...prev,
      filters,
      query,
      page: 1,
    }));
  };

  const handleResetFilters = () => {
    setEpId("");
    setWalletType("e_cash");
    setFromDate("");
    setToDate("");
    setParams((prev) => ({
      ...prev,
      filters: ["walletType"],
      query: { walletType: { value: "e_cash", type: "String" } },
      page: 1,
    }));
  };

  return (
    <Container>
      <AppBreadCrumb
        pageTitle="E-Wallet"
        crumbs={[{ name: "E-Cash Balance" }]}
      />

      <MainCard>
        {/* Summary Statistics */}
        {summary && (
          <div className="mb-4 p-3 bg-light rounded">
            <Row className="g-3">
              <Col xs={12} sm={6} md={4}>
                <div className="text-center">
                  <div className="text-muted small">Total Records</div>
                  <div className="h5 mb-0 fw-bold">{formatIndianNumber(summary.totalRecords || count)}</div>
                </div>
              </Col>
              <Col xs={12} sm={6} md={4}>
                <div className="text-center">
                  <div className="text-muted small">Total Available Balance</div>
                  <div className="h5 mb-0 fw-bold text-primary">
                    ₹ {formatIndianNumber(summary.totalBalance || 0)}
                  </div>
                </div>
              </Col>
              <Col xs={12} sm={6} md={4}>
                <div className="text-center">
                  <div className="text-muted small">Average Balance</div>
                  <div className="h5 mb-0 fw-bold text-info">
                    ₹ {formatIndianNumber(summary.averageBalance || 0)}
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        )}

        <div className="table-filter-section mb-3">
          <Row className="row-gap-2">
            <Col xs={12} sm={6} md={3} lg={2}>
              <Form.Group>
                <Form.Label>EP ID</Form.Label>
                <Form.Control
                  type="text"
                  value={epId}
                  onChange={(e) => setEpId(e.target.value)}
                  placeholder="Enter EP ID"
                />
              </Form.Group>
            </Col>

            <Col xs={12} sm={6} md={3} lg={2}>
              <Form.Group>
                <Form.Label>Wallet Type*</Form.Label>
                <Form.Control
                  as="select"
                  value={walletType}
                  onChange={(e) => setWalletType(e.target.value)}
                  required
                >
                  {walletTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Form.Control>
              </Form.Group>
            </Col>

            <Col xs={12} sm={6} md={3} lg={2}>
              <Form.Group>
                <Form.Label>From Date</Form.Label>
                <Form.Control
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </Form.Group>
            </Col>

            <Col xs={12} sm={6} md={3} lg={2}>
              <Form.Group>
                <Form.Label>To Date</Form.Label>
                <Form.Control
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </Form.Group>
            </Col>

            <Col
              xs={12}
              sm={6}
              md={3}
              lg={2}
              className="d-flex align-items-end gap-2"
            >
              <Button variant="primary" onClick={handleApplyFilters}>
                Filter
              </Button>
              <Button variant="outline-secondary" onClick={handleResetFilters}>
                Reset
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
          progressPending={loadingUsersWalletBalanceList}
          highlightOnHover
          persistTableHead={true}
          paginationServer
        />
      </MainCard>
    </Container>
  );
};

ECashBalance.propTypes = {
  getUsersWalletBalance: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  usersWalletBalanceList: state.wallet.usersWalletBalanceList || {
    data: [],
    count: 0,
    summary: null,
  },
  loadingUsersWalletBalanceList:
    state.wallet.loadingUsersWalletBalanceList || false,
  sortingParams: state.wallet.sortingParams,
  loggedInUser: state.adminAuth.admin,
});

export default connect(mapStateToProps, {
  getUsersWalletBalance,
  resetComponentStore,
})(ECashBalance);

