import api from "@src/utils/axiosSetup";
import { setAlert } from "./alert";
import { setErrorsList } from "./errors";
import { removeErrors } from "@src/reducers/errors";
import { adminLogout } from "./adminAuth";
import {
  depositRequestListUpdated,
  depositRequestError,
  depositRequestDetailsById,
  loadingDepositRequestsList,
  loadingOnDepositRequestSubmit,
  depositRequestSearchParameterUpdate,
  resetDepositRequest,
  depositRequestApproved,
  depositRequestRejected,
} from "@reducers/adminDepositsReducer";

export const getAllDepositRequests = (depositParams) => async (dispatch) => {
  try {
    const config = {
      "Content-Type": "application/json",
    };

    const query = depositParams.query ? depositParams.query : "";
    depositParams.query = query;
    config.params = depositParams;

    dispatch(loadingDepositRequestsList());

    const res = await api.get(`/api/admin/users/deposits/list`, config);

    dispatch(depositRequestSearchParameterUpdate(depositParams));
    dispatch(depositRequestListUpdated(res.data.response[0]));
  } catch (err) {
    console.error(err.response);
    if (err.response.data && err.response.data.tokenStatus === 0) {
      dispatch(adminLogout());
    } else {
      err.response &&
        dispatch(
          depositRequestError({
            msg: err.response.statusText,
            status: err.response.status,
          })
        );

      dispatch(setAlert(err.response.message, "danger"));
    }
  }
};

export const getDepositRequestById = (deposit_id) => async (dispatch) => {
  dispatch(removeErrors());
  dispatch(loadingOnDepositRequestSubmit());
  try {
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };
    const res = await api.get(
      `/api/admin/users/deposits/${deposit_id}`,
      config
    );

    dispatch(depositRequestDetailsById(res.data.response));
    return res.data ? res.data.response : { status: false };
  } catch (err) {
    if (err.response.data && err.response.data.tokenStatus === 0) {
      dispatch(adminLogout());
    } else {
      err.response &&
        dispatch(
          depositRequestError({
            msg: err.response.statusText,
            status: err.response.status,
          })
        );

      dispatch(setAlert(err.response.message, "danger"));
    }
  }
};

export const approveDepositRequest =
  (deposit_id, navigate) => async (dispatch) => {
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
        },
      };
      const res = await api.put(
        `/api/admin/users/deposits/${deposit_id}/approve`,
        {},
        config
      );

      if (res.data.status === true) {
        dispatch(depositRequestApproved(deposit_id));
        dispatch(setAlert("Deposit request approved.", "success"));
        navigate("/admin/users/deposit-requests/list");
      } else {
        dispatch(setAlert("Failed to approve deposit request.", "danger"));
      }
    } catch (err) {
      if (err.response.data && err.response.data.tokenStatus === 0) {
        dispatch(adminLogout());
      } else {
        err.response &&
          dispatch(
            depositRequestError({
              msg: err.response.statusText,
              status: err.response.status,
            })
          );

        dispatch(setAlert(err.response.message, "danger"));
      }
    }
  };

export const rejectDepositRequest =
  (deposit_id, navigate) => async (dispatch) => {
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
        },
      };
      const res = await api.put(
        `/api/admin/users/deposits/${deposit_id}/reject`,
        {},
        config
      );

      if (res.data.status === true) {
        dispatch(depositRequestRejected(deposit_id));
        dispatch(setAlert("Deposit request rejected.", "success"));
        navigate("/admin/users/deposit-requests/list");
      } else {
        dispatch(setAlert("Failed to reject deposit request.", "danger"));
      }
    } catch (err) {
      if (err.response.data && err.response.data.tokenStatus === 0) {
        dispatch(adminLogout());
      } else {
        err.response &&
          dispatch(
            depositRequestError({
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
  navigate("/admin/deposits");
};

// reset errors
export const removeDepositRequestErrors = () => async (dispatch) => {
  dispatch(removeErrors());
};

// Dispatch Reset store
export const resetComponentStore = () => async (dispatch) => {
  await dispatch(resetDepositRequest());
};

export const setErrors = (errors) => async (dispatch) => {
  if (errors) {
    dispatch(depositRequestError());
    dispatch(setAlert("Please correct the following errors", "danger"));
    errors.forEach((error) => {
      dispatch(setErrorsList(error.msg, error.path));
    });
  }
};
