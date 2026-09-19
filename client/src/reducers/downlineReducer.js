import { createSlice } from "@reduxjs/toolkit";
import * as Constants from "../constants/index";

const initialState = {
  treeDownline: [],
  left_leg: {
    page: 1,
    data: [],
    count: 0,
  },
  right_leg: {
    page: 1,
    data: [],
    count: 0,
  },
  directDownline: {
    page: 1,
    data: [],
    count: 0,
  },
  loadingDownline: false,
  loadingLeftDownline: true,
  loadingRightDownline: true,
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

const downlineSlice = createSlice({
  name: "downline",
  initialState: initialState,
  reducers: {
    treeDownlineUpdated(state, action) {
      return {
        ...state,
        treeDownline: action.payload,
        loadingDownline: false,
      };
    },
    leftDownlineUpdated(state, action) {
      console.log("action.payload", action.payload);
      return {
        ...state,
        left_leg: {
          data: action.payload.data,
          page: action.payload.metadata[0].current_page,
          count: action.payload.metadata[0].totalRecord,
        },
        loadingLeftDownline: false,
      };
    },
    rightDownlineUpdated(state, action) {
      return {
        ...state,
        right_leg: {
          data: action.payload.data,
          page: action.payload.metadata[0].current_page,
          count: action.payload.metadata[0].totalRecord,
        },
        loadingRightDownline: false,
      };
    },
    directDownlineUpdated(state, action) {
      return {
        ...state,
        directDownline: {
          data: action.payload.data,
          page: action.payload.metadata[0]?.current_page,
          count: action.payload.metadata[0]?.totalRecord,
        },
        loadingDownline: false,
      };
    },
    downlineError(state, action) {
      return {
        ...state,
        error: action.payload,
        loadingDownline: false,
      };
    },
    loadingDownline(state) {
      return {
        ...state,
        loadingDownline: true,
      };
    },
    loadingLeftDownline(state) {
      return {
        ...state,
        loadingLeftDownline: true,
      };
    },
    loadingRightDownline(state) {
      return {
        ...state,
        loadingRightDownline: true,
      };
    },

    resetAppToken(state) {
      return {
        ...initialState,
      };
    },
  },
});

export const {
  treeDownlineUpdated,
  leftDownlineUpdated,
  rightDownlineUpdated,
  directDownlineUpdated,
  downlineError,
  loadingDownline,
  resetAppToken,
  loadingLeftDownline,
  loadingRightDownline,
} = downlineSlice.actions;
export default downlineSlice.reducer;
