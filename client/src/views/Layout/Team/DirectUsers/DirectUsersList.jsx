import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import moment from "moment";
import CustomDataTable from "@src/views/Common/DataTable/CustomDataTable";
import MainCard from "@src/views/Common/Cards/MainCard";
import {
  getDirectDownlineList,
  resetComponentStore,
} from "@src/actions/teamActions";
import AppBreadCrumb from "@src/views/Common/AppBreadCrumb";
import PreLoader from "@src/views/Common/Loaders/PreLoader";
import CopyIcon from "@src/views/Common/CopyIcon";
import { getUserStatus, formatIndianNumber } from "@src/utils/helper";

const DirectUsersList = ({
  loggedInUser,
  directDownline: { data, count },
  getDirectDownlineList,
  loadingDirectDownline,
  resetComponentStore,
}) => {
  const [params, setParams] = React.useState({
    limit: 10,
    page: 1,
    orderBy: "createdAt",
    ascending: "desc",
    query: "",
    filters: [],
  });

  React.useEffect(() => {
    resetComponentStore();
    if (loggedInUser) {
      getDirectDownlineList(params, loggedInUser._id);
    }
  }, [params, loggedInUser]);

  React.useEffect(() => {
    console.log("loadingDirectDownline", loadingDirectDownline);
  }, [loadingDirectDownline]);

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
      minWidth: "160px",
      // grow: 1,
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
      cell: (row) => (
        <div className="multi-line-cell">
          <div className="name">{row.name}</div>
          {(row?.city || row?.state) && (
            <div className="location">
              {row?.city && `${row.city}${row?.state ? ", " : ""}`}
              {row?.state && row.state}
            </div>
          )}
        </div>
      ),
      sortable: true,
      sortField: "name",
      minWidth: "180px",
      grow: 2,
    },
    {
      name: "Phone",
      selector: (row) => (
        <span>
          {row.phone}
          <CopyIcon textToCopy={row.phone} />
        </span>
      ),
      sortable: true,
      sortField: "phone",
      minWidth: "150px",
      grow: 2,
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
      sortField: "uplineEP",
      minWidth: "100px",
      grow: 2,
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

  return (
    <Container>
      <Row>
        <AppBreadCrumb
          title="Direct Team List"
          breadcrumbs={[
            { label: "Dashboard", link: "/user/dashboard" },
            { label: "Direct Team List" },
          ]}
        />
      </Row>
      <Row>
        <Col md="12">
          {loadingDirectDownline ? (
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
                progressPending={loadingDirectDownline}
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

DirectUsersList.propTypes = {
  getDirectDownlineList: PropTypes.func.isRequired,
  loggedInUser: PropTypes.object,
  loadingDirectDownline: PropTypes.bool.isRequired,
  resetComponentStore: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  directDownline: state.team.directDownline,
  loadingDirectDownline: state.team.loadingDirectDownline,
  loggedInUser: state.auth.user,
});

export default connect(mapStateToProps, {
  getDirectDownlineList,
  resetComponentStore,
})(DirectUsersList);
