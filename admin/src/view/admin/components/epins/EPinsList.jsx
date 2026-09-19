import React from "react";
import { Button, Row, Col, Container } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { connect } from "react-redux";

// icons
import { VscEye } from "react-icons/vsc";
import { RiDeleteBin5Line } from "react-icons/ri";

// custom imports
import PiDataTable from "@src/view/commonComponents/dataTable/PiDataTable";
import AppBreadCrumb from "@src/view/commonComponents/dataTable/AppBreadCrumb";
import MainCard from "@src/view/commonComponents/mainCard/MainCard";

import { handleTableChange as handleTableChangeHelper } from "@utils/helper";

import {
  getEPinsList,
  resetComponentStore,
} from "@src/actions/adminEPinActions";

const EPinsList = ({
  loggedInUser,
  epinsList: { data, count },
  getEPinsList,
  loadingEPinList,
  resetComponentStore,
  sortingParams,
}) => {
  const [onlyOnce, setOnce] = React.useState(true);
  const [showModal, setShowModal] = React.useState(false);
  const [selectedEPin, setSelectedEPin] = React.useState(null);

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
      name: "EPin ID",
      selector: (row) => row.EPin_ID,
      sortable: false,
      sortField: "type",
      width: "35%",
      wrap: true,
    },
    {
      name: "User's EP ID",
      selector: (row) => <div>{row.EP_ID}</div>,
      sortable: false,
      sortField: "name",
      width: "35%",
      wrap: true,
    },
    {
      name: "Status",
      selector: (row) => (
        <div>{row.is_expired ? `Used By: ${row.used_by}` : "Unused"}</div>
      ),
      sortable: false,
      sortField: "name",
      width: "35%",
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

    getEPinsList(ePinParams);
  }, [getEPinsList, ePinParams, resetComponentStore, loggedInUser]);

  const searchFields = [
    { name: "providerName", type: "String" },
    { name: "balanceRange", type: "String" },
    { name: "bonus", type: "String" },
  ];

  const handleTableChange = (type, searchText) => {
    handleTableChangeHelper(
      type,
      searchText,
      sortingParams,
      setEPinParams,
      searchFields
    );
  };

  const onFilterChange = (newParams) => {
    setEPinParams((params) => ({ ...params, ...newParams }));
  };

  const handleConfirmDeletion = (txn_password) => {
    setShowModal(false);
  };

  const handleCreateEPinClick = (e) => {
    e.preventDefault();
    navigate("/admin/epins/create");
  };

  return (
    <Container>
      <AppBreadCrumb pageTitle="EP-Keys List" crumbs={[{ name: "EPins" }]} />

      <MainCard>
        <div className="table-filter-section mb-3">
          <Row className="d-flex justify-content-between">
            <Col md="4">
              <Button
                type="button"
                variant="primary"
                onClick={handleCreateEPinClick}
              >
                Create EPin
              </Button>
            </Col>
          </Row>
        </div>

        <PiDataTable
          columns={columns}
          data={data}
          count={count}
          params={ePinParams}
          setParams={setEPinParams}
          pagination
          responsive
          striped={true}
          progressPending={loadingEPinList}
          highlightOnHover
          persistTableHead={true}
          paginationServer
        />
      </MainCard>
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
  loggedInUser: state.adminAuth.admin,
});

export default connect(mapStateToProps, {
  getEPinsList,
  resetComponentStore,
})(EPinsList);
