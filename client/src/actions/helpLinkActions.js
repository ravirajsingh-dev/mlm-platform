// api with token
import api from "@src/utils/axiosSetup";

import { setAlert } from "./alert";
import { setErrorsList } from "./errors";
import { removeErrors } from "@src/reducers/errors";
import { logout } from "./auth";

import {
  resetHelpLink,
  helpLinkUpdated,
  helpLinkError,
  loadingOnHelpLinkSubmit,
  helpLinkDetailsById,
  sendHelpLinksListUpdated,
  sendHelpLinksSearchParameterUpdated,
  receiveHelpLinksListUpdated,
  receiveHelpLinksSearchParameterUpdated,
  onLoadingQRCode,
  helpLinkQRCodeUpdated,
  loadingSendHelpLinksList,
  loadingReceivePaymentLinksList,
  receiverHelpLinkUpdated,
  loadingDownlinePendingPaymentLinks,
  downlinePendingLinksUpdated,
} from "@src/reducers/helpLinksReducer";

export const getSendPaymentLinksByUserID = (params) => async (dispatch) => {
  try {
    const config = {
      "Content-Type": "application/json",
    };

    const updatedParams = { ...params };
    updatedParams.query = params.query ? params.query : "";
    
    if (
      updatedParams.filters &&
      Array.isArray(updatedParams.filters) &&
      updatedParams.filters.length > 0
    ) {
      updatedParams.filters = JSON.stringify(updatedParams.filters);
    } else {
      delete updatedParams.filters;
    }
    
    config.params = updatedParams;

    dispatch(loadingSendHelpLinksList());

    const res = await api.get(`/api/user/help-link/send`, config);

    dispatch(sendHelpLinksSearchParameterUpdated(updatedParams));
    dispatch(sendHelpLinksListUpdated(res.data.response[0]));
  } catch (err) {
    console.error(err);
    // if (err.response.data && err.response.data.tokenStatus === 0) {
    //   dispatch(logout());
    // } else {
    //   err.response &&
    //     dispatch(
    //       helpLinkError({
    //         msg: err.response.statusText,
    //         status: err.response.status,
    //       })
    //     );

    //   dispatch(setAlert(err.response.message, "danger"));
    // }
  }
};

export const getReceivePaymentLinksByUserID = (params) => async (dispatch) => {
  try {
    const config = {
      "Content-Type": "application/json",
    };

    const updatedParams = { ...params };
    updatedParams.query = params.query ? params.query : "";
    
    if (
      updatedParams.filters &&
      Array.isArray(updatedParams.filters) &&
      updatedParams.filters.length > 0
    ) {
      updatedParams.filters = JSON.stringify(updatedParams.filters);
    } else {
      delete updatedParams.filters;
    }
    
    config.params = updatedParams;

    console.log("updatedParams", updatedParams);

    dispatch(loadingReceivePaymentLinksList());

    const res = await api.get(`/api/user/help-link/receive`, config);

    dispatch(receiveHelpLinksSearchParameterUpdated(updatedParams));
    dispatch(receiveHelpLinksListUpdated(res.data.response[0]));
  } catch (err) {
    console.error(err);
    // if (err.response.data && err.response.data.tokenStatus === 0) {
    //   dispatch(logout());
    // } else {
    //   err.response &&
    //     dispatch(
    //       helpLinkError({
    //         msg: err.response.statusText,
    //         status: err.response.status,
    //       })
    //     );

    //   dispatch(setAlert(err.response.message, "danger"));
    // }
  }
};

export const getDownlinePendingLinks = (params) => async (dispatch) => {
  try {
    const config = {
      "Content-Type": "application/json",
    };

    const updatedParams = { ...params };
    updatedParams.query = params.query ? params.query : "";
    config.params = updatedParams;

    dispatch(loadingDownlinePendingPaymentLinks());

    const res = await api.get(
      `/api/user/help-link/downline-pending-links`,
      config
    );

    dispatch(downlinePendingLinksUpdated(res.data.response[0]));
  } catch (err) {
    console.error(err);
    if (err.response.data && err.response.data.tokenStatus === 0) {
      dispatch(logout());
    } else {
      err.response &&
        dispatch(
          helpLinkError({
            msg: err.response.statusText,
            status: err.response.status,
          })
        );

      dispatch(setAlert(err.response.message, "danger"));
    }
  }
};

export const updateReceivePaymentLinkStatus =
  (help_link_id, value) => async (dispatch) => {
    try {
      const config = {
        "Content-Type": "application/json",
      };

      const res = await api.put(
        `/api/user/help-link/${help_link_id}/update-status`,
        { status: value },
        config
      );

      if (res.data.status === true) {
        dispatch(
          setAlert(res.data.message || "Payment status updated.", "success")
        );
        dispatch(
          receiverHelpLinkUpdated({
            help_link_id: help_link_id,
            data: res.data.response,
          })
        );
      }
    } catch (err) {
      console.error(err);
      if (err.response.data && err.response.data.tokenStatus === 0) {
        dispatch(logout());
      } else {
        err.response &&
          dispatch(
            helpLinkError({
              msg: err.response.statusText,
              status: err.response.status,
            })
          );

        dispatch(setAlert(err.response.message, "danger"));
      }
    }
  };

// Get Help Link by id
export const getHelpLinkById = (helpLink_id) => async (dispatch) => {
  dispatch(removeErrors());
  dispatch(loadingOnHelpLinkSubmit());
  try {
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };
    const res = await api.get(`/api/user/help-link/${helpLink_id}`, config);

    dispatch(helpLinkDetailsById(res.data.response));
    return res.data ? res.data.response : { status: false };
  } catch (err) {
    if (err.response.data && err.response.data.tokenStatus === 0) {
      dispatch(logout());
    } else {
      err.response &&
        dispatch(
          helpLinkError({
            msg: err.response.statusText,
            status: err.response.status,
          })
        );

      dispatch(setAlert(err.response.message, "danger"));
    }
  }
};

// Edit Help Link
export const editHelpLink = (help_link_id, user_id) => async (dispatch) => {
  dispatch(removeErrors());
  try {
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    dispatch(loadingOnHelpLinkSubmit());

    const res = await api.put(
      `/api/user/help-link/${help_link_id}/${user_id}`,

      config
    );
    if (res.data.status === true) {
      dispatch(
        helpLinkUpdated({
          help_link_id: help_link_id,
          data: res.data.response,
        })
      );
      dispatch(setAlert("Help Link Updated.", "success"));
    } else {
      const errors = res.data.errors;
      if (errors) {
        dispatch(helpLinkError());
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
        dispatch(helpLinkError());
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
  navigate("/user/help-links");
};

// Reset errors
export const removeHelpLinkErrors = () => async (dispatch) => {
  dispatch(removeErrors());
};

// Dispatch Reset store
export const resetComponentStore = () => async (dispatch) => {
  await dispatch(resetHelpLink());
};

export const setErrors = (errors) => async (dispatch) => {
  if (errors) {
    dispatch(helpLinkError());
    dispatch(setAlert("Please correct the following errors", "danger"));
    errors.forEach((error) => {
      dispatch(setErrorsList(error.msg, error.path));
    });
  }
};
