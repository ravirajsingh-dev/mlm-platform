import React, { useEffect, useState } from "react";
import { Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { connect } from "react-redux";

// custom imports
import PiDataTable from "@src/view/commonComponents/dataTable/PiDataTable";
import {
  getDownlinePendingLinks,
  resetComponentStore,
} from "@src/actions/helpLinkActions";

import MainCard from "@src/view/commonComponents/mainCard/MainCard";

const DownlinePendingLinks = ({
  loggedInUser,
  downlinePendingLinks: { data, count },
  getDownlinePendingLinks,
  loadingDownlinePendingLinks,
  resetComponentStore,
  sortingParams,
}) => {
  const navigate = useNavigate();
  const [onlyOnce, setOnce] = useState(true);
  const { page, limit } = sortingParams;

  const initialSortingParams = {
    limit: 10,
    page: 1,
    orderBy: "createdAt",
    ascending: "desc",
    query: "",
    filters: [],
  };

  const [receivePaymentParams, setReceivePaymentParams] =
    useState(initialSortingParams);

  const columns = [
    {
      name: "Sender Name",
      selector: (row) =>
        row?.senderInfo?.EP_ID
          ? `${row?.senderInfo?.name} (${row?.senderInfo?.EP_ID})`
          : `Waiting for sender`,
      width: "20%",
      wrap: true,
    },
    {
      name: "Sender Phone",
      selector: (row) =>
        row?.senderInfo?.phone ? `${row?.senderInfo?.phone}` : `-`,
      width: "20%",
    },
    {
      name: "Payment Type",
      selector: (row) => row.payment_type,
      sortable: false,
      width: "20%",
    },
    {
      name: "Amount",
      selector: (row) => row.amount,
      sortable: false,
      width: "20%",
      wrap: true,
    },
    {
      name: "Status",
      selector: (row) => (
        <Badge pill bg={row?.status === "pending" ? "warning" : "success"}>
          {row?.status?.toUpperCase()}
        </Badge>
      ),
      width: "20%",
    },
  ];

  useEffect(() => {
    if (onlyOnce) {
      resetComponentStore();
      setOnce(false);
    }

    getDownlinePendingLinks(receivePaymentParams);
  }, [
    getDownlinePendingLinks,
    receivePaymentParams,
    resetComponentStore,
    loggedInUser,
  ]);

  return (
    <MainCard>
      <PiDataTable
        columns={columns}
        data={data}
        count={count}
        params={receivePaymentParams}
        setParams={setReceivePaymentParams}
        pagination
        responsive
        striped={true}
        progressPending={loadingDownlinePendingLinks}
        highlightOnHover
        persistTableHead={true}
        paginationServer
      />
    </MainCard>
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
