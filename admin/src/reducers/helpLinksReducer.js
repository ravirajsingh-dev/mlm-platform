import { createSlice } from "@reduxjs/toolkit";
import * as Constants from "../constants/index";

const initialState = {
  sendHelpLinksList: {
    page: 1,
    data: [],
    count: 0,
  },
  loadingSendHelpLinksList: true,
  receiveHelpLinksList: {
    page: 1,
    data: [],
    count: 0,
  },
  loadingReceiveHelpLinksList: true,
  downlinePendingLinks: {
    page: 1,
    data: [],
    count: 0,
  },
  loadingDownlinePendingLinks: true,
  loadingHelpLink: false,
  loadingQRCode: false,
  helpLinkQRCode: "",
  currentHelpLink: {},
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

const helpLinkSlice = createSlice({
  name: "helpLinks",
  initialState: initialState,
  reducers: {
    resetHelpLink(state) {
      return {
        ...initialState,
      };
    },

    helpLinkUpdated(state, action) {
      return {
        ...state,
        currentHelpLink: action.payload.data,
        sortingParams: initialState.sortingParams,
        loadingHelpLink: false,
        sendHelpLinksList: {
          ...state.sendHelpLinksList,
          data: state.sendHelpLinksList.data.map((link) =>
            link._id === action.payload.help_link_id
              ? action.payload.data
              : link
          ),
        },
      };
    },
    receiverHelpLinkUpdated(state, action) {
      return {
        ...state,
        currentHelpLink: action.payload.data,
        sortingParams: initialState.sortingParams,
        loadingHelpLink: false,
        receiveHelpLinksList: {
          ...state.receiveHelpLinksList,
          data: state.receiveHelpLinksList.data.map((link) =>
            link._id === action.payload.help_link_id
              ? action.payload.data
              : link
          ),
        },
      };
    },
    helpLinkError(state, action) {
      return {
        ...state,
        error: action.payload,
        loadingHelpLink: false,
        loadingSendHelpLinksList: false,
        loadingReceiveHelpLinksList: false,
        loadingDownlinePendingLinks: false,
        loadingQRCode: false,
      };
    },

    helpLinkDetailsById(state, action) {
      return {
        ...state,
        currentHelpLink: action.payload,
        loadingHelpLink: false,
      };
    },

    loadingOnHelpLinkSubmit(state) {
      state.loadingHelpLink = true;
    },
    loadingSendHelpLinksList(state) {
      state.loadingSendHelpLinksList = true;
    },
    sendHelpLinksListUpdated(state, action) {
      return {
        ...state,
        sendHelpLinksList: {
          data: action.payload.data,
          page: action.payload.metadata[0].current_page,
          count: action.payload.metadata[0].totalRecord,
        },
        loadingSendHelpLinksList: false,
      };
    },
    sendHelpLinksSearchParameterUpdated(state, action) {
      return {
        ...state,
        sortingParams: action.payload,
      };
    },
    loadingReceivePaymentLinksList(state) {
      state.loadingReceiveHelpLinksList = true;
    },
    receiveHelpLinksListUpdated(state, action) {
      return {
        ...state,
        receiveHelpLinksList: {
          data: action.payload.data,
          page: action.payload.metadata[0].current_page,
          count: action.payload.metadata[0].totalRecord,
        },
        loadingReceiveHelpLinksList: false,
      };
    },
    receiveHelpLinksSearchParameterUpdated(state, action) {
      return {
        ...state,
        sortingParams: action.payload,
      };
    },

    onLoadingQRCode(state) {
      return {
        ...state,
        loadingQRCode: true,
      };
    },
    helpLinkQRCodeUpdated(state, action) {
      return {
        ...state,
        helpLinkQRCode: action.payload,
        loadingQRCode: false,
      };
    },
    loadingDownlinePendingPaymentLinks(state) {
      state.loadingDownlinePendingLinks = true;
    },
    downlinePendingLinksUpdated(state, action) {
      return {
        ...state,
        downlinePendingLinks: {
          data: action.payload.data,
          page: action.payload.metadata[0].current_page,
          count: action.payload.metadata[0].totalRecord,
        },
        loadingDownlinePendingLinks: false,
      };
    },
  },
});

export const {
  resetHelpLink,
  helpLinkUpdated,
  helpLinkError,
  loadingOnHelpLinkSubmit,
  helpLinkDetailsById,
  loadingSendHelpLinksList,
  sendHelpLinksListUpdated,
  sendHelpLinksSearchParameterUpdated,
  receiveHelpLinksListUpdated,
  receiveHelpLinksSearchParameterUpdated,
  onLoadingQRCode,
  helpLinkQRCodeUpdated,
  loadingReceivePaymentLinksList,
  receiverHelpLinkUpdated,
  loadingDownlinePendingPaymentLinks,
  downlinePendingLinksUpdated,
} = helpLinkSlice.actions;

export default helpLinkSlice.reducer;
