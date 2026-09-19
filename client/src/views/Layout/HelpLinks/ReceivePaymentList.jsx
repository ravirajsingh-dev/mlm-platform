import React, { useEffect, useState } from "react";
import { Container, Row, Col, Button, Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { FaFilter } from "react-icons/fa";
import moment from "moment";

import {
  getReceivePaymentLinksByUserID,
  resetComponentStore,
  updateReceivePaymentLinkStatus,
} from "@src/actions/helpLinkActions";
import CustomDataTable from "@src/views/Common/DataTable/CustomDataTable";
import MainCard from "@src/views/Common/Cards/MainCard";
import AppBreadCrumb from "@src/views/Common/AppBreadCrumb";
import ConfirmPopup from "@src/views/Common/Modal/ConfirmPopup";
import CopyIcon from "@src/views/Common/CopyIcon";
import ReceivePaymentFilterModal from "./ReceivePaymentFilterModal";

const ReceivePaymentList = ({
  loggedInUser,
  receiveHelpLinksList: { data, count },
  getReceivePaymentLinksByUserID,
  loadingReceiveHelpLinksList,
  resetComponentStore,
  updateReceivePaymentLinkStatus,
  loadingHelpLink,
}) => {
  const navigate = useNavigate();
  const [initialized, setInitialized] = useState(false);
  const [loadingBtn, setLoadingBtn] = useState({});
  const [confirmModal, setConfirmModal] = useState(false);
  const [modalData, setModalData] = useState({ index: "", key: "", id: "" });

  const [params, setParams] = useState({
    limit: 20,
    page: 1,
    orderBy: "updatedAt",
    ascending: "desc",
    query: "",
    filters: [],
  });

  const [showFilterModal, setShowFilterModal] = useState(false);

  useEffect(() => {
    if (!initialized) {
      resetComponentStore();
      setInitialized(true);
    }
    getReceivePaymentLinksByUserID(params);
  }, [params, initialized]);

  useEffect(() => {
    if (!data?.length) return;
    const btnLoadingObj = {};
    data.forEach((_, i) => {
      btnLoadingObj[`link-confirmed-${i}`] = false;
      btnLoadingObj[`link-cancelled-${i}`] = false;
    });
    setLoadingBtn(btnLoadingObj);
  }, [data]);

  const handleStatusUpdate = (key, id, index) => {
    setLoadingBtn((prev) => ({ ...prev, [`link-${key}-${index}`]: true }));
    updateReceivePaymentLinkStatus(id, key).finally(() => {
      setLoadingBtn((prev) => ({ ...prev, [`link-${key}-${index}`]: false }));
    });
  };

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
              <br />({row.senderInfo.EP_ID})
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
      grow: 2,
    },
    {
      name: "Help Type",
      selector: (row) => {
        if (row.payment_type === "Passive") return "Matching";
        if (row.payment_type === "Help") return "Social Help";
        return row.payment_type; // keep Direct / Upgrade as-is
      },
      sortable: true,
      sortField: "payment_type",
      minWidth: "160px",
      grow: 2,
    },
    {
      name: "Amount",
      selector: (row) => row.amount,
      sortable: true,
      sortField: "amount",
      minWidth: "160px",
      grow: 2,
    },

    {
      name: "Status",
      cell: (row, index) => {
        const isConfirmed = row.status === "completed";
        const isPending = row.status === "pending";

        return (
          <div className="d-flex gap-2">
            {isConfirmed && <Badge bg="success">Approved</Badge>}
            {isPending && <Badge bg="warning">Pending</Badge>}
          </div>
        );
      },
      minWidth: "160px",
      grow: 2,
    },
    {
      name: "Date",
      selector: (row) => row.createdAt,
      sortable: true,
      sortField: "createdAt",
      cell: (row) => moment(row.updatedAt).format("MMM DD, YYYY, hh:mm a"),
      minWidth: "160px",
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

  const handleApplyFilters = (filterValues) => {
    const filters = [];

    console.log("filterValues", filterValues);

    if (filterValues.paymentType) {
      filters.push({
        field: "payment_type",
        operator: "eq",
        value: filterValues.paymentType,
      });
    }

    if (filterValues.status) {
      filters.push({
        field: "status",
        operator: "eq",
        value: filterValues.status,
      });
    }

    if (filterValues.amount) {
      filters.push({
        field: "amount",
        operator: "eq",
        value: filterValues.amount,
      });
    }

    if (filterValues.senderEPID) {
      filters.push({
        field: "sender",
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
          title="Receiving Links"
          breadcrumbs={[
            { label: "Dashboard", link: "/user/dashboard" },
            { label: "Receiving Links" },
          ]}
        />
      </Row>

      <ConfirmPopup
        entity="Payment"
        modal={confirmModal}
        onYes={() => {
          setConfirmModal(false);
          handleStatusUpdate(modalData.key, modalData.id, modalData.index);
        }}
        onNo={() => setConfirmModal(false)}
        inputText={modalData.inputText}
      />

      <ReceivePaymentFilterModal
        show={showFilterModal}
        onHide={() => setShowFilterModal(false)}
        onApply={handleApplyFilters}
      />

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

      <Row>
        <Col md="12">
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
              progressPending={loadingReceiveHelpLinksList}
              noDataComponent={<div className="py-4">No records found</div>}
              conditionalRowStyles={conditionalRowStyles}
            />
          </MainCard>
        </Col>
      </Row>
    </Container>
  );
};

ReceivePaymentList.propTypes = {
  getReceivePaymentLinksByUserID: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  receiveHelpLinksList: state.helpLink.receiveHelpLinksList,
  loadingReceiveHelpLinksList: state.helpLink.loadingReceiveHelpLinksList,
  loadingHelpLink: state.helpLink.loadingHelpLink,
});

export default connect(mapStateToProps, {
  getReceivePaymentLinksByUserID,
  resetComponentStore,
  updateReceivePaymentLinkStatus,
})(ReceivePaymentList);
