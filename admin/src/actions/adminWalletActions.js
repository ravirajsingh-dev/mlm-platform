import api from "@src/utils/axiosSetup";
import { setAlert } from "./alert";
import { setErrorsList } from "./errors";
import { removeErrors } from "@src/reducers/errors";
import { logout } from "./auth";

import {
  resetWallet,
  loadWalletPage,
  walletError,
  walletSearchParameterUpdate,
  EPUserLoaded,
  loadingWalletTransferReportsList,
  walletTransferReportListUpdated,
  loadingWalletTransactionsList,
  walletTransactionsListUpdated,
  loadingUsersWalletBalanceList,
  usersWalletBalanceListUpdated,
  loadingUserWalletTransfersList,
  userWalletTransfersListUpdated,
} from "@src/reducers/walletReducer";

// Get EP Sponsor by EP_ID
export const getSponsorUserDetails = (sponsor_id) => async (dispatch) => {
  try {
    const res = await api.get(`/api/auth/sponsor-user/${sponsor_id}`);

    if (res.data.status === true) {
      dispatch(EPUserLoaded(res.data.response));
    } else {
      const errors = res.data.errors;
      if (errors) {
        dispatch(setAlert(res.data.message, "danger"));
      }
    }
  } catch (err) {
    console.log("err", err);
    const error = err?.response?.data;
    if (error && error?.errors.length > 0) {
      dispatch(setAlert(error.message, "error"));
      error?.errors.forEach((error) => {
        dispatch(setErrorsList(error.msg, error.path));
      });
    }
  }
};

export const transferMoneyToEPUser =
  (formData, navigate) => async (dispatch) => {
    try {
      const config = {
        "Content-Type": "application/json",
      };

      //   dispatch(loadingOnEPinSubmit());

      let res = await api.post(`/api/admin/wallet/transfer`, formData, config);

      if (res.data.status === true) {
        navigate(`/admin/e-wallet/transfer-report`);
        dispatch(setAlert("Wallet Successfully Updated.", "success"));
      } else {
        const errors = res.data.errors;
        if (errors) {
          dispatch(walletError());
          dispatch(setAlert(res.data.message, "danger"));

          errors.forEach((error) => {
            dispatch(setErrorsList(error.msg, error.path));
          });
        }
      }
      return res.data ? res.data : { status: false };
    } catch (err) {
      console.error("err", err);
      if (err.response.data && err.response.data.tokenStatus === 0) {
        dispatch(logout());
      } else {
        let errors = err.response.data.errors;

        if (errors) {
          dispatch(walletError());
          dispatch(setAlert(err.response.data.message, "danger"));

          errors.forEach((error) => {
            dispatch(setErrorsList(error.msg, error.path));
          });
        }
      }
    }
  };

export const getWalletTransferReport = (params) => async (dispatch) => {
  try {
    const config = {
      "Content-Type": "application/json",
    };

    const query = params.query ? params.query : "";
    params.query = query;
    config.params = params;

    dispatch(loadingWalletTransferReportsList());

    const res = await api.get(`/api/admin/wallet/transfer-report`, config);

    dispatch(walletSearchParameterUpdate(params));
    dispatch(walletTransferReportListUpdated(res.data.response[0]));
  } catch (err) {
    console.error(err.response);
    if (err.response.data && err.response.data.tokenStatus === 0) {
      dispatch(logout());
    } else {
      err.response &&
        dispatch(
          walletError({
            msg: err.response.statusText,
            status: err.response.status,
          })
        );

      dispatch(setAlert(err.response.message, "danger"));
    }
  }
};

export const cancelSave = (navigate) => async (dispatch) => {
  dispatch(removeErrors());
  navigate("/admin/money-transfer");
};

// Reset errors
export const removeWalletErrors = () => async (dispatch) => {
  dispatch(removeErrors());
};

// Dispatch Reset store
export const resetComponentStore = () => async (dispatch) => {
  await dispatch(resetWallet());
};

export const setErrors = (errors) => async (dispatch) => {
  if (errors) {
    dispatch(walletError());
    dispatch(setAlert("Please correct the following errors", "danger"));
    errors.forEach((error) => {
      dispatch(setErrorsList(error.msg, error.path));
    });
  }
};

// Load Page/Show Page
export const loadPage = () => async (dispatch) => {
  await dispatch(loadWalletPage());
};

// Get Wallet Transactions (for Wallet Details page)
export const getWalletTransactions = (params) => async (dispatch) => {
  try {
    const config = {
      "Content-Type": "application/json",
    };

    const query = params.query ? params.query : {};
    const filters = params.filters || [];
    config.params = {
      ...params,
      query: JSON.stringify(query),
      filters: filters.join(","),
    };

    dispatch(loadingWalletTransactionsList());

    const res = await api.get(`/api/admin/wallet/transactions`, config);

    dispatch(walletSearchParameterUpdate(params));
    dispatch(walletTransactionsListUpdated(res.data.response[0]));
  } catch (err) {
    console.error(err.response);
    if (err.response.data && err.response.data.tokenStatus === 0) {
      dispatch(logout());
    } else {
      err.response &&
        dispatch(
          walletError({
            msg: err.response.statusText,
            status: err.response.status,
          })
        );

      dispatch(setAlert(err.response.message, "danger"));
    }
  }
};

// Get Users Wallet Balance (for E-Cash Balance page)
export const getUsersWalletBalance = (params) => async (dispatch) => {
  try {
    const config = {
      "Content-Type": "application/json",
    };

    const query = params.query ? params.query : {};
    const filters = params.filters || [];
    config.params = {
      ...params,
      query: JSON.stringify(query),
      filters: filters.join(","),
    };

    dispatch(loadingUsersWalletBalanceList());

    const res = await api.get(`/api/admin/wallet/users-balance`, config);

    dispatch(walletSearchParameterUpdate(params));
    dispatch(usersWalletBalanceListUpdated(res.data.response[0]));
  } catch (err) {
    console.error(err.response);
    if (err.response.data && err.response.data.tokenStatus === 0) {
      dispatch(logout());
    } else {
      err.response &&
        dispatch(
          walletError({
            msg: err.response.statusText,
            status: err.response.status,
          })
        );

      dispatch(setAlert(err.response.message, "danger"));
    }
  }
};

// Get User-to-User Wallet Transfers (for Transfer Report page - excludes admin transfers)
export const getUserWalletTransfers = (params) => async (dispatch) => {
  try {
    const config = {
      "Content-Type": "application/json",
    };

    const query = params.query ? params.query : {};
    const filters = params.filters || [];
    config.params = {
      ...params,
      query: JSON.stringify(query),
      filters: filters.join(","),
    };

    dispatch(loadingUserWalletTransfersList());

    const res = await api.get(`/api/admin/wallet/user-transfers`, config);

    dispatch(walletSearchParameterUpdate(params));
    dispatch(userWalletTransfersListUpdated(res.data.response[0]));
  } catch (err) {
    console.error(err.response);
    if (err.response.data && err.response.data.tokenStatus === 0) {
      dispatch(logout());
    } else {
      err.response &&
        dispatch(
          walletError({
            msg: err.response.statusText,
            status: err.response.status,
          })
        );

      dispatch(setAlert(err.response.message, "danger"));
    }
  }
};
