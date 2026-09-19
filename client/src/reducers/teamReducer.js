import { createSlice } from "@reduxjs/toolkit";
import * as Constants from "../constants/index";

const initialState = {
  treeDownline: [],
  myTeamList: {
    page: 1,
    data: [],
    count: 0,
  },
  myLegTeamList: {
    page: 1,
    data: [],
    count: 0,
  },
  loadingLegTeam: false,
  leftDownline: [],
  rightDownline: [],
  directDownline: {
    page: 1,
    data: [],
    count: 0,
  },
  levelWiseTeamList: {
    page: 1,
    data: [],
    count: 0,
  },
  loadingDownline: false,
  loadingDirectDownline: false,
  loadingTreeStructure: false,

  levelSummary: [],
  levelUsers: {
    data: [],
    page: 1,
    count: 0,
  },
  loadingLevelSummary: false,
  loadingLevelUsers: false,

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

const teamSlice = createSlice({
  name: "team",
  initialState: initialState,
  reducers: {
    resetDownline(state) {
      return {
        ...initialState,
      };
    },
    treeDownlineUpdated(state, action) {
      return {
        ...state,
        treeDownline: action.payload,
        loadingDownline: false,
        loadingTreeStructure: false,
      };
    },
    leftDownlineUpdated(state, action) {
      return {
        ...state,
        leftDownline: action.payload,
        loadingDownline: false,
      };
    },
    rightDownlineUpdated(state, action) {
      return {
        ...state,
        rightDownline: action.payload,
        loadingDownline: false,
      };
    },
    directDownlineUpdated(state, action) {
      console.log("action.payload.data", action.payload);

      return {
        ...state,
        directDownline: {
          data: action.payload.data,
          page: action.payload.metadata[0].current_page,
          count: action.payload.metadata[0].totalRecord,
        },
        loadingDownline: false,
        loadingDirectDownline: false,
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

    loadingDirectDownline(state) {
      return {
        ...state,
        loadingDirectDownline: true,
      };
    },

    loadingTreeStructure(state) {
      return {
        ...state,
        loadingTreeStructure: true,
      };
    },

    totalTeamUpdated(state, action) {
      return {
        ...state,
        myTeamList: {
          data: action.payload.data,
          page: action.payload.metadata[0].current_page,
          count: action.payload.metadata[0].totalRecord,
        },
        loadingDownline: false,
      };
    },

    myLegTeamUpdated(state, action) {
      return {
        ...state,
        myLegTeamList: {
          data: action?.payload?.data,
          page: action?.payload?.metadata[0]?.current_page,
          count: action?.payload?.metadata[0]?.totalRecord,
        },
        loadingLegTeam: false,
      };
    },
    loadingLegTeam(state) {
      return {
        ...state,
        loadingLegTeam: true,
      };
    },

    totalLevelWiseTeamUpdated(state, action) {
      return {
        ...state,
        levelWiseTeamList: {
          data: action.payload,
          count: action.payload.length,
        },
        loadingDownline: false,
      };
    },

    teamsSearchParameterUpdated(state, action) {
      return {
        ...state,
        sortingParams: action.payload,
      };
    },

    levelSummaryUpdated(state, action) {
      return {
        ...state,
        levelSummary: action.payload,
        loadingLevelSummary: false,
      };
    },
    levelUsersUpdated(state, action) {
      return {
        ...state,
        levelUsers: {
          data: action.payload.data,
          page: action.payload.page,
          count: action.payload.count,
        },
        loadingLevelUsers: false,
      };
    },
    loadingLevelSummary(state) {
      return {
        ...state,
        loadingLevelSummary: true,
      };
    },
    loadingLevelUsers(state) {
      return {
        ...state,
        loadingLevelUsers: true,
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
  loadingTreeStructure,
  resetDownline,
  totalTeamUpdated,
  totalLevelWiseTeamUpdated,
  teamsSearchParameterUpdated,

  levelSummaryUpdated,
  levelUsersUpdated,
  loadingLevelSummary,
  loadingLevelUsers,

  loadingDirectDownline,
  myLegTeamUpdated,
  loadingLegTeam,
} = teamSlice.actions;
export default teamSlice.reducer;
