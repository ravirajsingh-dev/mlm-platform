import React from "react";
import { Container, Row, Col, Button, Badge, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { FaFilter } from "react-icons/fa";
import moment from "moment";

import {
  getSendPaymentLinksByUserID,
  resetComponentStore,
  editHelpLink,
} from "@src/actions/helpLinkActions";

import { handleTableChange as handleTableChangeHelper } from "@utils/helper";
import MainCard from "@src/views/Common/Cards/MainCard";
import AppBreadCrumb from "@src/views/Common/AppBreadCrumb";
import ConfirmModal from "@src/views/Common/Modal/ConfirmModal";
import NoRecordFound from "@src/views/Common/NotFound/NoRecordFound";
import CustomDataTable from "@src/views/Common/DataTable/CustomDataTable";
import CopyIcon from "@src/views/Common/CopyIcon";
import SendingPaymentFilterModal from "./SendingPaymentFilterModal";
import PreLoader from "@src/views/Common/Loaders/PreLoader";

const SendingPayments = ({
  loggedInUser,
  sendHelpLinksList: { data, count },
  getSendPaymentLinksByUserID,
  loadingSendHelpLinksList,
  resetComponentStore,
  sortingParams,
  editHelpLink,
}) => {
  const navigate = useNavigate();
  const [onlyOnce, setOnce] = React.useState(true);
  const [showConfirmModal, setShowConfirmModal] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState(null);
  const [showFilterModal, setShowFilterModal] = React.useState(false);

  const initialSortingParams = {
    limit: 20,
    page: 1,
    orderBy: "updatedAt",
    ascending: "desc",
    query: "",
    filters: [],
  };

  const [params, setParams] = React.useState(initialSortingParams);

  React.useEffect(() => {
    if (onlyOnce) {
      resetComponentStore();
      setOnce(false);
    }

    if (!loggedInUser) return;

    getSendPaymentLinksByUserID(params, loggedInUser._id);
  }, [getSendPaymentLinksByUserID, params, resetComponentStore, loggedInUser]);

  const handleApplyFilters = (filterValues) => {
    const filters = [];

    if (filterValues.paymentType) {
      filters.push({
        field: "payment_type",
        operator: "eq",
        value: filterValues.paymentType,
      });
    }

    if (filterValues.status) {
      filters.push({
        field: "sender_status",
        operator: "eq",
        value: filterValues.status,
      });
    }

    if (filterValues.level) {
      filters.push({
        field: "payment_for_level",
        operator: "eq",
        value: filterValues.level,
      });
    }

    if (filterValues.receiverEPID) {
      filters.push({
        field: "receiver",
        operator: "eq",
        value: filterValues.receiverEPID,
      });
    }

    setParams((prev) => ({
      ...prev,
      page: 1,
      filters,
    }));

    setShowFilterModal(false);
  };

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
      setParams,
      searchFields
    );
  };

  const onFilterChange = (newParams) => {
    setParams((params) => ({ ...params, ...newParams }));
  };

  const handleConfirmModalClose = () => {
    setShowConfirmModal(false);
    setSelectedItem(null);
  };

  const handleConfirmModalSubmit = () => {
    if (selectedItem) {
      handleFormSubmit(selectedItem._id);
      setShowConfirmModal(false);
    }
  };

  const handleFormSubmit = async (id) => {
    editHelpLink(id, loggedInUser._id).then((res) => {
      handleConfirmModalClose();
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
      name: "Receiver Name",
      selector: (row) => (
        <span>
          {row?.receiverInfo?.name || "ADMIN"}
          {row?.receiverInfo?.EP_ID && (
            <>
              <br />({row.receiverInfo.EP_ID})
              <CopyIcon textToCopy={row.receiverInfo.EP_ID} />
            </>
          )}
        </span>
      ),
      sortable: true,
      sortField: "receiverInfo.name",
      minWidth: "160px",
      grow: 2,
    },
    {
      name: "Receiver Phone",
      selector: (row) => (
        <span>
          {row?.receiverInfo?.phone || "-"}
          {row?.receiverInfo?.phone && (
            <CopyIcon textToCopy={row.receiverInfo.phone} />
          )}
        </span>
      ),
      sortable: true,
      sortField: "receiverInfo.phone",
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
    },
    // {
    //   name: "Actions",
    //   cell: (row) => (
    //     <div className="d-flex gap-2">
    //       {row.sender_status === "paid" && (
    //         <>
    //           {row.status === "completed" ? (
    //             <Badge bg="success">Paid</Badge>
    //           ) : (
    //             <Badge bg="secondary">Paid</Badge>
    //           )}
    //           {row.receiver_status === "pending" && (
    //             <span className="ms-2">Approval Pending</span>
    //           )}
    //         </>
    //       )}
    //     </div>
    //   ),
    // },
    {
      name: "Date",
      selector: (row) => row.updatedAt,
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

  return (
    <Container>
      <ConfirmModal
        show={showConfirmModal}
        handleClose={handleConfirmModalClose}
        handleConfirm={handleConfirmModalSubmit}
        title="Confirm Payment"
        body={
          <Alert key={"danger"} variant={"danger"}>
            An amount of {selectedItem?.amount} will be deducted from your
            wallet and sent to{" "}
            {selectedItem?.payment_type !== "Help"
              ? selectedItem?.receiverInfo?.name
              : "Admin"}
            's wallet. Are you sure you want to proceed?
          </Alert>
        }
        submitBtnText="Confirm Payment"
      />

      <SendingPaymentFilterModal
        show={showFilterModal}
        onHide={() => setShowFilterModal(false)}
        onApply={handleApplyFilters}
      />

      <Row>
        <AppBreadCrumb
          title="Sending Links"
          breadcrumbs={[
            { label: "Dashboard", link: "/user/dashboard" },
            { label: "Sending Links" },
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

      <Row>
        <Col md="12">
          {loadingSendHelpLinksList ? (
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
                progressPending={loadingSendHelpLinksList}
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

SendingPayments.propTypes = {
  getSendPaymentLinksByUserID: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  sendHelpLinksList: state.helpLink.sendHelpLinksList,
  loadingSendHelpLinksList: state.helpLink.loadingSendHelpLinksList,
  sortingParams: state.helpLink.sortingParams,
  loggedInUser: state.auth.user,
});

export default connect(mapStateToProps, {
  getSendPaymentLinksByUserID,
  resetComponentStore,
  editHelpLink,
})(SendingPayments);
