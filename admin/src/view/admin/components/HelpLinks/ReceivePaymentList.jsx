import React from "react";
import { Button, Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { connect } from "react-redux";

// custom imports
import PiDataTable from "@src/view/commonComponents/dataTable/PiDataTable";

import {
  getReceivePaymentLinksByUserID,
  resetComponentStore,
  updateReceivePaymentLinkStatus,
} from "@src/actions/helpLinkActions";

import { handleTableChange as handleTableChangeHelper } from "@utils/helper";
import MainCard from "@src/view/commonComponents/mainCard/MainCard";
import ConfirmPopup from "@src/view/admin/modals/ConfirmPopup";

const ReceivePaymentList = ({
  loggedInUser,
  receiveHelpLinksList: { data, count },
  getReceivePaymentLinksByUserID,
  loadingReceiveHelpLinksList,
  resetComponentStore,
  sortingParams,
  updateReceivePaymentLinkStatus,
  loadingHelpLink,
}) => {
  const navigate = useNavigate();
  const [loadingBtn, setLoadingBtn] = React.useState({});
  const [onlyOnce, setOnce] = React.useState(true);
  const [showModal, setShowModal] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState(null);
  const { page, limit } = sortingParams;

  const initialSortingParams = {
    limit: 10,
    page: 1,
    orderBy: "createdAt",
    ascending: "desc",
    query: "",
    filters: [],
  };

  const [confirmModal, setConfirmModal] = React.useState(false);
  const [modalData, setModalData] = React.useState({
    index: "",
    key: "",
    id: "",
  });

  const [receivePaymentParams, setReceivePaymentParams] =
    React.useState(initialSortingParams);

  const onClickHandle = (key, id, index) => {
    loadingBtn[index] = true;
    setLoadingBtn({ ...loadingBtn });
    updateReceivePaymentLinkStatus(id, key).then((res) => {
      loadingBtn[index] = false;
      setLoadingBtn({ ...loadingBtn });
    });
  };

  React.useEffect(() => {
    if (!data?.length) return;
    const btnLoadingObj = {};
    data.forEach((list, i) => {
      btnLoadingObj[`link-confirmed-${i}`] = false;
      btnLoadingObj[`link-cancelled-${i}`] = false;
    });

    setLoadingBtn(btnLoadingObj);
  }, [data]);

  const onClickApprove = (key, id, index) => {
    setModalData({
      key,
      id,
      index,
    });
    setConfirmModal(true);
  };

  const columns = [
    {
      name: "Sender Name",
      selector: (row) =>
        row?.senderInfo?.EP_ID
          ? `${row?.senderInfo?.name} (${row?.senderInfo?.EP_ID})`
          : `Waiting for sender`,
      width: "15%",
      wrap: true,
    },
    {
      name: "Sender Phone",
      selector: (row) =>
        row?.senderInfo?.phone ? `${row?.senderInfo?.phone}` : `-`,
      width: "10%",
    },
    {
      name: "Receiver Name",
      selector: (row) =>
        row?.receiverInfo?.EP_ID
          ? `${row?.receiverInfo?.name} (${row?.receiverInfo?.EP_ID})`
          : `Waiting for sender`,
      width: "10%",
      wrap: true,
    },
    {
      name: "Receiver Phone",
      selector: (row) =>
        row?.receiverInfo?.phone ? `${row?.receiverInfo?.phone}` : `-`,
      width: "15%",
    },
    {
      name: "Payment Type",
      selector: (row) => row.payment_type,
      sortable: false,
      width: "10%",
    },
    {
      name: "Amount",
      selector: (row) => row.amount,
      sortable: false,
      width: "10%",
      wrap: true,
    },
    {
      name: "Status",
      selector: (row) => (
        <Badge pill bg={row?.status === "pending" ? "warning" : "success"}>
          {row?.status?.toUpperCase()}
        </Badge>
      ),
      width: "10%",
    },
    {
      name: "Actions",
      width: "20%",
      cell: (row, i) => (
        <div className="d-flex status-view-action">
          {row.sender_status === "pending" ? (
            <>
              <Button className="ml-2" size="sm" variant="warning">
                Pending
              </Button>
            </>
          ) : null}
          {row.sender_status === "paid" && row.receiver_status === "pending" ? (
            <>
              <Button
                className="me-2"
                size="sm"
                onClick={() => {
                  onClickApprove("confirmed", row._id, `link-confirmed-${i}`);
                }}
                disabled={
                  loadingBtn[`link-confirmed-${i}`] ||
                  loadingBtn[`link-cancelled-${i}`]
                }
              >
                {loadingBtn[`link-confirmed-${i}`] ? "Approving..." : "Approve"}
              </Button>

              <Button
                variant="danger"
                className="ml-2"
                size="sm"
                onClick={() => {
                  onClickHandle("cancelled", row._id, `link-cancelled-${i}`);
                }}
                disabled={
                  loadingBtn[`link-confirmed-${i}`] ||
                  loadingBtn[`link-cancelled-${i}`]
                }
              >
                {loadingBtn[`link-cancelled-${i}`] ? "Cancelling..." : "Cancel"}
              </Button>
            </>
          ) : null}

          {row.receiver_status === "confirmed" ? (
            <Button variant="success" className="ml-2" size="sm" disabled>
              Approved
            </Button>
          ) : row.receiver_status === "cancelled" ? (
            <Button variant="danger" className="ml-2" size="sm" disabled>
              Cancelled
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  React.useEffect(() => {
    if (onlyOnce) {
      resetComponentStore();
      setOnce(false);
    }

    getReceivePaymentLinksByUserID(receivePaymentParams);
  }, [
    getReceivePaymentLinksByUserID,
    receivePaymentParams,
    resetComponentStore,
    loggedInUser,
  ]);

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
      setReceivePaymentParams,
      searchFields
    );
  };

  const onFilterChange = (newParams) => {
    setReceivePaymentParams((params) => ({ ...params, ...newParams }));
  };

  const isDisabled = !loggedInUser || !loggedInUser.txn_password;

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedItem(null);
  };

  return (
    <MainCard>
      <ConfirmPopup
        entity="Payment"
        modal={confirmModal}
        name=""
        onYes={() => {
          setConfirmModal(false);
          onClickHandle(modalData?.key, modalData?.id, modalData?.index);
        }}
        onNo={() => {
          setConfirmModal(false);
          setModalData({
            key: "",
            id: "",
            index: "",
          });
        }}
        inputText="Approve"
      />
      <PiDataTable
        columns={columns}
        data={data}
        count={count}
        params={receivePaymentParams}
        setParams={setReceivePaymentParams}
        pagination
        responsive
        striped={true}
        progressPending={loadingReceiveHelpLinksList}
        highlightOnHover
        persistTableHead={true}
        paginationServer
      />
    </MainCard>
  );
};

ReceivePaymentList.propTypes = {
  getReceivePaymentLinksByUserID: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  receiveHelpLinksList: state.helpLink.receiveHelpLinksList,
  loadingReceiveHelpLinksList: state.helpLink.loadingReceiveHelpLinksList,
  sortingParams: state.helpLink.sortingParams,
  loggedInUser: state.auth.user,
  loadingHelpLink: state.helpLink.loadingHelpLink,
});

export default connect(mapStateToProps, {
  getReceivePaymentLinksByUserID,
  resetComponentStore,
  updateReceivePaymentLinkStatus,
})(ReceivePaymentList);
