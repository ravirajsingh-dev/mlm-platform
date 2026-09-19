import React from "react";
import { Dropdown, Row, Col, Container } from "react-bootstrap";

import * as Constants from "@src/constants/index";
import { PaginationControl } from "react-bootstrap-pagination-control";

const AppPagination = ({ params, setParams, count }) => {
  const { limit, page } = params;

  const onSizePerPageChange = (pageSize) => {
    setParams({
      ...params,
      page: 1,
      limit: pageSize,
    });
  };

  const setPage = (page) => {
    setParams({
      ...params,
      page,
    });
  };

  return (
    <Container className=" mt-4 ">
      <Row className="admin-pi-table-pagination p-2">
        <Col xs={12} md={6} className="d-flex align-items-center">
          <Dropdown>
            <span>Records per page: </span>
            <Dropdown.Toggle
              variant="outline-primary"
              size="sm"
              id="dropdown-basic"
              className="ms-2"
            >
              {limit}
            </Dropdown.Toggle>

            {/* <span className="ms-3">
              Showing {(page - 1) * limit + 1} to{" "}
              {page * limit > count ? count : page * limit} of {count} entries
            </span> */}

            <Dropdown.Menu>
              {Constants.PAGE_SIZE_OPTIONS.map((option, k) => (
                <React.Fragment key={k}>
                  <Dropdown.Item
                    key={option.text}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onSizePerPageChange(option.page);
                    }}
                  >
                    {option.text}
                  </Dropdown.Item>
                </React.Fragment>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        </Col>
        <Col className="admin-pi-table-pagination-controller">
          <PaginationControl
            page={page}
            between={2}
            total={count}
            limit={limit}
            changePage={(page) => {
              setPage(page);
            }}
            ellipsis={2}
            next={true}
            last={true}
          />
        </Col>
      </Row>
    </Container>
  );
};

export default AppPagination;
