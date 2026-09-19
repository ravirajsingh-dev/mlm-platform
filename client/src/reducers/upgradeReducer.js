import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  loading: false,
  loadingUpgrade: false,
  error: {},
  user: null,
  profileImageError: null,
  levelsList: [],
  loadingLevelsList: false,
};

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    upgradeError(state, action) {
      return {
        ...state,
        error: action.payload,
        loading: false,
        loadingUpgrade: false,
      };
    },
    loadingOnUpgradeSubmit(state, action) {
      return {
        ...state,
        loadingUpgrade: true,
      };
    },
    upgradeSuccess(state, action) {
      return {
        ...state,
        loadingUpgrade: false,
      };
    },
    loadingLevelsList(state) {
      return {
        ...state,
        loadingLevelsList: true,
      };
    },
    levelsListUpdated(state, action) {
      return {
        ...state,
        levelsList: action.payload,
        loadingLevelsList: false,
      };
    },
  },
});

export const {
  loadingOnUpgradeSubmit,
  upgradeError,
  upgradeSuccess,
  loadingLevelsList,
  levelsListUpdated,
} = profileSlice.actions;
export default profileSlice.reducer;
