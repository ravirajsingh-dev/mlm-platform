import api from "@src/utils/axiosSetup";

import { setAlert } from "./alert";
import { setErrorsList } from "./errors";
import { removeErrors } from "@src/reducers/errors";
import { logout } from "./auth";

import {
  currentBalanceUpdated,
  transactionsUpdated,
  walletError,
  loadingCurrentBalance,
  loadingTransactions,
  loadingOnWalletRequestSubmit,
  walletRequestCreated,
  walletRequestListUpdated,
  loadingWalletRequestList,
  EPUserLoaded,
} from "@src/reducers/walletReducer";
import { loadUser } from "./auth";

const inflightBalanceByUser = new Map();

// Fetch Current Wallet Balance
export const fetchCurrentBalance = (user_id) => async (dispatch) => {
  const key = String(user_id);
  if (inflightBalanceByUser.has(key)) {
    return inflightBalanceByUser.get(key);
  }
  const promise = (async () => {
    dispatch(removeErrors());
    dispatch(loadingCurrentBalance());
    try {
      const res = await api.get(`/api/wallet/${user_id}/balance`);
      if (res.data.status === true) {
        dispatch(currentBalanceUpdated(res.data.response));
      } else {
        const errors = res.data.errors;
        if (errors) {
          dispatch(walletError());
          dispatch(setAlert(res.data.message, "danger"));
          errors.forEach((error) => {
            dispatch(setErrorsList(error.msg, error.param));
          });
        }
      }
      return res.data ? res.data : { status: false };
    } catch (err) {
      console.error("Error fetching current balance:", err);
      if (
        err.response &&
        err.response.data &&
        err.response.data.tokenStatus === 0
      ) {
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
    } finally {
      inflightBalanceByUser.delete(key);
    }
  })();
  inflightBalanceByUser.set(key, promise);
  return promise;
};

// Fetch Wallet Transactions
export const fetchWalletTransactions =
  (user_id, params) => async (dispatch) => {
    try {
      dispatch(removeErrors());
      dispatch(loadingTransactions());

      // Ensure params has required properties with defaults
      const safeParams = {
        limit: Number(params?.limit) || 20,
        page: Number(params?.page) || 1,
        orderBy: params?.orderBy || "createdAt",
        ascending: params?.ascending || "desc",
        query: params?.query || "",
        filters: Array.isArray(params?.filters) ? params.filters : [],
      };

      // Prepare query parameters
      // Backend expects filters as JSON string in query params
      const queryParams = {
        limit: safeParams.limit,
        page: safeParams.page,
        orderBy: safeParams.orderBy,
        ascending: safeParams.ascending,
        query: safeParams.query,
        filters: JSON.stringify(safeParams.filters),
      };

      const config = {
        params: queryParams,
      };

      const res = await api.get(`/api/wallet/${user_id}/transactions`, config);
      if (res.data.status === true) {
        dispatch(transactionsUpdated(res.data.response[0]));
      } else {
        const errors = res.data.errors;
        if (errors) {
          dispatch(walletError());
          dispatch(setAlert(res.data.message, "danger"));
          errors.forEach((error) => {
            dispatch(setErrorsList(error.msg, error.param));
          });
        }
      }
      return res.data ? res.data : { status: false };
    } catch (err) {
      if (
        err.response &&
        err.response.data &&
        err.response.data.tokenStatus === 0
      ) {
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

export const transferWalletToWalletByEPID =
  (formData, navigate) => async (dispatch) => {
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
        },
        allowDuplicates: true,
      };

      //   dispatch(loadingOnEPinSubmit());

      let res = await api.post(`/api/wallet/transfer`, formData, config);

      if (res.data.status === true) {
        navigate(`/user/wallet`);
        dispatch(epinCreated(res.data.response));
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

export const transferEPooltoECashByEPID =
  (formData, navigate) => async (dispatch) => {
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
        },
        allowDuplicates: true,
      };

      //   dispatch(loadingOnEPinSubmit());

      let res = await api.post(
        `/api/wallet/transfer-epool-to-ecash`,
        formData,
        config
      );

      if (res.data.status === true) {
        navigate(`/user/wallet`);
        dispatch(epinCreated(res.data.response));
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

// Reset Wallet Errors
export const removeWalletErrors = () => async (dispatch) => {
  dispatch(removeErrors());
};

export const setErrors = (errors) => async (dispatch) => {
  if (errors) {
    dispatch(walletError());
    dispatch(setAlert("Please correct the following errors", "danger"));
    errors.forEach((error) => {
      dispatch(setErrorsList(error.msg, error.param));
    });
  }
};

// Entry to E-Pool
export const entryToEPool = (user_id) => async (dispatch) => {
  dispatch(removeErrors());
  try {
    const res = await api.post(`/api/wallet/entry-e-pool`);
    if (res.data.status === true) {
      dispatch(setAlert(res.data.message, "success"));
      // Refresh the current balance
      dispatch(fetchCurrentBalance(user_id));
      // Refresh user data to update has_entered_e_pool flag
      dispatch(loadUser(null));
      return { status: true, data: res.data.response };
    } else {
      const errors = res.data.errors;
      if (errors) {
        dispatch(walletError());
        dispatch(setAlert(res.data.message, "danger"));
        errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.param));
        });
      }
      return { status: false, message: res.data.message };
    }
  } catch (err) {
    console.error("Error entering E-Pool:", err);
    if (
      err.response &&
      err.response.data &&
      err.response.data.tokenStatus === 0
    ) {
      dispatch(logout());
    } else {
      err.response &&
        dispatch(
          walletError({
            msg: err.response.statusText,
            status: err.response.status,
          })
        );
      dispatch(
        setAlert(
          err.response?.data?.message || "Failed to enter E-Pool",
          "danger"
        )
      );
    }
    return {
      status: false,
      message: err.response?.data?.message || "Failed to enter E-Pool",
    };
  }
};
