import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import MainCard from "@src/views/Common/Cards/MainCard";
import { getLevelSummary, resetComponentStore } from "@src/actions/teamActions";
import PreLoader from "@src/views/Common/Loaders/PreLoader";
import AppBreadCrumb from "@src/views/Common/AppBreadCrumb";
import NoRecordFound from "@src/views/Common/NotFound/NoRecordFound";
import CustomDataTable from "@src/views/Common/DataTable/CustomDataTable";
import { getLevelTitle } from "@src/utils/levelHelper";
import { Button } from "react-bootstrap";

const LevelWiseTeam = ({
  loggedInUser,
  levelSummary,
  getLevelSummary,
  loadingLevelSummary,
  resetComponentStore,
  sortingParams,
}) => {
  const navigate = useNavigate();
  const [params, setParams] = React.useState({
    limit: 10,
    page: 1,
    orderBy: "level",
    ascending: "asc",
  });

  React.useEffect(() => {
    resetComponentStore();
    if (loggedInUser?._id) {
      getLevelSummary(loggedInUser._id);
    }
  }, [getLevelSummary, loggedInUser]);

  const columns = [
    {
      name: "SR.",
      cell: (row, index) => index + 1,
      sortable: false,
      minWidth: "50px",
      grow: 0.5,
    },
    {
      name: "Level",
      selector: (row) => getLevelTitle(row?.level),
      sortable: true,
      sortField: "level",
      minWidth: "150px",
      grow: 2,
    },
    {
      name: "Required Team",
      selector: (row) => row?.requireTeam,
      sortable: true,
      sortField: "requireTeam",
      minWidth: "150px",
      grow: 2,
    },
    {
      name: "Total Team",
      selector: (row) => row?.totalTeam,
      sortable: true,
      sortField: "totalTeam",
      minWidth: "150px",
      grow: 2,
    },
    {
      name: "Action",
      cell: (row) => (
        <Button
          className="theme_btn"
          onClick={() => navigate(`/user/level-wise-team/${row.level}`)}
          disabled={!row?.totalTeam}
        >
          Show Users
        </Button>
      ),
      sortable: false,
      minWidth: "150px",
      grow: 2,
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

  return (
    <Container>
      <Row>
        <AppBreadCrumb
          title="Level-Wise Team List"
          breadcrumbs={[
            { label: "Dashboard", link: "/user/dashboard" },
            { label: "Level-Wise Team List" },
          ]}
        />
      </Row>

      <Row>
        <Col md="12">
          {loadingLevelSummary ? (
            <PreLoader />
          ) : (
            <MainCard>
              {levelSummary?.length ? (
                <CustomDataTable
                  columns={columns}
                  data={levelSummary}
                  count={levelSummary.length}
                  params={params}
                  setParams={setParams}
                  pagination={false}
                  responsive
                  striped
                  progressPending={loadingLevelSummary}
                  highlightOnHover
                  persistTableHead
                  paginationServer
                  conditionalRowStyles={conditionalRowStyles}
                />
              ) : (
                <NoRecordFound />
              )}
            </MainCard>
          )}
        </Col>
      </Row>
    </Container>
  );
};

LevelWiseTeam.propTypes = {
  getLevelSummary: PropTypes.func.isRequired,
  loggedInUser: PropTypes.object,
  loadingLevelSummary: PropTypes.bool.isRequired,
  resetComponentStore: PropTypes.func.isRequired,
  levelSummary: PropTypes.array,
};

const mapStateToProps = (state) => ({
  levelSummary: state.team.levelSummary,
  loadingLevelSummary: state.team.loadingLevelSummary,
  loggedInUser: state.auth.user,
});

export default connect(mapStateToProps, {
  getLevelSummary,
  resetComponentStore,
})(LevelWiseTeam);
