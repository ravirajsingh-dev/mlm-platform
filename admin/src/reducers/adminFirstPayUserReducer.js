import { createSlice } from "@reduxjs/toolkit";
import * as Constants from "../constants/index";

const initialState = {
  firstPayUserList: {
    page: 1,
    data: [],
    count: 0,
  },
  loadingFirstPayUserList: true,
  EP_User: {},
  levelsTypeList: null,
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

const firstPayUserSlice = createSlice({
  name: "firstPayUser",
  initialState: initialState,
  reducers: {
    firstPayUserCreated(state) {
      state.loadingFirstPayUserList = false;
    },
    resetFirstPayUser(state) {
      return {
        ...initialState,
      };
    },
    loadFirstPayUserPage(state) {
      return {
        ...state,
        loadingFirstPayUserList: false,
      };
    },

    firstPayUserError(state, action) {
      return {
        ...state,
        error: action.payload,
        loadingFirstPayUserList: false,
      };
    },

    firstPayUserListUpdated(state, action) {
      return {
        ...state,
        firstPayUserList: {
          data: action.payload.data,
          page: action.payload.metadata[0].current_page,
          count: action.payload.metadata[0].totalRecord,
        },
        loadingFirstPayUserList: false,
      };
    },
    firstPayUserSearchParameterUpdate(state, action) {
      return {
        ...state,
        sortingParams: { ...action.payload },
        loadingFirstPayUserList: false,
      };
    },
    loadingOnFirstPayUserSubmit(state) {
      return {
        ...state,
        loadingFirstPayUserList: true,
      };
    },
    loadingFirstPayUsersList(state) {
      return {
        ...state,
        loadingFirstPayUserList: true,
      };
    },

    EPUserLoaded(state, action) {
      return {
        ...state,
        EP_User: action.payload,
      };
    },

    levelsListUpdated(state, action) {
      return {
        ...state,
        levelsTypeList: action.payload,
      };
    },
    firstPayUserDeleted(state, action) {
      const currentCount = state.firstPayUserList.count;
      const currentLimit = state.sortingParams.limit;
      const currentPage = parseInt(state.firstPayUserList.page);
      const remainingPages = Math.ceil((currentCount - 1) / currentLimit);
      return {
        ...state,
        firstPayUserList: {
          data: state.firstPayUserList.data.filter(
            (level) => level._id !== action.payload
          ),
          count: currentCount - 1,
          page:
            currentPage <= remainingPages
              ? currentPage.toString()
              : remainingPages.toString(),
        },
        sortingParams: initialState.sortingParams,
        loadingFirstPayUserList: false,
      };
    },
  },
});

export const {
  firstPayUserCreated,
  resetFirstPayUser,
  loadFirstPayUserPage,
  firstPayUserError,
  firstPayUserListUpdated,
  firstPayUserSearchParameterUpdate,
  loadingOnFirstPayUserSubmit,
  loadingFirstPayUsersList,
  EPUserLoaded,
  levelsListUpdated,
  firstPayUserDeleted,
} = firstPayUserSlice.actions;
export default firstPayUserSlice.reducer;
