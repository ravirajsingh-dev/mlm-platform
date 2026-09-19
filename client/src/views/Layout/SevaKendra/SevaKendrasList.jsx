import React from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import moment from "moment";
import CustomDataTable from "@src/views/Common/DataTable/CustomDataTable";
import MainCard from "@src/views/Common/Cards/MainCard";

import AppBreadCrumb from "@src/views/Common/AppBreadCrumb";
import PreLoader from "@src/views/Common/Loaders/PreLoader";
import { getLevelTitle } from "@src/utils/levelHelper";
import CopyIcon from "@src/views/Common/CopyIcon";
import { FaFilter } from "react-icons/fa";
import { getUserStatus } from "@src/utils/helper";
import { getSevaKendrasList } from "@src/actions/commonActions";

const SevaKendrasList = ({
  loggedInUser,
  sevaKendraList: { data, count },
  getSevaKendrasList,
  loadingSevaKendra,
}) => {
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
    // resetComponentStore();
    if (loggedInUser) {
      getSevaKendrasList();
    }
  }, [params, loggedInUser]);

  const columns = [
    {
      name: "SR.",
      cell: (row, index) => index + 1,
      sortable: false,
      minWidth: "50px",
      grow: 0.5,
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
      grow: 2,
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
      name: "Mobile No.",
      selector: (row) => (
        <span>
          {row.phone}
          <CopyIcon textToCopy={row.phone} />
        </span>
      ),
      sortable: true,
      sortField: "phone",
      minWidth: "160px",
      grow: 2,
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
      when: (row) => row.is_active === false,
      style: {
        backgroundColor: "#f8d7da",
        color: "#dc3545",
      },
    },
    {
      when: (row) => row.is_active === true,
      style: {
        backgroundColor: "#d4edda",
        color: "#155724",
      },
    },
  ];

  const handleApplyFilters = (filterValues) => {
    const filters = [];

    Object.entries(filterValues).forEach(([field, value]) => {
      if (value) {
        const isIdField = ["EP_ID", "sponsorEP", "uplineEP"].includes(field);

        filters.push({
          field,
          operator: isIdField ? "regex" : "eq",
          value: isIdField ? value : String(value),
        });
      }
    });

    setParams((prev) => ({
      ...prev,
      page: 1,
      filters,
    }));
    setShowFilterModal(false);
  };

  return (
    <Container>
      <Row>
        <AppBreadCrumb
          title="Seva Kendra List"
          breadcrumbs={[
            { label: "Dashboard", link: "/user/dashboard" },
            { label: "Seva Kendra List" },
          ]}
        />
      </Row>

      {/* <Row className="mt-3">
        <Col className="text-center">
          <Button
            className="theme_btn btn btn-primary"
            onClick={() => setShowFilterModal(true)}
          >
            <FaFilter /> Filter
          </Button>
        </Col>
      </Row> */}

      {/* <TeamListFilterModal
        show={showFilterModal}
        onHide={() => setShowFilterModal(false)}
        onApply={handleApplyFilters}
      /> */}

      <Row>
        <Col md="12">
          {loadingSevaKendra ? (
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
                progressPending={loadingSevaKendra}
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

SevaKendrasList.propTypes = {
  getSevaKendrasList: PropTypes.func.isRequired,
  loggedInUser: PropTypes.object,
  loadingSevaKendra: PropTypes.bool.isRequired,
};

const mapStateToProps = (state) => ({
  sevaKendraList: state.common.sevaKendraList,
  loadingSevaKendra: state.common.loadingSevaKendra,
  loggedInUser: state.auth.user,
});

export default connect(mapStateToProps, {
  getSevaKendrasList,
})(SevaKendrasList);
