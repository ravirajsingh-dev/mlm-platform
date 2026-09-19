import React from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import PropTypes from "prop-types";
import { connect } from "react-redux";

// custom imports
import PiDataTable from "@src/view/commonComponents/dataTable/PiDataTable";
import AppBreadCrumb from "@src/view/commonComponents/dataTable/AppBreadCrumb";
import MainCard from "@src/view/commonComponents/mainCard/MainCard";

import { capitalizeFirst, formatIndianNumber } from "@utils/helper";

import {
  getWalletTransferReport,
  resetComponentStore,
} from "@src/actions/adminWalletActions";

const MoneyTransferReportsList = ({
  loggedInUser,
  walletTransferReportsList: { data, count },
  getWalletTransferReport,
  loadingWalletTransferReportList,
  resetComponentStore,
  sortingParams,
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

  const [params, setParams] = React.useState(initialSortingParams);

  const columns = [
    {
      name: "Wallet",
      selector: (row) => {
        const type = row.walletType || "e_cash";
        return capitalizeFirst(type.replace(/_/g, " "));
      },
      sortable: false,
      width: "160px",
      wrap: true,
    },

    {
      name: "Amount",
      selector: (row) => `₹ ${formatIndianNumber(row.amount)}`,
      sortable: false,
      width: "180px",
      wrap: true,
    },

    {
      name: "Type",
      selector: (row) => `${row.type === "CR" ? "CREDIT" : "DEBIT"}`,
      sortable: false,
      width: "180px",
      wrap: true,
    },

    {
      name: "User's EP ID",
      selector: (row) => row.transferredTo,
      sortable: false,
      width: "160px",
      wrap: true,
    },
    {
      name: "Desc.",
      selector: (row) => capitalizeFirst(row.status),
      sortable: false,
      width: "250px",
      wrap: true,
    },
    {
      name: "Date",
      selector: (row) => moment(row.createdAt).format("MMM DD, YYYY, hh:mm a"),
      sortable: false,
      width: "200px",
      wrap: true,
    },
  ];

  const navigate = useNavigate();

  React.useEffect(() => {
    if (onlyOnce) {
      resetComponentStore();
      setOnce(false);
    }

    if (!loggedInUser) return;

    getWalletTransferReport(params);
  }, [getWalletTransferReport, params, resetComponentStore, loggedInUser]);

  const handleAddMoneyClick = (e) => {
    e.preventDefault();
    navigate("/admin/transfer-fund");
  };

  return (
    <Container>
      <AppBreadCrumb
        pageTitle="Wallet"
        crumbs={[{ name: "Wallet Transfer List" }]}
      />

      <MainCard>
        <div className="table-filter-section mb-3">
          <Row className="d-flex justify-content-between">
            <Col md="4">
              <Button
                type="button"
                variant="primary"
                onClick={handleAddMoneyClick}
              >
                Money Transfer
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
          progressPending={loadingWalletTransferReportList}
          highlightOnHover
          persistTableHead={true}
          paginationServer
        />
      </MainCard>
    </Container>
  );
};

MoneyTransferReportsList.propTypes = {
  getWalletTransferReport: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  walletTransferReportsList: state.wallet.walletTransferReportsList,
  loadingWalletTransferReportList: state.wallet.loadingWalletTransferReportList,
  sortingParams: state.wallet.sortingParams,
  loggedInUser: state.adminAuth.admin,
});

export default connect(mapStateToProps, {
  getWalletTransferReport,
  resetComponentStore,
})(MoneyTransferReportsList);
