import { createSlice } from "@reduxjs/toolkit";
import * as Constants from "../constants/index";

const initialState = {
  withdrawalRequestsList: {
    page: 1,
    data: [],
    count: 0,
  },
  currentWithdrawalRequest: [],
  loadingWithdrawalRequestsList: true,
  loadingWithdrawalRequest: false,
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

const withdrawalRequestSlice = createSlice({
  name: "adminWithdrawals",
  initialState: initialState,
  reducers: {
    resetWithdrawalRequest(state) {
      return {
        ...initialState,
      };
    },
    withdrawalRequestUpdated(state, action) {
      return {
        ...state,
        currentWithdrawalRequest: action.payload,
        sortingParams: initialState.sortingParams,
        loadingWithdrawalRequest: false,
      };
    },
    withdrawalRequestError(state, action) {
      return {
        ...state,
        error: action.payload,
        loadingWithdrawalRequest: false,
        loadingWithdrawalRequestsList: false,
      };
    },
    withdrawalRequestDeleted(state, action) {
      const currentCount = state.withdrawalRequestsList.count;
      const currentLimit = state.sortingParams.limit;
      const currentPage = parseInt(state.withdrawalRequestsList.page);
      const remainingPages = Math.ceil((currentCount - 1) / currentLimit);
      return {
        ...state,
        withdrawalRequestsList: {
          data: state.withdrawalRequestsList.data.filter(
            (request) => request._id !== action.payload
          ),
          count: currentCount - 1,
          page:
            currentPage <= remainingPages
              ? currentPage.toString()
              : remainingPages.toString(),
        },
        sortingParams: initialState.sortingParams,
        loadingWithdrawalRequestsList: false,
      };
    },
    withdrawalRequestDetailsById(state, action) {
      return {
        ...state,
        currentWithdrawalRequest: action.payload,
        loadingWithdrawalRequest: false,
      };
    },
    withdrawalRequestListUpdated(state, action) {
      return {
        ...state,
        withdrawalRequestsList: {
          data: action.payload.data,
          page: action.payload.metadata[0].current_page,
          count: action.payload.metadata[0].totalRecord,
        },
        loadingWithdrawalRequestsList: false,
      };
    },

    withdrawalRequestSearchParameterUpdate(state, action) {
      return {
        ...state,
        sortingParams: { ...action.payload },
        loadingWithdrawalRequestsList: false,
      };
    },
    loadingOnWithdrawalRequestSubmit(state) {
      return {
        ...state,
        loadingWithdrawalRequest: true,
      };
    },
    loadingWithdrawalRequestsList(state) {
      return {
        ...state,
        loadingWithdrawalRequestsList: true,
      };
    },
    withdrawalRequestApproved(state, action) {
      return {
        ...state,
        withdrawalRequestsList: {
          ...state.withdrawalRequestsList,
          data: state.withdrawalRequestsList.data.map((request) =>
            request._id === action.payload
              ? { ...request, status: "approved" }
              : request
          ),
        },
      };
    },
    withdrawalRequestRejected(state, action) {
      return {
        ...state,
        withdrawalRequestsList: {
          ...state.withdrawalRequestsList,
          data: state.withdrawalRequestsList.data.map((request) =>
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
  resetWithdrawalRequest,
  withdrawalRequestUpdated,
  withdrawalRequestError,
  withdrawalRequestDeleted,
  withdrawalRequestDetailsById,
  withdrawalRequestListUpdated,
  withdrawalRequestSearchParameterUpdate,
  loadingOnWithdrawalRequestSubmit,
  loadingWithdrawalRequestsList,
  withdrawalRequestApproved,
  withdrawalRequestRejected,
} = withdrawalRequestSlice.actions;
export default withdrawalRequestSlice.reducer;
