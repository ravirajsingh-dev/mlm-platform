import api from "@src/utils/axiosSetup";
import { setAlert } from "./alert";
import { setErrorsList } from "./errors";
import { removeErrors } from "@src/reducers/errors";
import { logout } from "./auth";

import {
  epinCreated,
  resetEPin,
  loadEPinPage,
  epinError,
  epinListUpdated,
  epinSearchParameterUpdate,
  loadingOnEPinSubmit,
  loadingEPinsList,
  EPUserLoaded,
  loadingEPinRequestsList,
  epinRequestListUpdated,
  loadingEPinTransferReportsList,
  epinTransferReportListUpdated,
} from "@src/reducers/adminEPinsReducer";

export const getEPinsList = (epinParams) => async (dispatch) => {
  try {
    const config = {
      "Content-Type": "application/json",
    };

    const query = epinParams.query ? epinParams.query : "";
    epinParams.query = query;
    config.params = epinParams;

    dispatch(loadingEPinsList());

    const res = await api.get(`/api/admin/e-pins`, config);

    dispatch(epinSearchParameterUpdate(epinParams));
    dispatch(epinListUpdated(res.data.response[0]));
  } catch (err) {
    console.error(err.response);
    if (err.response.data && err.response.data.tokenStatus === 0) {
      dispatch(logout());
    } else {
      err.response &&
        dispatch(
          epinError({
            msg: err.response.statusText,
            status: err.response.status,
          })
        );

      dispatch(setAlert(err.response.message, "danger"));
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

export const createEPinForEPUser = (formData, navigate) => async (dispatch) => {
  try {
    const config = {
      "Content-Type": "application/json",
    };

    dispatch(loadingOnEPinSubmit());

    let res = await api.post(`/api/admin/e-pins/create`, formData, config);

    if (res.data.status === true) {
      navigate(`/admin/e-pins`);
      dispatch(epinCreated(res.data.response));
      dispatch(setAlert("EPin Created.", "success"));
    } else {
      const errors = res.data.errors;
      if (errors) {
        dispatch(epinError());
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
        dispatch(epinError());
        dispatch(setAlert(err.response.data.message, "danger"));

        errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
        });
      }
    }
  }
};

export const getEPinTransferReport = (epinParams) => async (dispatch) => {
  try {
    const config = {
      "Content-Type": "application/json",
    };

    const query = epinParams.query ? epinParams.query : "";
    epinParams.query = query;
    config.params = epinParams;

    dispatch(loadingEPinTransferReportsList());

    const res = await api.get(`/api/admin/e-pins/transfer-report`, config);

    dispatch(epinSearchParameterUpdate(epinParams));
    dispatch(epinTransferReportListUpdated(res.data.response[0]));
  } catch (err) {
    console.error(err.response);
    if (err.response.data && err.response.data.tokenStatus === 0) {
      dispatch(logout());
    } else {
      err.response &&
        dispatch(
          epinError({
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
  navigate("/admin/e-pins");
};

// Reset errors
export const removeepinErrors = () => async (dispatch) => {
  dispatch(removeErrors());
};

export const removeEPinErrors = () => async (dispatch) => {
  dispatch(removeErrors());
};

// Dispatch Reset store
export const resetComponentStore = () => async (dispatch) => {
  await dispatch(resetEPin());
};

export const setErrors = (errors) => async (dispatch) => {
  if (errors) {
    dispatch(epinError());
    dispatch(setAlert("Please correct the following errors", "danger"));
    errors.forEach((error) => {
      dispatch(setErrorsList(error.msg, error.path));
    });
  }
};

// Load Page/Show Page
export const loadPage = () => async (dispatch) => {
  await dispatch(loadEPinPage());
};
