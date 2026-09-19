import { createSlice } from "@reduxjs/toolkit";
import * as Constants from "../constants/index";

const initialState = {
  userUpisList: {
    page: 1,
    data: [],
    count: 0,
  },
  currentUserUpi: {},
  loadingUserUpisList: true,
  loadingUserUpi: false,
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

const userUpiSlice = createSlice({
  name: "userUpis",
  initialState: initialState,
  reducers: {
    userUpiCreated(state) {
      state.loadingUserUpi = false;
    },
    resetUserUpi(state) {
      return {
        ...initialState,
      };
    },
    loadUserUpiPage(state) {
      return {
        ...state,
        loadingUserUpi: false,
      };
    },
    userUpiUpdated(state, action) {
      return {
        ...state,
        currentUserUpi: action.payload,
        sortingParams: initialState.sortingParams,
        loadingUserUpi: false,
      };
    },
    userUpiError(state, action) {
      return {
        ...state,
        error: action.payload,
        loadingUserUpi: false,
        loadingUserUpisList: false,
      };
    },
    userUpiDeleted(state, action) {
      const currentCount = state.userUpisList.count;
      const currentLimit = state.sortingParams.limit;
      const currentPage = parseInt(state.userUpisList.page);
      const remainingPages = Math.ceil((currentCount - 1) / currentLimit);
      return {
        ...state,
        userUpisList: {
          data: state.userUpisList.data.filter(
            (userUpi) => userUpi._id !== action.payload
          ),
          count: currentCount - 1,
          page:
            currentPage <= remainingPages
              ? currentPage.toString()
              : remainingPages.toString(),
        },
        sortingParams: initialState.sortingParams,
        loadingUserUpisList: false,
      };
    },
    userUpiDetailsById(state, action) {
      return {
        ...state,
        currentUserUpi: action.payload,
        loadingUserUpi: false,
      };
    },
    userUpisListUpdated(state, action) {
      return {
        ...state,
        userUpisList: {
          data: action.payload.data,
          page: action.payload.metadata[0].current_page,
          count: action.payload.metadata[0].total_count,
        },
        loadingUserUpisList: false,
      };
    },
    userUpiSearchParameterUpdate(state, action) {
      return {
        ...state,
        sortingParams: action.payload,
      };
    },
    loadingOnUserUpiSubmit(state) {
      state.loadingUserUpi = true;
    },
    loadingUserUpisList(state) {
      state.loadingUserUpisList = true;
    },
  },
});

export const {
  userUpiCreated,
  resetUserUpi,
  loadUserUpiPage,
  userUpiUpdated,
  userUpiDeleted,
  userUpiError,
  userUpiDetailsById,
  userUpisListUpdated,
  userUpiSearchParameterUpdate,
  loadingOnUserUpiSubmit,
  loadingUserUpisList,
} = userUpiSlice.actions;

export default userUpiSlice.reducer;
