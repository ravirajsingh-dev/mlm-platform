import api from "@src/utils/axiosSetup";
import { setAlert } from "./alert";
import { setErrorsList } from "./errors";
import { removeErrors } from "@src/reducers/errors";
import { logout } from "./auth";

import {
  treeDownlineUpdated,
  leftDownlineUpdated,
  rightDownlineUpdated,
  directDownlineUpdated,
  loadingDownline,
  downlineError,
} from "@reducers/downlineReducer";

// Fetch Tree Downline
export const fetchTreeDownline = (user_id) => async (dispatch) => {
  dispatch(removeErrors());
  dispatch(loadingDownline());
  try {
    const res = await api.get(`/api/users/downline/${user_id}/tree`);
    if (res.data.status === true) {
      dispatch(treeDownlineUpdated(res.data.response));
    } else {
      handleErrors(res, dispatch);
    }
    return res.data ? res.data : { status: false };
  } catch (err) {
    handleRequestError(err, dispatch);
  }
};

// Fetch Left Downline
export const fetchLeftDownline = (user_id) => async (dispatch) => {
  dispatch(removeErrors());
  dispatch(loadingDownline());
  try {
    const res = await api.get(`/api/users/downline/${user_id}/left`);
    if (res.data.status === true) {
      dispatch(leftDownlineUpdated(res.data.response));
    } else {
      handleErrors(res, dispatch);
    }
    return res.data ? res.data : { status: false };
  } catch (err) {
    handleRequestError(err, dispatch);
  }
};

// Fetch Right Downline
export const fetchRightDownline = (user_id) => async (dispatch) => {
  dispatch(removeErrors());
  dispatch(loadingDownline());
  try {
    const res = await api.get(`/api/users/downline/${user_id}/right`);
    if (res.data.status === true) {
      dispatch(rightDownlineUpdated(res.data.response));
    } else {
      handleErrors(res, dispatch);
    }
    return res.data ? res.data : { status: false };
  } catch (err) {
    handleRequestError(err, dispatch);
  }
};

// Fetch Direct Downline
export const fetchDirectDownline = (user_id) => async (dispatch) => {
  dispatch(removeErrors());
  dispatch(loadingDownline());
  try {
    const res = await api.get(`/api/users/downline/${user_id}/direct`);
    if (res.data.status === true) {
      dispatch(directDownlineUpdated(res.data.response));
    } else {
      handleErrors(res, dispatch);
    }
    return res.data ? res.data : { status: false };
  } catch (err) {
    handleRequestError(err, dispatch);
  }
};

// Handle Errors
const handleErrors = (res, dispatch) => {
  const errors = res.data.errors;
  if (errors) {
    dispatch(downlineError());
    dispatch(setAlert(res.data.message, "danger"));
    errors.forEach((error) => {
      dispatch(setErrorsList(error.msg, error.path));
    });
  }
};

// Handle Request Errors
const handleRequestError = (err, dispatch) => {
  console.error("Error fetching downline:", err);
  if (
    err.response &&
    err.response.data &&
    err.response.data.tokenStatus === 0
  ) {
    dispatch(logout());
  } else {
    err.response &&
      dispatch(
        downlineError({
          msg: err.response.statusText,
          status: err.response.status,
        })
      );
    dispatch(setAlert(err.response.message, "danger"));
  }
};

// Reset Downline Errors
export const removeDownlineErrors = () => async (dispatch) => {
  dispatch(removeErrors());
};
