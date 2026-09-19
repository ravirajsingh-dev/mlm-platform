// src/views/User/Team/MyLegList.jsx
import React from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import moment from "moment";
import CustomDataTable from "@src/views/Common/DataTable/CustomDataTable";
import MainCard from "@src/views/Common/Cards/MainCard";
import { getMyLegList, resetComponentStore } from "@src/actions/teamActions";
import AppBreadCrumb from "@src/views/Common/AppBreadCrumb";
import PreLoader from "@src/views/Common/Loaders/PreLoader";
import { getLevelTitle } from "@src/utils/levelHelper";
import CopyIcon from "@src/views/Common/CopyIcon";
import { FaFilter } from "react-icons/fa";
import TeamListFilterModal from "./TeamListFilterModal";
import { getUserStatus, formatIndianNumber } from "@src/utils/helper";
import { useParams } from "react-router-dom";

const MyLegList = ({
  loggedInUser,
  myLegTeamList: { data, count },
  getMyLegList,
  loadingLegTeam,
  resetComponentStore,
}) => {
  const { position } = useParams(); // 'left' or 'right'
  const isLeft = position === "left";

  const [params, setParams] = React.useState({
    limit: 20,
    page: 1,
    orderBy: "createdAt",
    ascending: "desc",
    query: "",
    filters: [],
  });

  const [showFilterModal, setShowFilterModal] = React.useState(false);

  React.useEffect(() => {
    resetComponentStore();
    if (loggedInUser) {
      getMyLegList(params, loggedInUser._id, position);
    }
  }, [params, loggedInUser, position]);

  const columns = [
    {
      name: "SR.",
      cell: (row, index) => index + 1,
      sortable: false,
      minWidth: "50px",
    },
    {
      name: "Status",
      selector: (row) => getUserStatus(row.status),
      sortable: true,
      sortField: "status",
      minWidth: "160px",
    },
    {
      name: "EP ID",
      selector: (row) => (
        <span>
          {row.EP_ID}
          <CopyIcon textToCopy={row.EP_ID} />
        </span>
      ),
      sortable: true,
      sortField: "EP_ID",
      minWidth: "160px",
    },
    {
      name: "Name",
      selector: (row) => (
        <div className="multi-line-cell">
          <div>{row.name}</div>
          <div>
            {row.city}, {row.state}
          </div>
        </div>
      ),
      sortable: true,
      sortField: "name",
      minWidth: "180px",
    },
    {
      name: "Sponsor ID",
      selector: (row) => (
        <span>
          {row.sponsorEP}
          <CopyIcon textToCopy={row.sponsorEP} />
        </span>
      ),
      sortable: true,
      sortField: "sponsorEP",
      minWidth: "160px",
    },
    {
      name: "Upline ID",
      selector: (row) => (
        <span>
          {row.uplineEP}
          <CopyIcon textToCopy={row.uplineEP} />
        </span>
      ),
      sortable: true,
      sortField: "uplineEP",
      minWidth: "160px",
    },
    {
      name: "Level",
      selector: (row) => getLevelTitle(row.user_level),
      sortable: true,
      sortField: "user_level",
      minWidth: "160px",
    },
    {
      name: "E-Cash",
      selector: (row) => `₹ ${formatIndianNumber(row.e_cash || 0)}`,
      sortable: true,
      sortField: "e_cash",
      minWidth: "120px",
    },
    {
      name: "Joining Date",
      selector: (row) => moment(row.createdAt).format("MMM DD, YYYY, hh:mm a"),
      sortable: true,
      sortField: "createdAt",
      minWidth: "180px",
    },
  ];

  const conditionalRowStyles = [
    { when: (row) => row.status === 3, style: { color: "#0d3c00" } },
    {
      when: (row) => row.status === 2,
      style: { backgroundColor: "#f8d7da", color: "#dc3545" },
    },
    {
      when: (row) => row.status === 1,
      style: { backgroundColor: "#d4edda", color: "#155724" },
    },
  ];

  const handleApplyFilters = (filterValues) => {
    const filters = Object.entries(filterValues)
      .filter(([_, value]) => value)
      .map(([field, value]) => ({
        field,
        operator: ["EP_ID", "sponsorEP", "uplineEP"].includes(field)
          ? "regex"
          : "eq",
        value: value,
      }));

    setParams((prev) => ({ ...prev, page: 1, filters }));
    setShowFilterModal(false);
  };

  return (
    <Container>
      <Row>
        <AppBreadCrumb
          title={`My ${isLeft ? "Left" : "Right"} Team List`}
          breadcrumbs={[
            { label: "Dashboard", link: "/user/dashboard" },
            { label: `My ${isLeft ? "Left" : "Right"} Team List` },
          ]}
        />
      </Row>

      <Row className="mt-3">
        <Col className="text-center">
          <Button
            className="theme_btn btn btn-primary"
            onClick={() => setShowFilterModal(true)}
          >
            <FaFilter /> Filter
          </Button>
        </Col>
      </Row>

      <TeamListFilterModal
        show={showFilterModal}
        onHide={() => setShowFilterModal(false)}
        onApply={handleApplyFilters}
      />

      <Row>
        <Col md="12">
          {loadingLegTeam ? (
            <PreLoader />
          ) : (
            <MainCard>
              <CustomDataTable
                columns={columns}
                data={data}
                count={count}
                params={params}
                setParams={setParams}
                pagination
                responsive
                striped
                progressPending={loadingLegTeam}
                highlightOnHover
                persistTableHead
                paginationServer
                conditionalRowStyles={conditionalRowStyles}
              />
            </MainCard>
          )}
        </Col>
      </Row>
    </Container>
  );
};

MyLegList.propTypes = {
  getMyLegList: PropTypes.func.isRequired,
  loggedInUser: PropTypes.object,
  loadingLegTeam: PropTypes.bool.isRequired,
  resetComponentStore: PropTypes.func.isRequired,
  myLegTeamList: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
  myLegTeamList: state.team.myLegTeamList,
  loadingLegTeam: state.team.loadingLegTeam,
  loggedInUser: state.auth.user,
});

export default connect(mapStateToProps, {
  getMyLegList,
  resetComponentStore,
})(MyLegList);
