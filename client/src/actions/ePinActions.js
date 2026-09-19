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
  epinsQRCodeUpdated,
  adminCredentialLoaded,
  onLoadingQRCode,
  loadingEPinRequestsList,
  epinRequestListUpdated,
  loadingEPinTransferReportsList,
  epinTransferReportListUpdated,
} from "@src/reducers/ePinsReducer";

export const getEPinsList = (epinParams) => async (dispatch) => {
  try {
    const config = {
      "Content-Type": "application/json",
    };

    const query = epinParams.query ? epinParams.query : "";
    epinParams.query = query;

    const params = { ...epinParams };
    if (
      epinParams.filters &&
      Array.isArray(epinParams.filters) &&
      epinParams.filters.length > 0
    ) {
      params.filters = JSON.stringify(epinParams.filters);
    } else {
      // Don't include filters if empty
      delete params.filters;
    }

    config.params = params;

    dispatch(loadingEPinsList());

    const res = await api.get(`/api/user/e-pins`, config);

    dispatch(epinSearchParameterUpdate(epinParams));
    dispatch(epinListUpdated(res.data.response));
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
    const res = await api.get(`/api/user/e-pins/sponsor-user/${sponsor_id}`);

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

// Transfer EP-Keys

export const transferEPin = (formData, navigate) => async (dispatch) => {
  try {
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
      allowDuplicates: true,
    };

    dispatch(loadingOnEPinSubmit());

    let res = await api.post(`/api/user/e-pins/transfer`, formData, config);

    if (res.data.status === true) {
      navigate(`/user/epins/transfer-reports`);
      dispatch(epinCreated(res.data.response));
      dispatch(setAlert(res.data.message, "success"));
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

    const res = await api.get(`/api/user/e-pins/transfer-report`, config);

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
  navigate("/user/e-pins");
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
