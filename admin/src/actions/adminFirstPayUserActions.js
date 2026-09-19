import api from "@src/utils/axiosSetup";
import { setAlert } from "./alert";
import { setErrorsList } from "./errors";
import { removeErrors } from "@src/reducers/errors";
import { logout } from "./auth";

import {
  firstPayUserCreated,
  resetFirstPayUser,
  loadFirstPayUserPage,
  firstPayUserError,
  firstPayUserListUpdated,
  firstPayUserSearchParameterUpdate,
  loadingOnFirstPayUserSubmit,
  loadingFirstPayUsersList,
  EPUserLoaded,
  levelsListUpdated,
  firstPayUserDeleted,
} from "@src/reducers/adminFirstPayUserReducer";

export const getFirstPayUsersList =
  (firstPayUserParams) => async (dispatch) => {
    try {
      const config = {
        "Content-Type": "application/json",
      };

      const query = firstPayUserParams.query ? firstPayUserParams.query : "";
      firstPayUserParams.query = query;
      config.params = firstPayUserParams;

      dispatch(loadingFirstPayUsersList());

      const res = await api.get(`/api/admin/first-pay-user`, config);

      dispatch(firstPayUserSearchParameterUpdate(firstPayUserParams));
      dispatch(firstPayUserListUpdated(res.data.response[0]));
    } catch (err) {
      console.error(err.response);
      if (err.response.data && err.response.data.tokenStatus === 0) {
        dispatch(logout());
      } else {
        err.response &&
          dispatch(
            firstPayUserError({
              msg: err.response.statusText,
              status: err.response.status,
            })
          );

        dispatch(setAlert(err.response.message, "danger"));
      }
    }
  };

// Get EP Sponsor by EP_ID
export const checkAvailableityOfUserPendingLink =
  (level, EP_ID) => async (dispatch) => {
    try {
      const res = await api.get(
        `/api/admin/first-pay-user/user-details/${level}/${EP_ID}`
      );

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

export const fetchAvailableLevelsList = () => async (dispatch) => {
  try {
    const res = await api.get(`/api/admin/first-pay-user/levels-list`);

    if (res.data.status === true) {
      dispatch(levelsListUpdated(res.data.response));
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

export const createFirstPayUser = (formData, navigate) => async (dispatch) => {
  try {
    const config = {
      "Content-Type": "application/json",
    };

    dispatch(loadingOnFirstPayUserSubmit());

    let res = await api.post(
      `/api/admin/first-pay-user/create`,
      formData,
      config
    );

    if (res.data.status === true) {
      navigate(`/admin/first-pay-user`);
      dispatch(firstPayUserCreated(res.data.response));
      dispatch(setAlert("First Pay User updated.", "success"));
    } else {
      const errors = res.data.errors;
      if (errors) {
        dispatch(firstPayUserError());
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
        dispatch(firstPayUserError());
        dispatch(setAlert(err.response.data.message, "danger"));

        errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
        });
      }
    }
  }
};

// Delete User UPI
export const deleteFirstPayUser =
  (level_id, txn_password) => async (dispatch) => {
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
        },
      };

      const body = JSON.stringify({ txn_password });

      await api.delete(`/api/admin/first-pay-user/delete/${level_id}`, {
        data: body,
        ...config,
      });

      dispatch(firstPayUserDeleted(level_id));
      dispatch(setAlert("Levels Updated.", "success"));
    } catch (err) {
      if (err.response.data && err.response.data.tokenStatus === 0) {
        dispatch(logout());
      } else {
        let errors = err.response.data.errors;

        if (errors) {
          dispatch(firstPayUserError());
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
  navigate("/admin/first-pay-user");
};

// Reset errors
export const removeFirstPayUserErrors = () => async (dispatch) => {
  dispatch(removeErrors());
};

// Dispatch Reset store
export const resetComponentStore = () => async (dispatch) => {
  await dispatch(resetFirstPayUser());
};

export const setErrors = (errors) => async (dispatch) => {
  if (errors) {
    dispatch(firstPayUserError());
    dispatch(setAlert("Please correct the following errors", "error"));
    errors.forEach((error) => {
      dispatch(setErrorsList(error.msg, error.path));
    });
  }
};

// Load Page/Show Page
export const loadPage = () => async (dispatch) => {
  await dispatch(loadFirstPayUserPage());
};
