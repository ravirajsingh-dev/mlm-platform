import React from "react";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import moment from "moment";
import PropTypes from "prop-types";
import { connect } from "react-redux";

// custom imports
import PiDataTable from "@src/view/commonComponents/dataTable/PiDataTable";
import AppBreadCrumb from "@src/view/commonComponents/dataTable/AppBreadCrumb";
import MainCard from "@src/view/commonComponents/mainCard/MainCard";

import { formatIndianNumber, capitalizeFirst } from "@utils/helper";

import {
  getWalletTransactions,
  resetComponentStore,
} from "@src/actions/adminWalletActions";

const WalletDetails = ({
  loggedInUser,
  walletTransactionsList: { data, count, summary },
  getWalletTransactions,
  loadingWalletTransactionsList,
  resetComponentStore,
  sortingParams,
}) => {
  const [onlyOnce, setOnce] = React.useState(true);

  const initialSortingParams = {
    limit: 20,
    page: 1,
    orderBy: "createdAt",
    ascending: "desc",
    query: "",
    filters: [],
  };

  const [params, setParams] = React.useState(initialSortingParams);

  // Filter states
  const [epId, setEpId] = React.useState("");
  const [walletType, setWalletType] = React.useState("");
  const [txnType, setTxnType] = React.useState("");
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate] = React.useState("");

  const walletTypes = [
    { label: "All", value: "" },
    { label: "E-Cash", value: "e_cash" },
    { label: "E-Pool", value: "e_pool" },
    { label: "Upgrade", value: "upgrade" },
    { label: "Help", value: "help" },
    { label: "DDF", value: "ddf" },
    { label: "E-Pool Upgrade", value: "e_pool_upgrade" },
  ];

  const txnTypes = [
    { label: "All", value: "" },
    { label: "Credit (CR)", value: "credit" },
    { label: "Debit (DR)", value: "debit" },
  ];

  const columns = [
    {
      name: "EP ID",
      selector: (row) =>
        row.user?.EP_ID ? (
          <div>
            <div>{row.user.EP_ID}</div>
            {row.user.name && (
              <div className="text-muted small">{row.user.name}</div>
            )}
          </div>
        ) : (
          "-"
        ),
      sortable: false,
      width: "120px",
      wrap: true,
    },
    {
      name: "Wallet Type",
      selector: (row) => {
        const type = row.walletType || "";
        return capitalizeFirst(type.replace(/_/g, " "));
      },
      sortable: false,
      width: "140px",
      wrap: true,
    },
    {
      name: "Credit Amount",
      selector: (row) =>
        row.type === "credit" ? `₹ ${formatIndianNumber(row.amount)}` : "-",
      sortable: false,
      width: "150px",
      wrap: true,
    },
    {
      name: "Debit Amount",
      selector: (row) =>
        row.type === "debit" ? `₹ ${formatIndianNumber(row.amount)}` : "-",
      sortable: false,
      width: "150px",
      wrap: true,
    },
    {
      name: "Balance",
      selector: (row) =>
        `₹ ${formatIndianNumber(row.balanceAfterTransaction || 0)}`,
      sortable: false,
      width: "150px",
      wrap: true,
    },
    {
      name: "Remark / Reason",
      selector: (row) => row.description || "-",
      sortable: false,
      width: "250px",
      wrap: true,
    },
    {
      name: "Date & Time",
      selector: (row) =>
        row.createdAt
          ? moment(row.createdAt).format("DD/MM/YYYY, hh:mm a")
          : "-",
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

    getWalletTransactions(params);
  }, [getWalletTransactions, params, resetComponentStore, loggedInUser]);

  const handleApplyFilters = () => {
    const filters = [];
    const query = {};

    if (epId) {
      filters.push("EP_ID");
      query.EP_ID = { value: epId.trim(), type: "String" };
    }

    if (walletType) {
      filters.push("walletType");
      query.walletType = { value: walletType, type: "String" };
    }

    if (txnType) {
      filters.push("type");
      query.type = { value: txnType, type: "String" };
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
    setWalletType("");
    setTxnType("");
    setFromDate("");
    setToDate("");
    setParams((prev) => ({
      ...prev,
      filters: [],
      query: {},
      page: 1,
    }));
  };

  return (
    <Container>
      <AppBreadCrumb
        pageTitle="E-Wallet"
        crumbs={[{ name: "Wallet Details" }]}
      />

      <MainCard>
        {/* Summary Statistics */}
        {summary && (
          <div className="mb-4 p-3 bg-light rounded">
            <Row className="g-3">
              <Col xs={12} sm={6} md={3}>
                <div className="text-center">
                  <div className="text-muted small">Total Records</div>
                  <div className="h5 mb-0 fw-bold">
                    {formatIndianNumber(summary.totalRecords || count)}
                  </div>
                </div>
              </Col>
              <Col xs={12} sm={6} md={3}>
                <div className="text-center">
                  <div className="text-muted small">Total CR Sum</div>
                  <div className="h5 mb-0 fw-bold text-success">
                    ₹ {formatIndianNumber(summary.totalCredit || 0)}
                  </div>
                </div>
              </Col>
              <Col xs={12} sm={6} md={3}>
                <div className="text-center">
                  <div className="text-muted small">Total DR Sum</div>
                  <div className="h5 mb-0 fw-bold text-danger">
                    ₹ {formatIndianNumber(summary.totalDebit || 0)}
                  </div>
                </div>
              </Col>
              <Col xs={12} sm={6} md={3}>
                <div className="text-center">
                  <div className="text-muted small">Net Balance</div>
                  <div className="h5 mb-0 fw-bold text-primary">
                    ₹{" "}
                    {formatIndianNumber(
                      (summary.totalCredit || 0) - (summary.totalDebit || 0)
                    )}
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
                <Form.Label>Wallet Type</Form.Label>
                <Form.Control
                  as="select"
                  value={walletType}
                  onChange={(e) => setWalletType(e.target.value)}
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
                <Form.Label>Transaction Type</Form.Label>
                <Form.Control
                  as="select"
                  value={txnType}
                  onChange={(e) => setTxnType(e.target.value)}
                >
                  {txnTypes.map((type) => (
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
          progressPending={loadingWalletTransactionsList}
          highlightOnHover
          persistTableHead={true}
          paginationServer
        />
      </MainCard>
    </Container>
  );
};

WalletDetails.propTypes = {
  getWalletTransactions: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  walletTransactionsList: state.wallet.walletTransactionsList || {
    data: [],
    count: 0,
    summary: null,
  },
  loadingWalletTransactionsList:
    state.wallet.loadingWalletTransactionsList || false,
  sortingParams: state.wallet.sortingParams,
  loggedInUser: state.adminAuth.admin,
});

export default connect(mapStateToProps, {
  getWalletTransactions,
  resetComponentStore,
})(WalletDetails);
