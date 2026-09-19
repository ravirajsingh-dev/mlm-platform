import { createSlice } from "@reduxjs/toolkit";
import * as Constants from "@src/constants/index";

const initialState = {
  currentTxnDetails: 0,
  transactions: {
    page: 1,
    data: [],
    count: 0,
  },
  walletRequestsList: {
    page: 1,
    data: [],
    count: 0,
  },
  EP_User: {},
  loadingWalletRequestList: false,
  loadingCurrentBalance: false,
  loadingTransactions: false,
  loadingWalletRequest: false,
  error: {},
  sortingParams: {
    limit: Constants.DEFAULT_PAGE_SIZE,
    page: 1,
    orderBy: "createdAt",
    ascending: "desc",
    query: "",
  },
  // Withdrawal state
  withdrawalSettings: null,
  withdrawalRequests: {
    requests: [],
    pagination: {
      currentPage: 1,
      perPage: 10,
      totalRecords: 0,
      totalPages: 0,
    },
  },
  loadingWithdrawalSettings: false,
  loadingWithdrawalRequest: false,
  loadingWithdrawalRequestsList: false,
};

const walletSlice = createSlice({
  name: "wallet",
  initialState: initialState,
  reducers: {
    currentBalanceUpdated(state, action) {
      return {
        ...state,
        currentTxnDetails: action.payload,
        loadingCurrentBalance: false,
      };
    },
    transactionsUpdated(state, action) {
      return {
        ...state,
        transactions: {
          data: action.payload.data,
          page: action.payload.metadata[0].current_page,
          count: action.payload.metadata[0].totalRecord,
        },
        loadingTransactions: false,
      };
    },
    walletError(state, action) {
      return {
        ...state,
        error: action.payload,
        loadingCurrentBalance: false,
        loadingTransactions: false,
      };
    },
    loadingCurrentBalance(state) {
      return {
        ...state,
        loadingCurrentBalance: true,
      };
    },
    loadingTransactions(state) {
      return {
        ...state,
        loadingTransactions: true,
      };
    },
    walletRequestCreated(state) {
      return {
        ...state,
        loadingWalletRequest: false,
      };
    },

    loadingOnWalletRequestSubmit(state) {
      return {
        ...state,
        loadingWalletRequest: true,
      };
    },

    walletRequestListUpdated(state, action) {
      return {
        ...state,
        walletRequestsList: {
          data: action.payload.data,
          page: action.payload.metadata[0].current_page,
          count: action.payload.metadata[0].totalRecord,
        },
        loadingWalletRequestList: false,
      };
    },
    loadingWalletRequestList(state) {
      return {
        ...state,
        loadingWalletRequestList: true,
      };
    },

    EPUserLoaded(state, action) {
      return {
        ...state,
        EP_User: action.payload,
      };
    },
    // Withdrawal reducers
    withdrawalSettingsLoaded(state, action) {
      return {
        ...state,
        withdrawalSettings: action.payload,
        loadingWithdrawalSettings: false,
      };
    },
    loadingWithdrawalSettings(state) {
      return {
        ...state,
        loadingWithdrawalSettings: true,
      };
    },
    withdrawalRequestCreated(state, action) {
      return {
        ...state,
        loadingWithdrawalRequest: false,
      };
    },
    loadingWithdrawalRequest(state) {
      return {
        ...state,
        loadingWithdrawalRequest: true,
      };
    },
    withdrawalRequestsListUpdated(state, action) {
      return {
        ...state,
        withdrawalRequests: action.payload,
        loadingWithdrawalRequestsList: false,
      };
    },
    loadingWithdrawalRequestsList(state) {
      return {
        ...state,
        loadingWithdrawalRequestsList: true,
      };
    },
    withdrawalError(state, action) {
      return {
        ...state,
        loadingWithdrawalSettings: false,
        loadingWithdrawalRequest: false,
        loadingWithdrawalRequestsList: false,
        error: action.payload || {},
      };
    },
  },
});

export const {
  currentBalanceUpdated,
  transactionsUpdated,
  walletError,
  loadingCurrentBalance,
  loadingTransactions,
  walletRequestCreated,
  loadingOnWalletRequestSubmit,
  walletRequestListUpdated,
  loadingWalletRequestList,
  EPUserLoaded,
  withdrawalSettingsLoaded,
  loadingWithdrawalSettings,
  withdrawalRequestCreated,
  loadingWithdrawalRequest,
  withdrawalRequestsListUpdated,
  loadingWithdrawalRequestsList,
  withdrawalError,
} = walletSlice.actions;
export default walletSlice.reducer;
