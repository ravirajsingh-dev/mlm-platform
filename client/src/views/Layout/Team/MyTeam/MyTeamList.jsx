import React from "react";
import { Container, Row, Col, Button, Card } from "react-bootstrap";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import moment from "moment";
import CustomDataTable from "@src/views/Common/DataTable/CustomDataTable";
import MainCard from "@src/views/Common/Cards/MainCard";
import { getMyTeamList, resetComponentStore } from "@src/actions/teamActions";
import { getDashboardStash } from "@src/actions/commonActions";
import AppBreadCrumb from "@src/views/Common/AppBreadCrumb";
import PreLoader from "@src/views/Common/Loaders/PreLoader";
import { getLevelTitle } from "@src/utils/levelHelper";
import CopyIcon from "@src/views/Common/CopyIcon";
import { FaFilter } from "react-icons/fa";
import TeamListFilterModal from "./TeamListFilterModal";
import { getUserStatus, formatIndianNumber } from "@src/utils/helper";

const MyTeamList = ({
  loggedInUser,
  myTeamList: { data, count },
  getMyTeamList,
  loadingDownline,
  resetComponentStore,
  getDashboardStash,
  dashboardDetails: { teamSummary } = {},
}) => {
  const [params, setParamsState] = React.useState({
    limit: 20,
    page: 1,
    orderBy: "createdAt",
    ascending: "desc",
    query: "",
    filters: [],
  });

  const [showFilterModal, setShowFilterModal] = React.useState(false);

  // Wrapper to preserve filters when pagination/sorting changes
  // Only replace filters when explicitly provided in newParams
  const setParams = React.useCallback((newParams) => {
    setParamsState((prev) => {
      // If 'filters' key exists in newParams, use it (even if empty array = reset)
      // Otherwise, preserve existing filters to maintain filter state during pagination/sorting
      if ("filters" in newParams) {
        // Explicitly setting filters - replace completely
        return {
          ...prev,
          ...newParams,
          filters: Array.isArray(newParams.filters) ? newParams.filters : prev.filters,
        };
      } else {
        // No filters in newParams - preserve existing filters
        return {
          ...prev,
          ...newParams,
          // filters preserved from prev automatically via spread
        };
      }
    });
  }, []);

  React.useEffect(() => {
    resetComponentStore();
    if (loggedInUser) {
      getMyTeamList(params, loggedInUser._id);
    }
  }, [params, loggedInUser]);

  React.useEffect(() => {
    if (loggedInUser) {
      getDashboardStash(loggedInUser._id);
    }
  }, [getDashboardStash, loggedInUser]);

  const columns = [
    {
      name: "SR.",
      cell: (row, index) => index + 1,
      sortable: false,
      minWidth: "50px",
      grow: 0.5,
    },
    {
      name: "Status",
      selector: (row) => getUserStatus(row.status),
      sortable: true,
      sortField: "status",
      // minWidth: "160px",
      grow: 0.5,
    },
    {
      name: "Entered E-Pool",
      selector: (row) => (row.has_entered_e_pool ? "Yes" : "No"),
      sortable: true,
      sortField: "status",
      minWidth: "150px",
      grow: 1,
    },
    {
      name: "EP ID",
      selector: (row) => (
        <span>
          {row.EP_ID}
          <span> ({row.position === "left" ? "L" : "R"}) </span>
          <CopyIcon textToCopy={row.EP_ID} />
        </span>
      ),
      sortable: true,
      sortField: "EP_ID",
      minWidth: "160px",
      grow: 3,
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
      // grow: 2,
    },

    {
      name: "E-Cash",
      selector: (row) => `₹ ${formatIndianNumber(row.e_cash || 0)}`,
      sortable: true,
      sortField: "e_cash",
      minWidth: "120px",
    },

    {
      name: "E-Pool",
      selector: (row) => `₹ ${formatIndianNumber(row.e_pool || 0)}`,
      sortable: true,
      sortField: "e_pool",
      minWidth: "120px",
    },
    {
      name: "Level",
      selector: (row) => (
        <span>{`${getLevelTitle(row.user_level)} (${row.user_level})`}</span>
      ),
      sortable: true,
      sortField: "EP_ID",
      minWidth: "160px",
      // grow: 1,
    },
    {
      name: "Sponsor ID",
      selector: (row) => (
        <div className="multi-line-cell">
          {row.sponsorEP}
          <CopyIcon textToCopy={row.sponsorEP} />
          <div>{row.sponsorName}</div>
        </div>
      ),
      sortable: true,
      sortField: "EP_ID",
      minWidth: "160px",
      // grow: 2,
    },
    {
      name: "Upline ID",
      selector: (row) => (
        <div className="multi-line-cell">
          {row.uplineEP}
          <CopyIcon textToCopy={row.uplineEP} />
          <div>{row.uplineName}</div>
        </div>
      ),
      sortable: true,
      sortField: "EP_ID",
      minWidth: "160px",
      // grow: 2,
    },

    {
      name: "Joining Date",
      selector: (row) => row.createdAt,
      sortable: true,
      sortField: "createdAt",
      cell: (row) => moment(row.createdAt).format("MMM DD, YYYY, hh:mm a"),
      minWidth: "150px",
      grow: 2,
    },
  ];

  // 🔴🟢 Conditional row styling
  const conditionalRowStyles = [
    {
      when: (row) => row.status === 3,
      style: {
        backgroundColor: "#000000",
        color: "#e7e7e7",
      },
    },
    {
      when: (row) => row.status === 2,
      style: {
        backgroundColor: "#000000",
        color: "#dc3545",
      },
    },
    {
      when: (row) => row.status === 1,
      style: {
        backgroundColor: "#000000",
        color: "#ffe082",
      },
    },
  ];

  const handleApplyFilters = React.useCallback((filterValues) => {
    // If filterValues is empty object, reset all filters
    if (!filterValues || (typeof filterValues === "object" && Object.keys(filterValues).length === 0)) {
      setParams({
        page: 1,
        filters: [],
      });
      setShowFilterModal(false);
      return;
    }

    const filters = [];

    // Status filter
    if (filterValues.status && filterValues.status !== "") {
      if (filterValues.status === "1") {
        // Active: status = 1
        filters.push({
          field: "status",
          operator: "eq",
          value: 1,
        });
      } else if (filterValues.status === "inactive") {
        // Inactive: status IN [2, 3]
        filters.push({
          field: "status",
          operator: "in",
          value: [2, 3],
        });
      }
    }

    // Entered in E-Pool filter
    if (filterValues.has_entered_e_pool !== undefined && filterValues.has_entered_e_pool !== "") {
      const ePoolValue = filterValues.has_entered_e_pool === "true" || filterValues.has_entered_e_pool === true;
      filters.push({
        field: "has_entered_e_pool",
        operator: "eq",
        value: Boolean(ePoolValue),
      });
    }

    // EP ID filter - partial match, case-insensitive regex
    if (filterValues.EP_ID && typeof filterValues.EP_ID === "string" && filterValues.EP_ID.trim()) {
      filters.push({
        field: "EP_ID",
        operator: "regex",
        value: filterValues.EP_ID.trim(),
      });
    }

    // Sponsor EP filter - partial match, case-insensitive regex
    if (filterValues.sponsorEP && typeof filterValues.sponsorEP === "string" && filterValues.sponsorEP.trim()) {
      filters.push({
        field: "sponsorEP",
        operator: "regex",
        value: filterValues.sponsorEP.trim(),
      });
    }

    // Upline EP filter - partial match, case-insensitive regex
    if (filterValues.uplineEP && typeof filterValues.uplineEP === "string" && filterValues.uplineEP.trim()) {
      filters.push({
        field: "uplineEP",
        operator: "regex",
        value: filterValues.uplineEP.trim(),
      });
    }

    // Level filter - exact match
    if (filterValues.user_level && filterValues.user_level !== "") {
      const levelValue = parseInt(filterValues.user_level, 10);
      if (!isNaN(levelValue) && levelValue >= 0) {
        filters.push({
          field: "user_level",
          operator: "eq",
          value: levelValue,
        });
      }
    }

    // Date range filters - support single-sided ranges
    if (filterValues.fromDate && typeof filterValues.fromDate === "string") {
      // Parse YYYY-MM-DD string and get start of day in UTC
      const fromDateISO = moment.utc(filterValues.fromDate, "YYYY-MM-DD").startOf("day").toISOString();
      if (moment(fromDateISO).isValid()) {
        filters.push({
          field: "createdAt",
          operator: "gte",
          value: fromDateISO,
        });
      }
    }

    if (filterValues.toDate && typeof filterValues.toDate === "string") {
      // Parse YYYY-MM-DD string and get end of day in UTC
      const toDateISO = moment.utc(filterValues.toDate, "YYYY-MM-DD").endOf("day").toISOString();
      if (moment(toDateISO).isValid()) {
        filters.push({
          field: "createdAt",
          operator: "lte",
          value: toDateISO,
        });
      }
    }

    // Replace all filters and reset page to 1
    setParams({
      page: 1,
      filters,
    });
    setShowFilterModal(false);
  }, [setParams]);

  const handleStatClick = React.useCallback((filterType) => {
    const filters = [];

    switch (filterType) {
      case "totalActive":
        // Total Active: status = 1
        filters.push({
          field: "status",
          operator: "eq",
          value: 1,
        });
        break;
      case "inactive":
        // Inactive: status IN [2, 3]
        filters.push({
          field: "status",
          operator: "in",
          value: [2, 3],
        });
        break;
      case "totalLeft":
        // Total Left: leg = "left" AND status = 1
        filters.push({
          field: "leg",
          operator: "eq",
          value: "left",
        });
        filters.push({
          field: "status",
          operator: "eq",
          value: 1,
        });
        break;
      case "totalRight":
        // Total Right: leg = "right" AND status = 1
        filters.push({
          field: "leg",
          operator: "eq",
          value: "right",
        });
        filters.push({
          field: "status",
          operator: "eq",
          value: 1,
        });
        break;
      case "todayJoined":
        // Today Joined: createdAt >= startOfToday AND createdAt <= endOfToday (UTC)
        const startOfToday = moment.utc().startOf("day").toISOString();
        const endOfToday = moment.utc().endOf("day").toISOString();
        filters.push({
          field: "createdAt",
          operator: "gte",
          value: startOfToday,
        });
        filters.push({
          field: "createdAt",
          operator: "lte",
          value: endOfToday,
        });
        break;
      case "totalTeam":
      default:
        // Total Team: No filters (reset) - filters array stays empty
        break;
    }

    // Replace all filters completely (override modal filters) and reset page to 1
    setParams({
      page: 1,
      filters,
    });
  }, [setParams]);

  const teamSummaryData = [
    {
      value: `${formatIndianNumber(teamSummary?.totalTeam || 0)}`,
      label: "Total Team",
      filterType: "totalTeam",
    },
    {
      value: `${formatIndianNumber(teamSummary?.totalActive || 0)}`,
      label: "Total Active",
      filterType: "totalActive",
    },
    {
      value: `${formatIndianNumber(teamSummary?.todayJoined || 0)}`,
      label: "Today Joined",
      filterType: "todayJoined",
    },
    {
      value: `${formatIndianNumber(teamSummary?.totalInactive || 0)}`,
      label: "Inactive",
      filterType: "inactive",
    },
    {
      value: `${formatIndianNumber(teamSummary?.totalLeft || 0)}`,
      label: "Total Left",
      filterType: "totalLeft",
    },
    {
      value: `${formatIndianNumber(teamSummary?.totalRight || 0)}`,
      label: "Total Right",
      filterType: "totalRight",
    },
  ];

  return (
    <Container>
      <Row>
        <AppBreadCrumb
          title="My Team List"
          breadcrumbs={[
            { label: "Dashboard", link: "/user/dashboard" },
            { label: "My Team List" },
          ]}
        />
      </Row>

      <Row className="mt-3">
        <Col md="12">
          <Card className="stats-container">
            <div className="card-heading-unique">
              <div className="heading-underline">Team Section !</div>
            </div>
            <Row className="g-2">
              {teamSummaryData.map(({ value, label, filterType }, index) => {
                const isClickable = filterType !== "totalTeam";
                return (
                  <Col key={index} xs={6} md={3}>
                    <div
                      onClick={() => isClickable && handleStatClick(filterType)}
                      title={
                        isClickable ? `Click to filter by ${label}` : label
                      }
                      className="text-primary text-decoration-none"
                      style={{ cursor: isClickable ? "pointer" : "default" }}
                    >
                      <div className="stat-card">
                        <div className="stat-value">{value}</div>
                        <div className="stat-label">{label}</div>
                      </div>
                    </div>
                  </Col>
                );
              })}
            </Row>
          </Card>
        </Col>
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
          {loadingDownline ? (
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
                striped={true}
                progressPending={loadingDownline}
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

MyTeamList.propTypes = {
  getMyTeamList: PropTypes.func.isRequired,
  loggedInUser: PropTypes.object,
  loadingDownline: PropTypes.bool.isRequired,
  resetComponentStore: PropTypes.func.isRequired,
  getDashboardStash: PropTypes.func.isRequired,
  dashboardDetails: PropTypes.object,
};

const mapStateToProps = (state) => ({
  myTeamList: state.team.myTeamList,
  loadingDownline: state.team.loadingDownline,
  loggedInUser: state.auth.user,
  dashboardDetails: state.common.dashboardDetails,
});

export default connect(mapStateToProps, {
  getMyTeamList,
  resetComponentStore,
  getDashboardStash,
})(MyTeamList);
