import { createSlice } from "@reduxjs/toolkit";
import * as Constants from "../constants/index";

const initialState = {
  epinsList: {
    page: 1,
    data: [],
    count: 0,
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
  loadingEPinList: true,
  loadingEPin: false,
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
      state.loadingEPin = false;
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
      };
    },

    epinListUpdated(state, action) {
      return {
        ...state,
        epinsList: {
          data: action.payload.data,
          page: action.payload.metadata[0].current_page,
          count: action.payload.metadata[0].totalRecord,
        },
        loadingEPinList: false,
      };
    },
    epinSearchParameterUpdate(state, action) {
      return {
        ...state,
        sortingParams: { ...action.payload },
        loadingEPinList: false,
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

    EPUserLoaded(state, action) {
      return {
        ...state,
        EP_User: action.payload,
      };
    },

    loadingEPinRequestsList(state) {
      return {
        ...state,
        loadingEPinRequestList: true,
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

    loadingEPinTransferReportsList(state) {
      return {
        ...state,
        loadingEPinTransferReportList: true,
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
  loadingEPinRequestsList,
  epinRequestListUpdated,
  epinTransferReportListUpdated,
  loadingEPinTransferReportsList,
} = epinSlice.actions;
export default epinSlice.reducer;
