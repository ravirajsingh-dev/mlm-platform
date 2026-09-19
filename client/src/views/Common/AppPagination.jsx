import React from "react";
import { Dropdown } from "react-bootstrap";
import * as Constants from "@src/constants/index";
import {
  MdOutlineKeyboardDoubleArrowLeft,
  MdOutlineKeyboardDoubleArrowRight,
} from "react-icons/md";

const AppPagination = ({ params, setParams, count }) => {
  const { limit, page } = params;
  const totalPages = Math.max(1, Math.ceil(count / limit || 1));

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

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="basic-pagination d-flex-s-between row">
      <div className="col-12 d-flex">
        <div className="me-3 aling-center">
          <p>Records per page: </p>
          <Dropdown>
            <Dropdown.Toggle className="dropdown-btn">{limit}</Dropdown.Toggle>
            <Dropdown.Menu>
              {Constants.PAGE_SIZE_OPTIONS.map((option, k) => (
                <Dropdown.Item
                  key={k}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSizePerPageChange(option.page);
                  }}
                >
                  {option.text}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        </div>
        <p className="aling-center">
          {`Showing ${count === 0 ? 0 : (page - 1) * limit + 1} – ${
            page * limit > count ? count : page * limit
          } of ${count} results`}
        </p>
      </div>

      <div className="col-xs-12 col-lg-6 aling-center mt-20">
        <ul className="page-numbers">
          <li>
            <button
              className={`prev page-numbers ${page === 1 ? "disabled" : ""}`}
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              <MdOutlineKeyboardDoubleArrowLeft />
            </button>
          </li>
          {getPageNumbers().map((p, index) => (
            <li key={index}>
              {p === "..." ? (
                <span className="page-numbers">{p}</span>
              ) : (
                <button
                  className={`page-numbers ${p === page ? "current" : ""}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              )}
            </li>
          ))}
          <li>
            <button
              className={`next page-numbers ${
                page === totalPages ? "disabled" : ""
              }`}
              onClick={() => setPage(Math.min(page + 1, totalPages))}
              disabled={page === totalPages}
            >
              <MdOutlineKeyboardDoubleArrowRight />
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default AppPagination;
