import api from "@src/utils/axiosSetup";
import { setAlert, removeAlert } from "./alert";
import { setErrorsList } from "./errors";
import { removeErrors } from "@src/reducers/errors";
import { logout } from "./auth";

import {
  userUpiCreated,
  resetUserUpi,
  loadUserUpiPage,
  userUpiUpdated,
  userUpiDeleted,
  userUpiError,
  userUpiDetailsById,
  userUpisListUpdated,
  userUpiSearchParameterUpdate,
  loadingOnUserUpiSubmit,
  loadingUserUpisList,
} from "@reducers/userUpisReducer";

export const getUserUpisList = (userUpiParams, user_id) => async (dispatch) => {
  try {
    const config = {
      "Content-Type": "application/json",
    };

    const query = userUpiParams.query ? userUpiParams.query : "";
    userUpiParams.query = query;
    config.params = userUpiParams;

    dispatch(loadingUserUpisList());

    const res = await api.get(`/api/users/upis/${user_id}/list`, config);

    dispatch(userUpiSearchParameterUpdate(userUpiParams));
    dispatch(userUpisListUpdated(res.data.response[0]));
  } catch (err) {
    console.error(err.response);
    if (err.response.data && err.response.data.tokenStatus === 0) {
      dispatch(logout());
    } else {
      err.response &&
        dispatch(
          userUpiError({
            msg: err.response.statusText,
            status: err.response.status,
          })
        );

      dispatch(setAlert(err.response.message, "danger"));
    }
  }
};

// Get User UPI by id
export const getUserUpiById = (userUpi_id) => async (dispatch) => {
  dispatch(removeErrors());
  dispatch(loadingOnUserUpiSubmit());
  try {
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };
    const res = await api.get(`/api/users/upis/${userUpi_id}`, config);

    dispatch(userUpiDetailsById(res.data.response));
    return res.data ? res.data.response : { status: false };
  } catch (err) {
    if (err.response.data && err.response.data.tokenStatus === 0) {
      dispatch(logout());
    } else {
      err.response &&
        dispatch(
          userUpiError({
            msg: err.response.statusText,
            status: err.response.status,
          })
        );

      dispatch(setAlert(err.response.message, "danger"));
    }
  }
};

export const createUserUpi = (formData, navigate) => async (dispatch) => {
  try {
    const config = {
      "Content-Type": "application/json",
    };

    dispatch(loadingOnUserUpiSubmit());

    const res = await api.post(`/api/users/upis/create`, formData, config);
    if (res.data.status === true) {
      navigate(`/user/upis/list`);
      dispatch(userUpiCreated(res.data.response));
      dispatch(setAlert("User UPI Created.", "success"));
    } else {
      const errors = res.data.errors;
      if (errors) {
        dispatch(userUpiError());
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
        dispatch(userUpiError());
        dispatch(setAlert(err.response.data.message, "danger"));

        errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
        });
      }
    }
  }
};

// Edit User UPI
export const editUserUpi = (formData, navigate, upi_id) => async (dispatch) => {
  dispatch(removeErrors());
  try {
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    dispatch(loadingOnUserUpiSubmit());

    const res = await api.put(`/api/users/upis/${upi_id}`, formData, config);
    if (res.data.status === true) {
      dispatch(userUpiUpdated(res.data.response));
      dispatch(setAlert("User UPI Updated.", "success"));
      navigate(`/user/upis/list`);
    } else {
      const errors = res.data.errors;
      if (errors) {
        dispatch(userUpiError());
        dispatch(setAlert(res.data.message, "danger"));

        errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
        });
      }
    }
    return res.data ? res.data : { status: false };
  } catch (err) {
    if (err.response.data && err.response.data.tokenStatus === 0) {
      dispatch(logout());
    } else {
      let errors = err.response.data.errors;

      if (errors) {
        dispatch(userUpiError());
        dispatch(setAlert(err.response.data.message, "danger"));

        errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
        });
      }
    }
  }
};

// Delete User UPI
export const deleteUserUpi = (userUpi_id, txn_password) => async (dispatch) => {
  try {
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    const body = JSON.stringify({ txn_password });

    await api.delete(`/api/users/upis/${userUpi_id}`, {
      data: body,
      ...config,
    });

    dispatch(userUpiDeleted(userUpi_id));
    dispatch(setAlert("User UPI deleted", "success"));
  } catch (err) {
    if (err.response.data && err.response.data.tokenStatus === 0) {
      dispatch(logout());
    } else {
      let errors = err.response.data.errors;

      if (errors) {
        dispatch(userUpiError());
        dispatch(setAlert(err.response.data.message, "danger"));

        errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
        });
      }
    }
  }
};

export const cancelSave = (navigate) => async (dispatch) => {
  dispatch(removeErrors());
  navigate("/admin/user-upis");
};

// Reset errors
export const removeUserUpiErrors = () => async (dispatch) => {
  dispatch(removeErrors());
};

// Dispatch Reset store
export const resetComponentStore = () => async (dispatch) => {
  await dispatch(resetUserUpi());
};

export const setErrors = (errors) => async (dispatch) => {
  if (errors) {
    dispatch(userUpiError());
    dispatch(setAlert("Please correct the following errors", "danger"));
    errors.forEach((error) => {
      dispatch(setErrorsList(error.msg, error.path));
    });
  }
};
