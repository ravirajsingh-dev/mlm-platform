import { createSlice } from "@reduxjs/toolkit";
import * as Constants from "../constants/index";

const initialState = {
  walletTransferReportsList: {
    page: 1,
    data: [],
    count: 0,
  },
  walletTransactionsList: {
    page: 1,
    data: [],
    count: 0,
  },
  usersWalletBalanceList: {
    page: 1,
    data: [],
    count: 0,
  },
  userWalletTransfersList: {
    page: 1,
    data: [],
    count: 0,
  },
  loadingWalletTransferReportList: true,
  loadingWalletTransactionsList: true,
  loadingUsersWalletBalanceList: true,
  loadingUserWalletTransfersList: true,
  loadingWallet: false,
  EP_User: {},
  error: {},
  sortingParams: {
    limit: Constants.DEFAULT_PAGE_SIZE,
    page: 1,
    orderBy: "createdAt",
    ascending: "desc",
    query: "",
  },
};

const walletSlice = createSlice({
  name: "wallet",
  initialState: initialState,
  reducers: {
    resetWallet(state) {
      return {
        ...initialState,
      };
    },
    loadWalletPage(state) {
      return {
        ...state,
        loadingWallet: false,
      };
    },

    walletError(state, action) {
      return {
        ...state,
        error: action.payload,
        loadingWallet: false,
      };
    },

    walletSearchParameterUpdate(state, action) {
      return {
        ...state,
        sortingParams: { ...action.payload },
        loadingWallet: false,
      };
    },

    EPUserLoaded(state, action) {
      return {
        ...state,
        EP_User: action.payload,
      };
    },

    loadingWalletTransferReportsList(state) {
      return {
        ...state,
        loadingWalletTransferReportList: true,
      };
    },

    walletTransferReportListUpdated(state, action) {
      return {
        ...state,
        walletTransferReportsList: {
          data: action.payload.data,
          page: action.payload.metadata[0].current_page,
          count: action.payload.metadata[0].totalRecord,
        },
        loadingWalletTransferReportList: false,
      };
    },

    loadingWalletTransactionsList(state) {
      return {
        ...state,
        loadingWalletTransactionsList: true,
      };
    },

    walletTransactionsListUpdated(state, action) {
      return {
        ...state,
        walletTransactionsList: {
          data: action.payload.data,
          page: action.payload.metadata[0].current_page,
          count: action.payload.metadata[0].totalRecord,
          summary: action.payload.summary || null,
        },
        loadingWalletTransactionsList: false,
      };
    },

    loadingUsersWalletBalanceList(state) {
      return {
        ...state,
        loadingUsersWalletBalanceList: true,
      };
    },

    usersWalletBalanceListUpdated(state, action) {
      return {
        ...state,
        usersWalletBalanceList: {
          data: action.payload.data,
          page: action.payload.metadata[0].current_page,
          count: action.payload.metadata[0].totalRecord,
          summary: action.payload.summary || null,
        },
        loadingUsersWalletBalanceList: false,
      };
    },

    loadingUserWalletTransfersList(state) {
      return {
        ...state,
        loadingUserWalletTransfersList: true,
      };
    },

    userWalletTransfersListUpdated(state, action) {
      return {
        ...state,
        userWalletTransfersList: {
          data: action.payload.data,
          page: action.payload.metadata[0].current_page,
          count: action.payload.metadata[0].totalRecord,
          summary: action.payload.summary || null,
        },
        loadingUserWalletTransfersList: false,
      };
    },
  },
});

export const {
  resetWallet,
  loadWalletPage,
  walletError,
  walletSearchParameterUpdate,
  EPUserLoaded,
  loadingWalletTransferReportsList,
  walletTransferReportListUpdated,
  loadingWalletTransactionsList,
  walletTransactionsListUpdated,
  loadingUsersWalletBalanceList,
  usersWalletBalanceListUpdated,
  loadingUserWalletTransfersList,
  userWalletTransfersListUpdated,
} = walletSlice.actions;
export default walletSlice.reducer;
