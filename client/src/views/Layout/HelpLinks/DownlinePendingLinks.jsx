import React, { useEffect, useState } from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Badge } from "react-bootstrap";
import { FaFilter } from "react-icons/fa";
import DownlinePendingFilterModal from "./DownlinePendingFilterModal";

// custom imports
import {
  getDownlinePendingLinks,
  resetComponentStore,
} from "@src/actions/helpLinkActions";
import MainCard from "@src/views/Common/Cards/MainCard";
import CustomDataTable from "@src/views/Common/DataTable/CustomDataTable";
import AppBreadCrumb from "@src/views/Common/AppBreadCrumb";
import CopyIcon from "@src/views/Common/CopyIcon";
import PreLoader from "@src/views/Common/Loaders/PreLoader";

const DownlinePendingLinks = ({
  loggedInUser,
  downlinePendingLinks: { data, count },
  getDownlinePendingLinks,
  loadingDownlinePendingLinks,
  resetComponentStore,
  sortingParams,
}) => {
  const navigate = useNavigate();
  const [initialized, setInitialized] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const [params, setParams] = useState({
    limit: 20,
    page: 1,
    orderBy: "createdAt",
    ascending: "desc",
    query: "",
    filters: [],
  });

  useEffect(() => {
    if (!initialized) {
      resetComponentStore();
      setInitialized(true);
    }
    getDownlinePendingLinks(params);
  }, [params, initialized]);

  const columns = [
    {
      name: "SR.",
      cell: (row, index) => (params.page - 1) * params.limit + index + 1,
      sortable: false,
      width: "60px",
    },
    {
      name: "Sender Name",
      selector: (row) => (
        <span>
          {row.senderInfo?.name || "Sender Not Assigned"}
          {row.senderInfo?.EP_ID && (
            <>
              <br />
              {row.senderInfo.EP_ID}
              <CopyIcon textToCopy={row.senderInfo.EP_ID} />
            </>
          )}
        </span>
      ),
      sortable: true,
      sortField: "senderInfo.name",
      minWidth: "160px",
      grow: 2,
    },
    {
      name: "Sender Phone",
      selector: (row) => (
        <span>
          {row.senderInfo?.phone || "-"}
          {row.senderInfo?.phone && (
            <CopyIcon textToCopy={row.senderInfo.phone} />
          )}
        </span>
      ),
      sortable: true,
      sortField: "senderInfo.phone",
      minWidth: "160px",
    },
    {
      name: "Help Type",
      selector: (row) => row.payment_type,
      sortable: true,
      sortField: "payment_type",
      minWidth: "160px",
    },
    {
      name: "Amount",
      selector: (row) => row.amount,
      sortable: true,
      sortField: "amount",
      minWidth: "160px",
    },
    {
      name: "Status",
      selector: (row) => (
        <Badge bg={row.sender_status === "pending" ? "warning" : "success"}>
          {row.sender_status.toUpperCase()}
        </Badge>
      ),
      sortable: true,
      sortField: "sender_status",
      minWidth: "160px",
    },
  ];

  // 🔴🟢 Conditional row styling
  const conditionalRowStyles = [
    {
      when: (row) => row.status === 3,
      style: {
        backgroundColor: "#000000",
        color: "#0d3c00",
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

  const handleApplyFilters = (filterValues) => {
    const filters = [];

    if (filterValues.paymentType) {
      filters.push({
        field: "payment_type",
        operator: "eq",
        value: filterValues.paymentType,
      });
    }

    if (filterValues.senderEPID) {
      filters.push({
        field: "EP_ID",
        operator: "eq",
        value: filterValues.senderEPID,
      });
    }

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
          title="Downline Pending Links"
          breadcrumbs={[
            { label: "Dashboard", link: "/user/dashboard" },
            { label: "Downline Pending Links" },
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

      <DownlinePendingFilterModal
        show={showFilterModal}
        onHide={() => setShowFilterModal(false)}
        onApply={handleApplyFilters}
      />
      <Row>
        <Col md="12">
          {loadingDownlinePendingLinks ? (
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
                paginationServer
                responsive
                striped
                highlightOnHover
                persistTableHead
                progressPending={loadingDownlinePendingLinks}
              />
            </MainCard>
          )}
        </Col>
      </Row>
    </Container>
  );
};

DownlinePendingLinks.propTypes = {
  getDownlinePendingLinks: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  downlinePendingLinks: state.helpLink.downlinePendingLinks,
  loadingDownlinePendingLinks: state.helpLink.loadingDownlinePendingLinks,
  sortingParams: state.helpLink.sortingParams,
  loggedInUser: state.auth.user,
});

export default connect(mapStateToProps, {
  getDownlinePendingLinks,
  resetComponentStore,
})(DownlinePendingLinks);
