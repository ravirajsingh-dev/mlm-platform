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
  getUserWalletTransfers,
  resetComponentStore,
} from "@src/actions/adminWalletActions";

const TransferReport = ({
  loggedInUser,
  userWalletTransfersList: { data, count },
  getUserWalletTransfers,
  loadingUserWalletTransfersList,
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

  const columns = [
    {
      name: "From User",
      selector: (row) =>
        row.transferredBy ? (
          <div>
            <div>{row.transferredBy}</div>
            {row.transferredByName && (
              <div className="text-muted small">{row.transferredByName}</div>
            )}
          </div>
        ) : (
          "-"
        ),
      sortable: false,
      width: "150px",
      wrap: true,
    },
    {
      name: "To User",
      selector: (row) =>
        row.transferredTo ? (
          <div>
            <div>{row.transferredTo}</div>
            {row.transferredToName && (
              <div className="text-muted small">{row.transferredToName}</div>
            )}
          </div>
        ) : (
          "-"
        ),
      sortable: false,
      width: "150px",
      wrap: true,
    },
    {
      name: "Wallet Type",
      selector: (row) => {
        const type = row.walletType || "e_cash";
        return capitalizeFirst(type.replace(/_/g, " "));
      },
      sortable: false,
      width: "140px",
      wrap: true,
    },
    {
      name: "Amount",
      selector: (row) => `₹ ${formatIndianNumber(row.amount || 0)}`,
      sortable: false,
      width: "150px",
      wrap: true,
    },
    {
      name: "Transfer Type",
      selector: (row) => {
        if (row.transferredBy && row.transferredTo) {
          return "User-to-User";
        }
        return "Wallet-to-Wallet";
      },
      sortable: false,
      width: "150px",
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
    {
      name: "Status",
      selector: (row) => capitalizeFirst(row.status || "Success"),
      sortable: false,
      width: "120px",
      wrap: true,
    },
  ];

  React.useEffect(() => {
    if (onlyOnce) {
      resetComponentStore();
      setOnce(false);
    }

    if (!loggedInUser) return;

    getUserWalletTransfers(params);
  }, [getUserWalletTransfers, params, resetComponentStore, loggedInUser]);

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
        crumbs={[{ name: "Transfer Report" }]}
      />

      <MainCard>
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
          progressPending={loadingUserWalletTransfersList}
          highlightOnHover
          persistTableHead={true}
          paginationServer
        />
      </MainCard>
    </Container>
  );
};

TransferReport.propTypes = {
  getUserWalletTransfers: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  userWalletTransfersList: state.wallet.userWalletTransfersList || {
    data: [],
    count: 0,
    summary: null,
  },
  loadingUserWalletTransfersList:
    state.wallet.loadingUserWalletTransfersList || false,
  sortingParams: state.wallet.sortingParams,
  loggedInUser: state.adminAuth.admin,
});

export default connect(mapStateToProps, {
  getUserWalletTransfers,
  resetComponentStore,
})(TransferReport);
