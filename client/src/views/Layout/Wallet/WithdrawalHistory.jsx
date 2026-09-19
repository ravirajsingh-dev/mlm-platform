import React, { useEffect, useState } from "react";
import { Container, Badge } from "react-bootstrap";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import moment from "moment";
import { fetchWithdrawalRequests } from "@src/actions/withdrawalActions";
import MainCard from "@src/views/Common/Cards/MainCard";
import CustomDataTable from "@src/views/Common/DataTable/CustomDataTable";

const WithdrawalHistory = ({
  withdrawalRequests,
  loadingWithdrawalRequestsList,
  fetchWithdrawalRequests,
}) => {
  const { requests, pagination } = withdrawalRequests;

  const initialParams = {
    page: 1,
    limit: 10,
    orderBy: "createdAt",
    ascending: "desc",
  };

  const [params, setParams] = useState(initialParams);

  useEffect(() => {
    fetchWithdrawalRequests(params.page, params.limit);
  }, [fetchWithdrawalRequests, params.page, params.limit]);

  const getStatusBadge = (status) => {
    const variants = {
      PENDING: "warning",
      APPROVED: "success",
      REJECTED: "danger",
    };
    return <Badge bg={variants[status] || "secondary"}>{status}</Badge>;
  };

  const columns = [
    {
      name: "Amount",
      selector: (row) => row.amount,
      sortable: false,
      cell: (row) => `₹${row.amount}`,
      minWidth: "100px",
      grow: 1,
    },
    {
      name: "Surcharge",
      selector: (row) => row.surchargeAmount,
      sortable: false,
      cell: (row) => `₹${row.surchargeAmount}`,
      minWidth: "100px",
      grow: 1,
    },
    {
      name: "Net Payable",
      selector: (row) => row.netPayableAmount,
      sortable: false,
      cell: (row) => `₹${row.netPayableAmount}`,
      minWidth: "120px",
      grow: 1,
    },
    {
      name: "UPI ID",
      selector: (row) => row.upiId,
      sortable: false,
      wrap: true,
      minWidth: "150px",
      grow: 1.5,
    },
    {
      name: "UTR Number",
      selector: (row) => row.utrNumber,
      sortable: false,
      cell: (row) =>
        row.status === "APPROVED" && row.utrNumber ? row.utrNumber : "-",
      minWidth: "160px",
      grow: 1,
    },
    {
      name: "Admin Remark",
      selector: (row) => row.adminRemark,
      sortable: false,
      cell: (row) =>
        row.adminRemark ? (
          <span title={row.adminRemark}>
            {row.adminRemark.length > 200
              ? row.adminRemark.substring(0, 200) + "..."
              : row.adminRemark}
          </span>
        ) : (
          "-"
        ),
      wrap: true,
      minWidth: "220px",
      // grow: 2,
    },
    {
      name: "Status",
      selector: (row) => row.status,
      sortable: false,
      cell: (row) => getStatusBadge(row.status),
      minWidth: "100px",
      grow: 1,
    },
    {
      name: "Request Date",
      selector: (row) => row.createdAt,
      sortable: false,
      cell: (row) => moment(row.createdAt).format("DD-MM-YYYY, hh:mm a"),
      minWidth: "180px",
      grow: 1.5,
    },
    {
      name: "Action Date",
      selector: (row) => row.actionAt,
      sortable: false,
      cell: (row) =>
        row.actionAt ? moment(row.actionAt).format("DD-MM-YYYY, hh:mm a") : "-",
      minWidth: "180px",
      grow: 1.5,
    },
  ];

  return (
    <Container>
      <MainCard>
        <CustomDataTable
          columns={columns}
          data={requests || []}
          count={pagination?.totalRecords || 0}
          params={params}
          setParams={setParams}
          pagination
          responsive
          striped
          progressPending={loadingWithdrawalRequestsList}
          highlightOnHover
          persistTableHead
          paginationServer
        />
      </MainCard>
    </Container>
  );
};

WithdrawalHistory.propTypes = {
  withdrawalRequests: PropTypes.object,
  loadingWithdrawalRequestsList: PropTypes.bool,
  fetchWithdrawalRequests: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  withdrawalRequests: state.wallet.withdrawalRequests,
  loadingWithdrawalRequestsList: state.wallet.loadingWithdrawalRequestsList,
});

export default connect(mapStateToProps, { fetchWithdrawalRequests })(
  WithdrawalHistory
);
