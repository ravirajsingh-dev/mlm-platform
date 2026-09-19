import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Badge } from "react-bootstrap";

// custom imports
import AppBreadCrumb from "@src/views/Common/AppBreadCrumb";
import MainCard from "@src/views/Common/Cards/MainCard";
import { capitalizeFirst } from "@utils/helper";
import {
  getEPinTransferReport,
  resetComponentStore,
} from "@src/actions/ePinActions";
import PreLoader from "@src/views/Common/Loaders/PreLoader";
import CustomDataTable from "@src/views/Common/DataTable/CustomDataTable";
import NoRecordFound from "@src/views/Common/NotFound/NoRecordFound";
import CopyIcon from "@src/views/Common/CopyIcon";

const EPinTransferReportsList = ({
  loggedInUser,
  epinTransferReportsList: { data, count },
  getEPinTransferReport,
  loadingEPinTransferReportList,
  resetComponentStore,
  sortingParams,
}) => {
  const [onlyOnce, setOnce] = React.useState(true);
  const initialSortingParams = {
    limit: 10,
    page: 1,
    orderBy: "createdAt",
    ascending: "desc",
    query: "",
    filters: [],
  };

  const [ePinParams, setEPinParams] = React.useState(initialSortingParams);
  const navigate = useNavigate();

  const columns = [
    {
      name: "SR.",
      cell: (row, index) =>
        (ePinParams.page - 1) * ePinParams.limit + index + 1,
      sortable: false,
      width: "60px",
    },
    {
      name: "Plan",
      selector: (row) => "EP-Key",
      sortable: false,
      minWidth: "160px",
    },
    {
      name: "Quantity",
      selector: (row) => row.quantity,
      sortable: false,
      minWidth: "160px",
    },
    {
      name: "Transfer By",
      selector: (row) => (
        <div className="multi-line-cell">
          {row.transferredBy}
          <CopyIcon textToCopy={row.transferredBy} />
          <div>{row.transferredByName}</div>
        </div>
      ),
      sortable: false,
      minWidth: "160px",
    },
    {
      name: "Transfer To",
      selector: (row) => (
        <div className="multi-line-cell">
          {row.transferredTo}
          <CopyIcon textToCopy={row.transferredTo} />
          <div>{row.transferredToName}</div>
        </div>
      ),
      sortable: false,
      minWidth: "160px",
    },
    {
      name: "Status",
      selector: (row) => (
        <Badge bg="success">{capitalizeFirst(row.status)}</Badge>
      ),
      sortable: false,
      minWidth: "160px",
    },
    {
      name: "Date",
      cell: (row) => moment(row.createdAt).format("MMM DD, YYYY, hh:mm a"),
      sortable: false,
      minWidth: "160px",
    },
  ];

  // 🔴🟢 Conditional row styling
  const conditionalRowStyles = [
    {
      when: (row) => true,
      style: {
        backgroundColor: "#000000",
        color: "#ffe082",
      },
    },
  ];

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
      <Row>
        <AppBreadCrumb
          title="EP-Keys List"
          breadcrumbs={[
            { label: "Dashboard", link: "/user/dashboard" },
            { label: "EP-Key Transfer Reports" },
          ]}
        />
      </Row>

      <Row>
        <Col md="12">
          {loadingEPinTransferReportList ? (
            <PreLoader />
          ) : (
            <MainCard>
              <CustomDataTable
                columns={columns}
                data={data}
                count={count}
                params={ePinParams}
                setParams={setEPinParams}
                pagination
                paginationServer
                responsive
                striped
                highlightOnHover
                persistTableHead
                progressPending={loadingEPinTransferReportList}
                noDataComponent={<NoRecordFound />}
                conditionalRowStyles={conditionalRowStyles}
              />
            </MainCard>
          )}
        </Col>
      </Row>
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
  loggedInUser: state.auth.user,
});

export default connect(mapStateToProps, {
  getEPinTransferReport,
  resetComponentStore,
})(EPinTransferReportsList);
