import React from "react";
import DataTable from "react-data-table-component";

import AppPagination from "./AppPagination";
import BouncingLoader from "@src/view/spinners/BouncingLoader";

const tableCustomStyles = {
  table: {
    style: {
      // borderTopLeftRadius: "10px",
      borderRadius: "10px",
      // borderTopRightRadius: "10px",
      overflow: "hidden",
    },
  },
  headCells: {
    style: {
      fontSize: "14px",
      fontWeight: "bold",
      backgroundColor: "rgb(230, 243, 255)",
    },
  },
};

function PiDataTable(props) {
  const { count, params, setParams, minHeight } = props;

  const handleSort = (column, sortOrder) => {
    const sortField = column && column.sortField ? column.sortField : "";

    setParams({
      ...params,
      orderBy: sortField,
      ascending: sortOrder,
    });
  };

  return (
    <DataTable
      customStyles={tableCustomStyles}
      paginationComponent={() => {
        return (
          <AppPagination count={count} params={params} setParams={setParams} />
        );
      }}
      onSort={handleSort}
      sortServer
      progressComponent={
        <BouncingLoader minHeight={`${minHeight ? minHeight : "400px"}`} />
      }
      {...props}
    />
  );
}

export default PiDataTable;
