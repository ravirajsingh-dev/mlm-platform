import api from "@src/utils/axiosSetup";
import { setAlert } from "./alert";
import { setErrorsList } from "./errors";
import { removeErrors } from "@src/reducers/errors";
import { logout } from "./auth";
import {
  withdrawalSettingsLoaded,
  withdrawalRequestCreated,
  withdrawalRequestsListUpdated,
  loadingWithdrawalSettings,
  loadingWithdrawalRequest,
  loadingWithdrawalRequestsList,
  withdrawalError,
} from "@src/reducers/walletReducer";
import { fetchCurrentBalance } from "./walletActions";

/**
 * Fetch withdrawal settings
 */
export const fetchWithdrawalSettings = () => async (dispatch) => {
  dispatch(removeErrors());
  dispatch(loadingWithdrawalSettings());
  try {
    const res = await api.get(`/api/withdrawal/settings`);
    if (res.data.status === true) {
      dispatch(withdrawalSettingsLoaded(res.data.response));
    } else {
      dispatch(withdrawalError());
      dispatch(setAlert(res.data.message, "danger"));
    }
    return res.data ? res.data : { status: false };
  } catch (err) {
    console.error("Error fetching withdrawal settings:", err);
    if (
      err.response &&
      err.response.data &&
      err.response.data.tokenStatus === 0
    ) {
      dispatch(logout());
    } else {
      dispatch(withdrawalError());
      dispatch(
        setAlert(
          err.response?.data?.message || "Failed to fetch withdrawal settings",
          "danger"
        )
      );
    }
    return { status: false };
  }
};

/**
 * Create withdrawal request
 */
export const createWithdrawalRequest =
  (formData, navigate) => async (dispatch) => {
    dispatch(removeErrors());
    dispatch(loadingWithdrawalRequest());
    try {
      const res = await api.post(`/api/withdrawal/request`, formData);
      if (res.data.status === true) {
        dispatch(withdrawalRequestCreated(res.data.response));
        dispatch(setAlert(res.data.message, "success"));
        // Refresh balance and settings
        if (navigate) {
          navigate("/user/withdrawal-layout");
        }
        return { status: true, data: res.data.response };
      } else {
        // Show the actual error message from API
        const errorMessage =
          res.data.message || "Failed to create withdrawal request";
        dispatch(withdrawalError());
        dispatch(setAlert(errorMessage, "danger"));

        const errors = res.data.errors;
        if (errors && Array.isArray(errors)) {
          errors.forEach((error) => {
            dispatch(
              setErrorsList(
                error.msg || errorMessage,
                error.path || error.param
              )
            );
          });
        }
        return { status: false, message: errorMessage };
      }
    } catch (err) {
      console.error("Error creating withdrawal request:", err);
      if (
        err.response &&
        err.response.data &&
        err.response.data.tokenStatus === 0
      ) {
        dispatch(logout());
      } else {
        dispatch(withdrawalError());
        const errors = err.response?.data?.errors;
        const errorMessage =
          err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.msg ||
          "Failed to create withdrawal request";

        if (errors && Array.isArray(errors)) {
          errors.forEach((error) => {
            dispatch(setErrorsList(error.msg, error.path || error.param));
          });
        }

        // Show the actual error message from API
        dispatch(setAlert(errorMessage, "danger"));
      }
      return {
        status: false,
        message:
          err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.msg ||
          "Failed to create withdrawal request",
      };
    }
  };

/**
 * Fetch user's withdrawal requests
 */
export const fetchWithdrawalRequests =
  (page = 1, limit = 10) =>
  async (dispatch) => {
    dispatch(removeErrors());
    dispatch(loadingWithdrawalRequestsList());
    try {
      const res = await api.get(`/api/withdrawal/requests`, {
        params: { page, limit },
      });
      if (res.data.status === true) {
        dispatch(withdrawalRequestsListUpdated(res.data.response));
      } else {
        dispatch(withdrawalError());
        dispatch(setAlert(res.data.message, "danger"));
      }
      return res.data ? res.data : { status: false };
    } catch (err) {
      console.error("Error fetching withdrawal requests:", err);
      if (
        err.response &&
        err.response.data &&
        err.response.data.tokenStatus === 0
      ) {
        dispatch(logout());
      } else {
        dispatch(withdrawalError());
        dispatch(
          setAlert(
            err.response?.data?.message ||
              "Failed to fetch withdrawal requests",
            "danger"
          )
        );
      }
      return { status: false };
    }
  };
