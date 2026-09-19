import { createSlice } from "@reduxjs/toolkit";
import * as Constants from "../constants/index";

const initialState = {
  depositRequestsList: {
    page: 1,
    data: [],
    count: 0,
  },
  currentDepositRequest: [],
  loadingDepositRequestsList: true,
  loadingDepositRequest: false,
  error: {},
  sortingParams: {
    limit: Constants.DEFAULT_PAGE_SIZE,
    page: 1,
    orderBy: "createdAt",
    ascending: "desc",
    query: "",
    isAll: 1,
  },
};

const depositRequestSlice = createSlice({
  name: "adminDeposits",
  initialState: initialState,
  reducers: {
    resetDepositRequest(state) {
      return {
        ...initialState,
      };
    },
    depositRequestUpdated(state, action) {
      return {
        ...state,
        currentDepositRequest: action.payload,
        sortingParams: initialState.sortingParams,
        loadingDepositRequest: false,
      };
    },
    depositRequestError(state, action) {
      return {
        ...state,
        error: action.payload,
        loadingDepositRequest: false,
        loadingDepositRequestsList: false,
      };
    },
    depositRequestDeleted(state, action) {
      const currentCount = state.depositRequestsList.count;
      const currentLimit = state.sortingParams.limit;
      const currentPage = parseInt(state.depositRequestsList.page);
      const remainingPages = Math.ceil((currentCount - 1) / currentLimit);
      return {
        ...state,
        depositRequestsList: {
          data: state.depositRequestsList.data.filter(
            (request) => request._id !== action.payload
          ),
          count: currentCount - 1,
          page:
            currentPage <= remainingPages
              ? currentPage.toString()
              : remainingPages.toString(),
        },
        sortingParams: initialState.sortingParams,
        loadingDepositRequestsList: false,
      };
    },
    depositRequestDetailsById(state, action) {
      return {
        ...state,
        currentDepositRequest: action.payload,
        loadingDepositRequest: false,
      };
    },
    depositRequestListUpdated(state, action) {
      return {
        ...state,
        depositRequestsList: {
          data: action.payload.data,
          page: action.payload.metadata[0].current_page,
          count: action.payload.metadata[0].totalRecord,
        },
        loadingDepositRequestsList: false,
      };
    },
    depositRequestSearchParameterUpdate(state, action) {
      return {
        ...state,
        sortingParams: { ...action.payload },
        loadingDepositRequestsList: false,
      };
    },
    loadingOnDepositRequestSubmit(state) {
      return {
        ...state,
        loadingDepositRequest: true,
      };
    },
    loadingDepositRequestsList(state) {
      return {
        ...state,
        loadingDepositRequestsList: true,
      };
    },
    depositRequestApproved(state, action) {
      return {
        ...state,
        depositRequestsList: {
          ...state.depositRequestsList,
          data: state.depositRequestsList.data.map((request) =>
            request._id === action.payload
              ? { ...request, status: "approved" }
              : request
          ),
        },
      };
    },
    depositRequestRejected(state, action) {
      return {
        ...state,
        depositRequestsList: {
          ...state.depositRequestsList,
          data: state.depositRequestsList.data.map((request) =>
            request._id === action.payload
              ? { ...request, status: "rejected" }
              : request
          ),
        },
      };
    },
  },
});

export const {
  resetDepositRequest,
  depositRequestUpdated,
  depositRequestError,
  depositRequestDeleted,
  depositRequestDetailsById,
  depositRequestListUpdated,
  depositRequestSearchParameterUpdate,
  loadingOnDepositRequestSubmit,
  loadingDepositRequestsList,
  depositRequestApproved,
  depositRequestRejected,
} = depositRequestSlice.actions;
export default depositRequestSlice.reducer;
