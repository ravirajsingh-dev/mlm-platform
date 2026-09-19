import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import { connect } from "react-redux";
import moment from "moment";
import { getLevelTitle } from "@src/utils/levelHelper";
import CustomDataTable from "@src/views/Common/DataTable/CustomDataTable";
import MainCard from "@src/views/Common/Cards/MainCard";
import CopyIcon from "@src/views/Common/CopyIcon";
import { getLevelUsers } from "@src/actions/teamActions";
import PreLoader from "@src/views/Common/Loaders/PreLoader";
import { getUserStatus, formatIndianNumber } from "@src/utils/helper";

const ShowLevelWiseUsers = ({
  loggedInUser,
  getLevelUsers,
  loadingLevelUsers,
  levelUsers: { data, count },
}) => {
  const { level } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useState({
    limit: 20,
    page: 1,
    search: "",
  });
  const [users, setUsers] = useState([]);
  // const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchUsers = async () => {
      if (loggedInUser?._id) {
        const { data } = await getLevelUsers(loggedInUser._id, level, params);
        if (data) {
          setUsers(data.users);
          setTotal(data.total);
        }
      }
    };
    fetchUsers();
  }, [params, level, loggedInUser]);

  const columns = [
    {
      name: "SR.",
      cell: (row, index) => (params.page - 1) * params.limit + index + 1,
      width: "60px",
    },
    {
      name: "Status",
      selector: (row) => getUserStatus(row.status),
      sortable: true,
      sortField: "status",
      minWidth: "160px",
    },
    {
      name: "Name",
      selector: (row) => (
        <span>
          {row.EP_ID} <CopyIcon textToCopy={row.EP_ID} /> <br />
          {row.name} ({row.position === "left" ? "L" : "R"})
        </span>
      ),
      minWidth: "150px",
      grow: 2,
    },
    {
      name: "Achieved Level",
      selector: (row) => (
        <span>{`${getLevelTitle(row.user_level)} (${row.user_level})`}</span>
      ),
      minWidth: "150px",
      grow: 2,
    },
    {
      name: "Sponsor ID",
      selector: (row) =>
        row.sponsorEP ? (
          <>
            {row.sponsorEP} <CopyIcon textToCopy={row.sponsorEP} />
            <br />
            {row.sponsorName}
          </>
        ) : (
          "-"
        ),
      minWidth: "180px",
    },
    {
      name: "Upline EP",
      selector: (row) =>
        row.uplineEP ? (
          <>
            {row.uplineEP} <CopyIcon textToCopy={row.uplineEP} />
            <br />
            {row.uplineName}
          </>
        ) : (
          "-"
        ),
      minWidth: "180px",
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
      selector: (row) => moment(row.createdAt).format("MMM DD, YYYY, hh:mm a"),
      minWidth: "180px",
      // grow: 2,
    },
  ];

  // 🔴🟢 Conditional row styling
  const conditionalRowStyles = [
    {
      when: (row) => row.status === 3,
      style: {
        // backgroundColor: "#f8d7da",
        color: "#e7e7e7",
      },
    },
    {
      when: (row) => row.status === 2,
      style: {
        backgroundColor: "#f8d7da",
        color: "#dc3545",
      },
    },
    {
      when: (row) => row.status === 1,
      style: {
        backgroundColor: "#d4edda",
        color: "#155724",
      },
    },
  ];

  return (
    <Container>
      <div className="card-heading-unique">
        <div className="heading-underline">{`${getLevelTitle(
          level
        )} Team`}</div>
      </div>

      <Row>
        <Col md="12">
          <MainCard>
            {loadingLevelUsers ? (
              <PreLoader />
            ) : (
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
                progressPending={loadingLevelUsers}
                highlightOnHover
                searchable
                onSearch={(search) =>
                  setParams((prev) => ({ ...prev, search }))
                }
                conditionalRowStyles={conditionalRowStyles}
              />
            )}
          </MainCard>
        </Col>
      </Row>
    </Container>
  );
};

export default connect(
  (state) => ({
    loggedInUser: state.auth.user,
    loadingLevelUsers: state.team.loadingLevelUsers,
    levelUsers: state.team.levelUsers,
  }),
  { getLevelUsers }
)(ShowLevelWiseUsers);
