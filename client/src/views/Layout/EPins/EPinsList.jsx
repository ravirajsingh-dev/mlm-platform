import React from "react";
import { Button, Row, Col, Container, Badge, Card } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import moment from "moment";

// Custom Imports
import AppBreadCrumb from "@src/views/Common/AppBreadCrumb";
import MainCard from "@src/views/Common/Cards/MainCard";
import { getEPinsList, resetComponentStore } from "@src/actions/ePinActions";
import PreLoader from "@src/views/Common/Loaders/PreLoader";
import CustomDataTable from "@src/views/Common/DataTable/CustomDataTable";
import CopyIcon from "@src/views/Common/CopyIcon";
import NoRecordFound from "@src/views/Common/NotFound/NoRecordFound";
import { handleTableChange as handleTableChangeHelper } from "@utils/helper";

const EPinsList = ({
  loggedInUser,
  epinsList: { data, count, total, used, unused },
  getEPinsList,
  loadingEPinList,
  resetComponentStore,
  sortingParams,
}) => {
  const [onlyOnce, setOnce] = React.useState(true);
  const navigate = useNavigate();

  const initialSortingParams = {
    limit: 20,
    page: 1,
    orderBy: "createdAt",
    ascending: "desc",
    query: "",
    filters: [],
  };

  const [ePinParams, setEPinParams] = React.useState(initialSortingParams);
  const [activeFilter, setActiveFilter] = React.useState(null); // null, 'used', or 'unused'

  React.useEffect(() => {
    if (onlyOnce) {
      resetComponentStore();
      setOnce(false);
    }
    if (!loggedInUser) return;
    getEPinsList(ePinParams);
  }, [ePinParams, resetComponentStore, loggedInUser]);

  // Define columns for the data table
  const columns = [
    {
      name: "SR.",
      cell: (row, index) =>
        (ePinParams.page - 1) * ePinParams.limit + index + 1,
      sortable: false,
      width: "60px",
    },
    {
      name: "EPin ID",
      selector: (row) => (
        <span>
          {row.EPin_ID}
          {!row.is_expired && <CopyIcon textToCopy={row.EPin_ID} />}
        </span>
      ),
      sortable: true,
      sortField: "EPin_ID",
    },
    {
      name: "Status",
      selector: (row) =>
        row.is_expired ? (
          <Badge bg="secondary">Used By: {row.used_by}</Badge>
        ) : (
          <Badge bg="success">Unused</Badge>
        ),
      sortable: true,
      sortField: "is_expired",
    },
    {
      name: "Created At",
      selector: (row) => moment(row.createdAt).format("DD MMM YYYY, hh:mm A"),
      sortable: true,
      sortField: "createdAt",
    },
  ];

  // 🔴🟢 Conditional row styling
  const conditionalRowStyles = [
    {
      when: (row) => row.is_expired === true,
      style: {
        backgroundColor: "#000000",
        color: "#dc3545",
      },
    },
    {
      when: (row) => row.is_expired === false,
      style: {
        backgroundColor: "#000000",
        color: "#ffe082",
      },
    },
  ];

  const handleTransferEPinClick = (e) => {
    e.preventDefault();
    navigate("/user/epins/transfer");
  };

  const handleFilterClick = (filterType) => {
    // If clicking the same filter, reset to show all
    if (activeFilter === filterType) {
      setActiveFilter(null);
      setEPinParams((prev) => ({
        ...prev,
        page: 1,
        filters: [],
      }));
    } else {
      // Apply the selected filter
      setActiveFilter(filterType);
      const filters = [
        {
          field: "is_expired",
          operator: "eq",
          value: filterType === "used" ? true : false,
        },
      ];
      setEPinParams((prev) => ({
        ...prev,
        page: 1,
        filters,
      }));
    }
  };

  return (
    <Container>
      <Row>
        <AppBreadCrumb
          title="EP-Keys List"
          breadcrumbs={[
            { label: "Dashboard", link: "/user/dashboard" },
            { label: "EP-Keys" },
          ]}
        />

        <Card className="stats-container">
          <Row className="g-2">
            <Col xs={4}>
              <div className="stat-card">
                <div className="stat-value">{total}</div>
                <div className="stat-label">Total</div>
              </div>
            </Col>
            <Col xs={4}>
              <div
                className={`stat-card ${
                  activeFilter === "used" ? "active" : ""
                }`}
                onClick={() => handleFilterClick("used")}
                style={{ cursor: "pointer" }}
              >
                <div className="stat-value">{used}</div>
                <div className="stat-label">Used</div>
              </div>
            </Col>
            <Col xs={4}>
              <div
                className={`stat-card ${
                  activeFilter === "unused" ? "active" : ""
                }`}
                onClick={() => handleFilterClick("unused")}
                style={{ cursor: "pointer" }}
              >
                <div className="stat-value">{unused}</div>
                <div className="stat-label">Unused</div>
              </div>
            </Col>
          </Row>
        </Card>

        <Row className="mb-3">
          <Col className="d-flex justify-content-center">
            <Button
              type="button"
              className="common_btn"
              onClick={handleTransferEPinClick}
            >
              Transfer EP-Keys
            </Button>
          </Col>
        </Row>
      </Row>

      <Row>
        <Col md="12">
          {loadingEPinList ? (
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
                progressPending={loadingEPinList}
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

EPinsList.propTypes = {
  getEPinsList: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  epinsList: state.epin.epinsList,
  loadingEPinList: state.epin.loadingEPinList,
  sortingParams: state.epin.sortingParams,
  loggedInUser: state.auth.user,
});

export default connect(mapStateToProps, {
  getEPinsList,
  resetComponentStore,
})(EPinsList);
