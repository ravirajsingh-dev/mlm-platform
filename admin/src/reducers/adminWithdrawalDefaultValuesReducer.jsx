import { createSlice } from "@reduxjs/toolkit";
import * as Constants from "../constants/index";

const initialState = {
  withdrawalDefaultValuesList: {
    data: [],
    count: 0,
  },
  currentWithdrawalDefaultValues: {},
  loadingWithdrawalDefaultValuesList: true,
  loadingWithdrawalDefaultValues: false,
  error: {},
};

const withdrawalDefaultValuesSlice = createSlice({
  name: "adminWithdrawalDefaultValues",
  initialState: initialState,
  reducers: {
    resetWithdrawalDefaultValues(state) {
      return {
        ...initialState,
      };
    },
    withdrawalDefaultValuesUpdated(state, action) {
      return {
        ...state,
        currentWithdrawalDefaultValues: action.payload,
        loadingWithdrawalDefaultValues: false,
      };
    },
    withdrawalDefaultValuesError(state, action) {
      return {
        ...state,
        error: action.payload,
        loadingWithdrawalDefaultValues: false,
        loadingWithdrawalDefaultValuesList: false,
      };
    },

    withdrawalDefaultValuesListUpdated(state, action) {
      return {
        ...state,
        withdrawalDefaultValuesList: {
          data: action.payload,
          count: action.payload.length,
        },
        loadingWithdrawalDefaultValuesList: false,
      };
    },
    loadingOnWithdrawalDefaultValuesSubmit(state) {
      return {
        ...state,
        loadingWithdrawalDefaultValues: true,
      };
    },
    loadingWithdrawalDefaultValuesList(state) {
      return {
        ...state,
        loadingWithdrawalDefaultValuesList: true,
      };
    },
    withdrawalDefaultValuesUpserted(state, action) {
      return {
        ...state,
        currentWithdrawalDefaultValues: action.payload,
        loadingWithdrawalDefaultValues: false,
      };
    },
  },
});

export const {
  resetWithdrawalDefaultValues,
  withdrawalDefaultValuesUpdated,
  withdrawalDefaultValuesError,
  withdrawalDefaultValuesListUpdated,
  loadingOnWithdrawalDefaultValuesSubmit,
  loadingWithdrawalDefaultValuesList,
  withdrawalDefaultValuesUpserted,
} = withdrawalDefaultValuesSlice.actions;
export default withdrawalDefaultValuesSlice.reducer;
