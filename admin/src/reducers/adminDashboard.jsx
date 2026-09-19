import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  dashboardData: {},
  loadingDashboard: false,
  error: {},
};

const adminDashboardSlice = createSlice({
  name: "adminDashboard",
  initialState,
  reducers: {
    loadingDashboard(state) {
      return {
        ...state,
        loadingDashboard: true,
      };
    },
    dashboardDataLoaded(state, action) {
      return {
        ...state,
        dashboardData: action.payload,
        loadingDashboard: false,
      };
    },
    dashboardError(state, action) {
      return {
        ...state,
        error: action.payload,
        loadingDashboard: false,
      };
    },
  },
});

export const { loadingDashboard, dashboardDataLoaded, dashboardError } =
  adminDashboardSlice.actions;
export default adminDashboardSlice.reducer;
