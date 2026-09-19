import { createSlice } from "@reduxjs/toolkit";
import * as Constants from "../constants/index";

const initialState = {
  epinsList: {
    page: 1,
    data: [],
    count: 0,
    total: 0,
    used: 0,
    unused: 0,
  },
  epinRequestsList: {
    page: 1,
    data: [],
    count: 0,
  },
  epinTransferReportsList: {
    page: 1,
    data: [],
    count: 0,
  },
  loadingEPinTransferReportList: true,
  loadingEPinRequestList: true,
  adminCredential: {},
  loadingEPinList: true,
  loadingEPin: false,
  loadingQRCode: false,
  epinQRCode: "",
  EP_User: {},
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

const epinSlice = createSlice({
  name: "epin",
  initialState: initialState,
  reducers: {
    epinCreated(state) {
      return {
        ...state,
        loadingEPin: false,
      };
    },
    resetEPin(state) {
      return {
        ...initialState,
      };
    },
    loadEPinPage(state) {
      return {
        ...state,
        loadingEPin: false,
      };
    },

    epinError(state, action) {
      return {
        ...state,
        error: action.payload,
        loadingEPin: false,
        loadingEPinList: false,
        loadingEPinRequestList: false,
        loadingEPinTransferReportList: false,
      };
    },

    epinListUpdated(state, action) {
      return {
        ...state,
        epinsList: {
          data: action.payload.data,
          page: action.payload.metadata[0].current_page,
          count: action.payload.metadata[0].total,
          total: action.payload.metadata[0].total,
          used: action.payload.metadata[0].used,
          unused: action.payload.metadata[0].unused,
        },
        loadingEPinList: false,
      };
    },

    epinRequestListUpdated(state, action) {
      return {
        ...state,
        epinRequestsList: {
          data: action.payload.data,
          page: action.payload.metadata[0].current_page,
          count: action.payload.metadata[0].totalRecord,
        },
        loadingEPinRequestList: false,
      };
    },

    epinTransferReportListUpdated(state, action) {
      return {
        ...state,
        epinTransferReportsList: {
          data: action.payload.data,
          page: action.payload.metadata[0].current_page,
          count: action.payload.metadata[0].totalRecord,
        },
        loadingEPinTransferReportList: false,
      };
    },

    epinSearchParameterUpdate(state, action) {
      return {
        ...state,
        sortingParams: { ...action.payload },
        loadingEPinList: false,
        loadingEPinRequestList: false,
        loadingEPinTransferReportList: false,
      };
    },
    loadingOnEPinSubmit(state) {
      return {
        ...state,
        loadingEPin: true,
      };
    },
    loadingEPinsList(state) {
      return {
        ...state,
        loadingEPinList: true,
      };
    },

    loadingEPinRequestsList(state) {
      return {
        ...state,
        loadingEPinRequestList: true,
      };
    },

    loadingEPinTransferReportsList(state) {
      return {
        ...state,
        loadingEPinTransferReportList: true,
      };
    },

    EPUserLoaded(state, action) {
      return {
        ...state,
        EP_User: action.payload,
      };
    },
    adminCredentialLoaded(state, action) {
      return {
        ...state,
        adminCredential: action.payload,
      };
    },
    epinsQRCodeUpdated(state, action) {
      return {
        ...state,
        epinQRCode: action.payload,
        loadingQRCode: false,
      };
    },
    onLoadingQRCode(state) {
      return {
        ...state,
        loadingQRCode: true,
      };
    },
  },
});

export const {
  epinCreated,
  resetEPin,
  loadEPinPage,
  epinError,
  epinListUpdated,
  epinSearchParameterUpdate,
  loadingOnEPinSubmit,
  loadingEPinsList,
  EPUserLoaded,
  epinsQRCodeUpdated,
  adminCredentialLoaded,
  onLoadingQRCode,
  epinRequestListUpdated,
  loadingEPinRequestsList,
  epinTransferReportListUpdated,
  loadingEPinTransferReportsList,
} = epinSlice.actions;
export default epinSlice.reducer;
