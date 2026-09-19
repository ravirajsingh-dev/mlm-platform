import React from "react";
import { Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import PropTypes from "prop-types";
import { connect } from "react-redux";

// custom imports
import PiDataTable from "@src/view/commonComponents/dataTable/PiDataTable";
import AppBreadCrumb from "@src/view/commonComponents/dataTable/AppBreadCrumb";
import MainCard from "@src/view/commonComponents/mainCard/MainCard";

import { capitalizeFirst } from "@utils/helper";

import {
  getEPinTransferReport,
  resetComponentStore,
} from "@src/actions/adminEPinActions";

const EPinTransferReportsList = ({
  loggedInUser,
  epinTransferReportsList: { data, count },
  getEPinTransferReport,
  loadingEPinTransferReportList,
  resetComponentStore,
  sortingParams,
}) => {
  const [onlyOnce, setOnce] = React.useState(true);

  const { page, limit } = sortingParams;

  const initialSortingParams = {
    limit: 10,
    page: 1,
    orderBy: "createdAt",
    ascending: "desc",
    query: "",
    filters: [],
  };

  const [ePinParams, setEPinParams] = React.useState(initialSortingParams);

  const columns = [
    {
      name: "Plan",
      selector: (row) => "EPin",
      sortable: false,
      width: "15%",
      wrap: true,
    },

    {
      name: "Quantity",
      selector: (row) => row.quantity,
      sortable: false,
      width: "15%",
      wrap: true,
    },

    {
      name: "Transfer By",
      selector: (row) => row.transferredBy,
      sortable: false,
      width: "20%",
      wrap: true,
    },
    {
      name: "Transfer To",
      selector: (row) => row.transferredTo,
      sortable: false,
      width: "20%",
      wrap: true,
    },
    {
      name: "Status",
      selector: (row) => capitalizeFirst(row.status),
      sortable: false,
      width: "15%",
      wrap: true,
    },
    {
      name: "Date",
      selector: (row) => moment(row.createdAt).format("DD-MM-YYYY"),
      sortable: false,
      width: "15%",
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

    getEPinTransferReport(ePinParams);
  }, [getEPinTransferReport, ePinParams, resetComponentStore, loggedInUser]);

  return (
    <Container>
      <AppBreadCrumb
        pageTitle="EP-Keys List"
        crumbs={[{ name: "EP-key Requests" }]}
      />

      <MainCard>
        <PiDataTable
          columns={columns}
          data={data}
          count={count}
          params={ePinParams}
          setParams={setEPinParams}
          pagination
          responsive
          striped={true}
          progressPending={loadingEPinTransferReportList}
          highlightOnHover
          persistTableHead={true}
          paginationServer
        />
      </MainCard>
    </Container>
  );
};

EPinTransferReportsList.propTypes = {
  getEPinTransferReport: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  epinTransferReportsList: state.epin.epinTransferReportsList,
  loadingEPinTransferReportList: state.epin.loadingEPinTransferReportList,
  sortingParams: state.epin.sortingParams,
  loggedInUser: state.adminAuth.admin,
});

export default connect(mapStateToProps, {
  getEPinTransferReport,
  resetComponentStore,
})(EPinTransferReportsList);
