import React from "react";
import { Row, Col, Container, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { PropTypes } from "prop-types";
import { connect } from "react-redux";

// icons
import { VscEye } from "react-icons/vsc";

// custom imports
import WithdrawalRequestFilters from "./WithdrawalRequestFilters";
import PiDataTable from "@src/view/commonComponents/dataTable/PiDataTable";
import AppBreadCrumb from "@src/view/commonComponents/dataTable/AppBreadCrumb";
import QRCodeModal from "@src/view/admin/modals/QRCodeModal";

import {
  getAllWithdrawalRequests,
  resetComponentStore,
} from "@actions/adminWithdrawalActions";

import { handleTableChange as handleTableChangeHelper } from "@utils/helper";
import MainCard from "@src/view/commonComponents/mainCard/MainCard";

const AllWithdrawalRequests = ({
  loggedInAdmin,
  withdrawalRequestsList: { data, count },
  getAllWithdrawalRequests,
  loadingWithdrawalRequestsList,
  resetComponentStore,
  sortingParams,
}) => {
  const [onlyOnce, setOnce] = React.useState(true);
  const [showQRModal, setShowQRModal] = React.useState(false);
  const [selectedWithdrawalId, setSelectedWithdrawalId] = React.useState(null);
  const { page, limit } = sortingParams;

  const initialSortingParams = {
    limit,
    page,
    orderBy: "createdAt",
    ascending: "desc",
    query: "",
    filters: [],
  };

  const [withdrawalParams, setWithdrawalParams] =
    React.useState(initialSortingParams);

  const columns = [
    {
      name: "User",
      cell: (row) => {
        if (row.userId && typeof row.userId === "object") {
          return row.userId.name || "N/A";
        }
        return "N/A";
      },
      sortable: false,
      width: "200px",
      wrap: true,
    },
    {
      name: "EP ID",
      cell: (row) => {
        if (row.userId && typeof row.userId === "object") {
          return row.userId.EP_ID || "N/A";
        }
        return "N/A";
      },
      sortable: false,
      width: "100px",
      wrap: true,
    },
    {
      name: "Amount",
      cell: (row) => `₹${row.amount || 0}`,
      sortable: false,
      width: "100px",
      wrap: true,
    },
    {
      name: "Net Payable",
      cell: (row) => `₹${row.netPayableAmount || 0}`,
      sortable: false,
      width: "150px",
      wrap: true,
    },
    {
      name: "Current E-Cash",
      cell: (row) => {
        const balance = row.currentECashBalance || 0;
        const amount = row.amount || 0;
        const isInsufficient = balance < amount;
        return (
          <span className={isInsufficient ? "text-danger fw-bold" : ""}>
            ₹{balance.toFixed(2)}
            {isInsufficient && row.status === "PENDING" && (
              <span className="d-block text-danger small">Insufficient</span>
            )}
          </span>
        );
      },
      sortable: false,
      width: "150px",
      wrap: true,
    },
    {
      name: "UPI",
      cell: (row) => row.upiId || "N/A",
      sortable: false,
      width: "150px",
      wrap: true,
    },
    {
      name: "QR",
      cell: (row) => (
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setSelectedWithdrawalId(row._id);
            setShowQRModal(true);
          }}
          disabled={
            !row.upiId ||
            !row.upiHolderName ||
            !row.netPayableAmount ||
            row.status !== "PENDING"
          }
        >
          View QR
        </Button>
      ),
      sortable: false,
      width: "150px",
      wrap: true,
    },
    {
      name: "Status",
      cell: (row) => (
        <span
          className={`badge ${
            row.status === "APPROVED"
              ? "bg-success"
              : row.status === "REJECTED"
              ? "bg-danger"
              : "bg-warning"
          }`}
        >
          {row.status || "PENDING"}
        </span>
      ),
      sortable: false,
      width: "100px",
      wrap: true,
    },
    {
      name: "Request Date",
      cell: (row) =>
        row.createdAt ? new Date(row.createdAt).toLocaleString() : "N/A",
      sortable: false,
      width: "200px",
      wrap: true,
    },
    {
      name: "Actions",
      width: "100px",
      cell: (row) => (
        <Row className="gap-2 justify-content-center">
          <Col xs={2} sm={4} md={4}>
            <Link
              to={`/admin/withdrawals/view/${row._id}`}
              title="View withdrawal request"
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

    // Initial load with default params
    getAllWithdrawalRequests(initialSortingParams);
  }, [loggedInAdmin, resetComponentStore, getAllWithdrawalRequests]);

  React.useEffect(() => {
    if (!loggedInAdmin || onlyOnce) return;

    // Debounce to avoid too many requests
    const timeoutId = setTimeout(() => {
      getAllWithdrawalRequests(withdrawalParams);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [
    withdrawalParams.status,
    withdrawalParams.page,
    withdrawalParams.limit,
    withdrawalParams.epId,
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
      setWithdrawalParams,
      searchFields
    );
  };

  const onFilterChange = (newParams) => {
    setWithdrawalParams((params) => {
      const updated = { ...params, ...newParams };
      // Map status filter to API format
      if (newParams.filters) {
        const statusFilter = newParams.filters.find(
          (f) => f.field === "status"
        );
        if (statusFilter) {
          updated.status = statusFilter.value?.toUpperCase();
        } else {
          delete updated.status;
        }
      }
      return updated;
    });
  };

  return (
    <Container>
      <AppBreadCrumb
        pageTitle="Withdrawal Requests"
        crumbs={[{ name: "Withdrawal Requests" }]}
      />

      <MainCard>
        <Row>
          <Col>
            <WithdrawalRequestFilters
              type="text"
              onSearch={handleTableChange}
              filterType="String"
              filterName="Search"
              filterParams={withdrawalParams}
              onFilterChange={onFilterChange}
            />
          </Col>
        </Row>

        <PiDataTable
          columns={columns}
          data={data || []}
          count={count || 0}
          params={withdrawalParams}
          setParams={setWithdrawalParams}
          pagination
          responsive
          striped={true}
          progressPending={loadingWithdrawalRequestsList}
          highlightOnHover
          persistTableHead={true}
          paginationServer
        />

        {!loadingWithdrawalRequestsList && (!data || data.length === 0) && (
          <Row className="mt-3">
            <Col className="text-center py-5">
              <p className="text-muted">No withdrawal requests found.</p>
            </Col>
          </Row>
        )}
      </MainCard>

      <QRCodeModal
        show={showQRModal}
        handleClose={() => {
          setShowQRModal(false);
          setSelectedWithdrawalId(null);
        }}
        withdrawalRequestId={selectedWithdrawalId || ""}
        isAdmin={true}
      />
    </Container>
  );
};

AllWithdrawalRequests.propTypes = {
  getAllWithdrawalRequests: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  withdrawalRequestsList: state.adminWithdrawals.withdrawalRequestsList,
  loadingWithdrawalRequestsList:
    state.adminWithdrawals.loadingWithdrawalRequestsList,
  sortingParams: state.adminWithdrawals.sortingParams,
  loggedInAdmin: state.adminAuth.admin,
});

export default connect(mapStateToProps, {
  getAllWithdrawalRequests,
  resetComponentStore,
})(AllWithdrawalRequests);
