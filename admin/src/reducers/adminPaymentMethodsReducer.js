import { createSlice } from "@reduxjs/toolkit";
import * as Constants from "../constants/index";

const initialState = {
  paymentMethodsList: {
    page: 1,
    data: [],
    count: 0,
  },
  currentPaymentMethod: {},
  loadingPaymentMethodsList: true,
  loadingPaymentMethod: false,
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

const paymentMethodSlice = createSlice({
  name: "adminPaymentMethods",
  initialState: initialState,
  reducers: {
    paymentMethodCreated(state) {
      state.loadingPaymentMethod = false;
    },
    resetPaymentMethod(state) {
      return {
        ...initialState,
      };
    },
    loadPaymentMethodPage(state) {
      return {
        ...state,
        loadingPaymentMethod: false,
      };
    },
    paymentMethodUpdated(state, action) {
      return {
        ...state,
        currentPaymentMethod: action.payload,
        sortingParams: initialState.sortingParams,
        loadingPaymentMethod: false,
      };
    },
    paymentMethodError(state, action) {
      return {
        ...state,
        error: action.payload,
        loadingPaymentMethod: false,
        loadingPaymentMethodsList: false,
      };
    },
    paymentMethodDeleted(state, action) {
      const currentCount = state.paymentMethodsList.count;
      const currentLimit = state.sortingParams.limit;
      const currentPage = parseInt(state.paymentMethodsList.page);
      const remainingPages = Math.ceil((currentCount - 1) / currentLimit);
      return {
        ...state,
        paymentMethodsList: {
          data: state.paymentMethodsList.data.filter(
            (method) => method._id !== action.payload
          ),
          count: currentCount - 1,
          page:
            currentPage <= remainingPages
              ? currentPage.toString()
              : remainingPages.toString(),
        },
        sortingParams: initialState.sortingParams,
        loadingPaymentMethodsList: false,
      };
    },
    paymentMethodDetailsById(state, action) {
      return {
        ...state,
        currentPaymentMethod: action.payload,
        loadingPaymentMethod: false,
      };
    },
    paymentMethodsListUpdated(state, action) {
      return {
        ...state,
        paymentMethodsList: {
          data: action.payload.data,
          page: action.payload.metadata[0].current_page,
          count: action.payload.metadata[0].totalRecord,
        },
        loadingPaymentMethodsList: false,
      };
    },
    paymentMethodSearchParameterUpdate(state, action) {
      return {
        ...state,
        sortingParams: { ...action.payload },
        loadingPaymentMethodsList: false,
      };
    },
    loadingOnPaymentMethodSubmit(state) {
      return {
        ...state,
        loadingPaymentMethod: true,
      };
    },
    loadingPaymentMethodsList(state) {
      return {
        ...state,
        loadingPaymentMethodsList: true,
      };
    },
  },
});

export const {
  paymentMethodCreated,
  resetPaymentMethod,
  loadPaymentMethodPage,
  paymentMethodUpdated,
  paymentMethodError,
  paymentMethodDeleted,
  paymentMethodDetailsById,
  paymentMethodsListUpdated,
  paymentMethodSearchParameterUpdate,
  loadingOnPaymentMethodSubmit,
  loadingPaymentMethodsList,
} = paymentMethodSlice.actions;
export default paymentMethodSlice.reducer;
