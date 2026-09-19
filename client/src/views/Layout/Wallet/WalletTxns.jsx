import React from "react";
import { connect } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { Container, Row, Col, Button } from "react-bootstrap";
import moment from "moment";
import CustomDataTable from "@src/views/Common/DataTable/CustomDataTable";
import { fetchWalletTransactions } from "@src/actions/walletActions";
import { FaFilter } from "react-icons/fa";
import WalletTxnsFilterModal from "./WalletTxnsFilterModal";
import PreLoader from "@src/views/Common/Loaders/PreLoader";
import MainCard from "@src/views/Common/Cards/MainCard";
import {
  normalizeWalletType,
  normalizeTransactionType,
} from "@src/utils/walletFilterConstants";

const WalletTxns = ({
  loggedInUser,
  fetchWalletTransactions,
  transactions: { data, count },
  sortingParams,
  loadingTransactions,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const getInitialFiltersFromURL = React.useCallback(() => {
    const searchParams = new URLSearchParams(location.search);
    const walletTypeFromURL = searchParams.get("walletType");
    const typeFromURL = searchParams.get("type");
    const initialFilters = [];

    // Normalize and validate walletType from URL (card-based filter)
    if (walletTypeFromURL) {
      const normalized = normalizeWalletType(walletTypeFromURL);
      if (normalized) {
        initialFilters.push({
          field: "walletType",
          operator: "eq",
          value: normalized,
        });
      }
    }

    // Normalize and validate type from URL (card-based filter)
    if (typeFromURL) {
      const normalized = normalizeTransactionType(typeFromURL);
      if (normalized) {
        initialFilters.push({
          field: "type",
          operator: "eq",
          value: normalized,
        });
      }
    }

    return initialFilters;
  }, [location.search]);

  // Initialize params from URL on mount and when URL changes via card clicks
  const initialSortingParams = React.useMemo(() => {
    const urlFilters = getInitialFiltersFromURL();
    return {
      limit: sortingParams.limit || 20,
      page: urlFilters.length > 0 ? 1 : (sortingParams.page || 1),
      orderBy: "createdAt",
      ascending: "desc",
      query: "",
      filters: urlFilters,
    };
  }, [sortingParams.limit, sortingParams.page, getInitialFiltersFromURL]);

  const [params, setParamsState] = React.useState(initialSortingParams);
  const [showFilterModal, setShowFilterModal] = React.useState(false);

  // Wrapper to preserve filters when pagination/sorting changes
  // Only replace filters when explicitly provided in newParams
  const setParams = React.useCallback((newParams) => {
    setParamsState((prev) => {
      // If 'filters' key exists in newParams, use it (even if empty array = reset)
      // Otherwise, preserve existing filters to maintain filter state during pagination/sorting
      if ("filters" in newParams) {
        // Explicitly setting filters - replace completely
        return {
          ...prev,
          ...newParams,
          filters: Array.isArray(newParams.filters) ? newParams.filters : prev.filters,
        };
      } else {
        // No filters in newParams - preserve existing filters
        return {
          ...prev,
          ...newParams,
          // filters preserved from prev automatically via spread
        };
      }
    });
  }, []);

  const getInitialFilters = React.useCallback(() => {
    if (!params.filters || !Array.isArray(params.filters)) {
      return {};
    }

    const initialFilters = {};
    let minAmount = null;
    let maxAmount = null;
    let startDate = null;
    let endDate = null;

    params.filters.forEach((filter) => {
      if (!filter || !filter.field || !filter.operator) return;

      switch (filter.field) {
        case "type":
          if (filter.operator === "eq") {
            initialFilters.type = filter.value;
          }
          break;
        case "walletType":
          if (filter.operator === "eq") {
            initialFilters.walletType = filter.value;
          }
          break;
        case "amount":
          if (filter.operator === "gte") {
            minAmount = filter.value;
          } else if (filter.operator === "lte") {
            maxAmount = filter.value;
          }
          break;
        case "description":
          if (filter.operator === "regex") {
            initialFilters.description = filter.value;
          }
          break;
        case "createdAt":
          if (filter.operator === "gte") {
            // Convert ISO string to YYYY-MM-DD format for DatePicker
            const date = moment.utc(filter.value).format("YYYY-MM-DD");
            startDate = date;
          } else if (filter.operator === "lte") {
            // Convert ISO string to YYYY-MM-DD format for DatePicker
            const date = moment.utc(filter.value).format("YYYY-MM-DD");
            endDate = date;
          }
          break;
      }
    });

    if (minAmount !== null) initialFilters.min = minAmount;
    if (maxAmount !== null) initialFilters.max = maxAmount;
    if (startDate) initialFilters.startDate = startDate;
    if (endDate) initialFilters.endDate = endDate;

    return initialFilters;
  }, [params.filters]);

  // Sync URL params to filters whenever URL changes (card clicks or browser navigation)
  // This is the critical effect that makes card clicks work - must run on every URL change
  React.useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const walletTypeFromURL = searchParams.get("walletType");
    const typeFromURL = searchParams.get("type");

    // Normalize and validate URL params using shared constants
    const normalizedWalletType = walletTypeFromURL ? normalizeWalletType(walletTypeFromURL) : null;
    const normalizedType = typeFromURL ? normalizeTransactionType(typeFromURL) : null;

    // Update params state - this must happen to trigger the fetchWalletTransactions effect
    setParamsState((prev) => {
      const currentFilters = Array.isArray(prev.filters) ? prev.filters : [];
      
      // Extract current card-based filters (walletType and type) from existing filters
      const currentWalletTypeFilter = currentFilters.find(
        (f) => f && f.field === "walletType"
      );
      const currentTypeFilter = currentFilters.find(
        (f) => f && f.field === "type"
      );
      const currentWalletType = currentWalletTypeFilter?.value
        ? normalizeWalletType(String(currentWalletTypeFilter.value))
        : null;
      const currentType = currentTypeFilter?.value
        ? normalizeTransactionType(String(currentTypeFilter.value))
        : null;

      // Compare: if URL params match current filters exactly, skip update to prevent loops
      // BUT: if URL has no params (both null) and current filters also have none, still skip
      const urlHasWalletType = normalizedWalletType !== null;
      const urlHasType = normalizedType !== null;
      const currentHasWalletType = currentWalletType !== null;
      const currentHasType = currentType !== null;

      // Only skip if both URL and current state match exactly
      if (
        normalizedWalletType === currentWalletType &&
        normalizedType === currentType &&
        urlHasWalletType === currentHasWalletType &&
        urlHasType === currentHasType
      ) {
        return prev; // No change needed
      }

      // Preserve existing modal filters (min/max/description/dates) when URL changes
      // Only walletType and type are managed via URL for card-based filtering
      const existingFilters = currentFilters.filter(
        (f) => f && f.field !== "walletType" && f.field !== "type"
      );

      // Build new filters array: always create new array reference for React
      const nextFilters = [];

      // Add existing modal filters first
      existingFilters.forEach((f) => nextFilters.push(f));

      // Add walletType filter from URL if valid (card-based filter)
      if (normalizedWalletType) {
        nextFilters.push({
          field: "walletType",
          operator: "eq",
          value: normalizedWalletType,
        });
      }

      // Add type filter from URL if valid (card-based filter)
      if (normalizedType) {
        nextFilters.push({
          field: "type",
          operator: "eq",
          value: normalizedType,
        });
      }

      // Always return new object with all properties to ensure React detects the change
      // This will trigger the fetchWalletTransactions effect below
      const newParams = {
        limit: prev.limit ?? 20,
        page: 1, // Always reset to first page when card filters change
        orderBy: prev.orderBy ?? "createdAt",
        ascending: prev.ascending ?? "desc",
        query: prev.query ?? "",
        filters: nextFilters, // New array reference - always different even if same content
      };
      
      return newParams;
    });
  }, [location.search]); // Run whenever URL search params change (card clicks)

  React.useEffect(() => {
    if (!loggedInUser) return;
    fetchWalletTransactions(loggedInUser._id, params);
  }, [fetchWalletTransactions, loggedInUser, params]);

  const columns = [
    {
      name: "SR.",
      cell: (row, index) => index + 1,
      sortable: false,
      minWidth: "50px",
      grow: 0.5,
    },
    {
      name: "CR/DR",
      selector: (row) => row.type,
      sortable: true,
      sortField: "type",
      cell: (row) => <span className="text-uppercase">{row.type}</span>,
      minWidth: "60px",
      grow: 1,
    },
    {
      name: "Wallet Type",
      selector: (row) => row.walletType,
      sortable: true,
      sortField: "type",
      cell: (row) => <span className="text-uppercase">{row.walletType}</span>,
      minWidth: "60px",
      grow: 1,
    },
    {
      name: "Amount",
      selector: (row) => row.amount,
      sortable: true,
      sortField: "amount",
      cell: (row) => `₹${row.amount}`,
      minWidth: "70px",
      grow: 1,
    },
    {
      name: "Description",
      selector: (row) => row.description,
      sortable: true,
      sortField: "description",
      wrap: true,
      minWidth: "150px",
      grow: 2,
    },
    {
      name: "Date",
      selector: (row) => row.createdAt,
      sortable: true,
      sortField: "createdAt",
      cell: (row) => moment(row.createdAt).format("MMM DD, YYYY, hh:mm a"),
      minWidth: "160px",
      grow: 2,
    },
  ];

  // 🔴🟢 Conditional row styling
  const conditionalRowStyles = [
    {
      when: (row) => row.type?.toLowerCase() === "debit",
      style: {
        backgroundColor: "#000000",
        color: "#dc3545",
      },
    },
    {
      when: (row) => row.type?.toLowerCase() === "credit",
      style: {
        backgroundColor: "#000000",
        color: "#ffe082",
      },
    },
  ];

  const handleApplyFilters = React.useCallback((filterValues) => {
    if (!filterValues || (typeof filterValues === "object" && Object.keys(filterValues).length === 0)) {
      const searchParams = new URLSearchParams(location.search);
      searchParams.delete("walletType");
      searchParams.delete("type");
      const newSearch = searchParams.toString();
      const newUrl = newSearch ? `${location.pathname}?${newSearch}` : location.pathname;
      navigate(newUrl, { replace: true });

      setParams({
        page: 1,
        filters: [],
      });
      setShowFilterModal(false);
      return;
    }

    const filters = [];

    // Type filter - validate and normalize (credit/debit only)
    if (filterValues.type && filterValues.type !== "") {
      const normalizedType = normalizeTransactionType(filterValues.type);
      if (normalizedType) {
        filters.push({
          field: "type",
          operator: "eq",
          value: normalizedType,
        });
      }
    }

    // Wallet Type filter - validate and normalize (enum validated)
    if (filterValues.walletType && filterValues.walletType !== "") {
      const normalizedWalletType = normalizeWalletType(filterValues.walletType);
      if (normalizedWalletType) {
        filters.push({
          field: "walletType",
          operator: "eq",
          value: normalizedWalletType,
        });
      }
    }

    // Amount range filters - validate numeric values with safe parsing
    // Use separate gte and lte operators (backend supports multiple operators on same field)
    if (filterValues.min !== undefined && filterValues.min !== null && filterValues.min !== "") {
      const minValue = typeof filterValues.min === "number" 
        ? filterValues.min 
        : parseFloat(filterValues.min);
      if (!isNaN(minValue) && isFinite(minValue) && minValue >= 0) {
        filters.push({
          field: "amount",
          operator: "gte",
          value: minValue,
        });
      }
    }

    if (filterValues.max !== undefined && filterValues.max !== null && filterValues.max !== "") {
      const maxValue = typeof filterValues.max === "number"
        ? filterValues.max
        : parseFloat(filterValues.max);
      if (!isNaN(maxValue) && isFinite(maxValue) && maxValue >= 0) {
        filters.push({
          field: "amount",
          operator: "lte",
          value: maxValue,
        });
      }
    }

    // Description filter - partial match, case-insensitive regex
    if (filterValues.description && typeof filterValues.description === "string" && filterValues.description.trim()) {
      filters.push({
        field: "description",
        operator: "regex",
        value: filterValues.description.trim(),
      });
    }

    // Date range filters - full-day inclusive, timezone-safe
    // Parse YYYY-MM-DD string and get start/end of day in UTC for deterministic filtering
    if (filterValues.startDate && typeof filterValues.startDate === "string" && filterValues.startDate.trim()) {
      const startDateUTC = moment.utc(filterValues.startDate.trim(), "YYYY-MM-DD", true);
      if (startDateUTC.isValid()) {
        // Start of day in UTC - includes the entire day
        const startDateISO = startDateUTC.startOf("day").toISOString();
        filters.push({
          field: "createdAt",
          operator: "gte",
          value: startDateISO,
        });
      }
    }

    if (filterValues.endDate && typeof filterValues.endDate === "string" && filterValues.endDate.trim()) {
      const endDateUTC = moment.utc(filterValues.endDate.trim(), "YYYY-MM-DD", true);
      if (endDateUTC.isValid()) {
        // End of day in UTC - includes the entire day
        const endDateISO = endDateUTC.endOf("day").toISOString();
        filters.push({
          field: "createdAt",
          operator: "lte",
          value: endDateISO,
        });
      }
    }

    // Sync URL params for walletType and type filters
    const searchParams = new URLSearchParams(location.search);
    const walletTypeFilter = filters.find((f) => f && f.field === "walletType");
    const typeFilter = filters.find((f) => f && f.field === "type");

    if (walletTypeFilter && walletTypeFilter.value) {
      searchParams.set("walletType", walletTypeFilter.value);
    } else {
      searchParams.delete("walletType");
    }

    if (typeFilter && typeFilter.value) {
      searchParams.set("type", typeFilter.value);
    } else {
      searchParams.delete("type");
    }

    const newSearch = searchParams.toString();
    const newUrl = newSearch ? `${location.pathname}?${newSearch}` : location.pathname;
    navigate(newUrl, { replace: true });

    setParams({
      page: 1,
      filters,
    });
    setShowFilterModal(false);
  }, [setParams, location.pathname, location.search, navigate]);

  return (
    <Container>
      <div className="card-heading-unique">
        <div className="heading-underline">Wallet Transactions !</div>
      </div>

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

      <WalletTxnsFilterModal
        show={showFilterModal}
        onHide={() => setShowFilterModal(false)}
        onApply={handleApplyFilters}
        initialFilters={getInitialFilters()}
      />

      <Row>
        <Col md="12">
          {loadingTransactions ? (
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
                responsive
                striped
                progressPending={loadingTransactions}
                highlightOnHover
                persistTableHead
                paginationServer
                conditionalRowStyles={conditionalRowStyles} // ✅ Injected here
              />
            </MainCard>
          )}
        </Col>
      </Row>
    </Container>
  );
};

WalletTxns.propTypes = {
  loggedInUser: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
  loggedInUser: state.auth?.user || {},
  transactions: state.wallet?.transactions,
  sortingParams: state.wallet.sortingParams,
  loadingTransactions: state.wallet.loadingTransactions,
});

export default connect(mapStateToProps, { fetchWalletTransactions })(
  WalletTxns
);
