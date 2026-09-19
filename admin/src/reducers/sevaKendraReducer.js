import { createSlice } from "@reduxjs/toolkit";
import * as Constants from "../constants/index";

const initialState = {
  sevaKendraList: {
    page: 1,
    data: [],
    count: 0,
  },
  loadingSevaKendraList: true,
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

const sevaKendraSlice = createSlice({
  name: "sevaKendra",
  initialState: initialState,
  reducers: {
    sevaKendraCreated(state) {
      state.loadingSevaKendraList = false;
    },
    resetSevaKendra(state) {
      return {
        ...initialState,
      };
    },
    loadSevaKendraPage(state) {
      return {
        ...state,
        loadingSevaKendraList: false,
      };
    },

    sevaKendraError(state, action) {
      return {
        ...state,
        error: action.payload,
        loadingSevaKendraList: false,
      };
    },

    sevaKendraListUpdated(state, action) {
      return {
        ...state,
        sevaKendraList: {
          data: action.payload.data,
          page: action.payload.metadata[0].current_page,
          count: action.payload.metadata[0].totalRecord,
        },
        loadingSevaKendraList: false,
      };
    },
    sevaKendraSearchParameterUpdate(state, action) {
      return {
        ...state,
        sortingParams: { ...action.payload },
        loadingSevaKendraList: false,
      };
    },
    loadingOnSevaKendraSubmit(state) {
      return {
        ...state,
        loadingSevaKendraList: true,
      };
    },
    loadingSevaKendraList(state) {
      return {
        ...state,
        loadingSevaKendraList: true,
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
    sevaKendraDeleted(state, action) {
      const currentCount = state.sevaKendraList.count;
      const currentLimit = state.sortingParams.limit;
      const currentPage = parseInt(state.sevaKendraList.page);
      const remainingPages = Math.ceil((currentCount - 1) / currentLimit);
      return {
        ...state,
        sevaKendraList: {
          data: state.sevaKendraList.data.filter(
            (level) => level._id !== action.payload
          ),
          count: currentCount - 1,
          page:
            currentPage <= remainingPages
              ? currentPage.toString()
              : remainingPages.toString(),
        },
        sortingParams: initialState.sortingParams,
        loadingSevaKendraList: false,
      };
    },
  },
});

export const {
  sevaKendraCreated,
  resetSevaKendra,
  loadSevaKendraPage,
  sevaKendraError,
  sevaKendraListUpdated,
  sevaKendraSearchParameterUpdate,
  loadingOnSevaKendraSubmit,
  loadingSevaKendraList,
  EPUserLoaded,
  levelsListUpdated,
  sevaKendraDeleted,
} = sevaKendraSlice.actions;
export default sevaKendraSlice.reducer;
