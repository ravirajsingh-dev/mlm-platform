import api from "@src/utils/axiosSetup";
import { setAlert, removeAlert } from "./alert";
import { setErrorsList } from "./errors";
import { removeErrors } from "@src/reducers/errors";
import { adminLogout } from "./adminAuth";

import {
  paymentMethodCreated,
  resetPaymentMethod,
  loadPaymentMethodPage,
  paymentMethodUpdated,
  paymentMethodDeleted,
  paymentMethodError,
  paymentMethodDetailsById,
  paymentMethodsListUpdated,
  paymentMethodSearchParameterUpdate,
  loadingOnPaymentMethodSubmit,
  loadingPaymentMethodsList,
} from "@reducers/adminPaymentMethodsReducer";

export const getPaymentMethodsList =
  (paymentMethodParams) => async (dispatch) => {
    try {
      const config = {
        "Content-Type": "application/json",
      };

      const query = paymentMethodParams.query ? paymentMethodParams.query : "";
      paymentMethodParams.query = query;
      config.params = paymentMethodParams;

      dispatch(loadingPaymentMethodsList());

      const res = await api.get(`/api/admin/payment-methods/list`, config);

      dispatch(paymentMethodSearchParameterUpdate(paymentMethodParams));
      dispatch(paymentMethodsListUpdated(res.data.response[0]));
    } catch (err) {
      console.error(err.response);
      if (err.response.data && err.response.data.tokenStatus === 0) {
        dispatch(adminLogout());
      } else {
        err.response &&
          dispatch(
            paymentMethodError({
              msg: err.response.statusText,
              status: err.response.status,
            })
          );

        dispatch(setAlert(err.response.message, "danger"));
      }
    }
  };

// Get Payment Method by id
export const getPaymentMethodById = (paymentMethod_id) => async (dispatch) => {
  dispatch(removeErrors());
  dispatch(loadingOnPaymentMethodSubmit());
  try {
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };
    const res = await api.get(
      `/api/admin/payment-methods/${paymentMethod_id}`,
      config
    );

    dispatch(paymentMethodDetailsById(res.data.response));
    return res.data ? res.data.response : { status: false };
  } catch (err) {
    if (err.response.data && err.response.data.tokenStatus === 0) {
      dispatch(adminLogout());
    } else {
      err.response &&
        dispatch(
          paymentMethodError({
            msg: err.response.statusText,
            status: err.response.status,
          })
        );

      dispatch(setAlert(err.response.message, "danger"));
    }
  }
};

export const createPaymentMethod = (formData, navigate) => async (dispatch) => {
  try {
    const config = {
      "Content-Type": "application/json",
    };

    dispatch(loadingOnPaymentMethodSubmit());

    const res = await api.post(`/api/admin/payment-methods`, formData, config);
    if (res.data.status === true) {
      dispatch(paymentMethodCreated(res.data.response));
      dispatch(setAlert("Payment Method Created.", "success"));
      navigate(`/admin/payment-methods/list`);
    } else {
      const errors = res.data.errors;
      if (errors) {
        dispatch(paymentMethodError());
        dispatch(setAlert(res.data.message, "danger"));

        errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
        });
      }
    }
    return res.data ? res.data : { status: false };
  } catch (err) {
    console.error(err);
    if (err.response.data && err.response.data.tokenStatus === 0) {
      dispatch(adminLogout());
    } else {
      err.response &&
        dispatch(
          paymentMethodError({
            msg: err.response.statusText,
            status: err.response.status,
          })
        );

      dispatch(setAlert(err.response.message, "danger"));
    }
  }
};

// Edit Payment Method
export const editPaymentMethod =
  (formData, navigate, paymentMethod_id) => async (dispatch) => {
    dispatch(removeErrors());
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
        },
      };
      const res = await api.put(
        `/api/admin/payment-methods/${paymentMethod_id}`,
        formData,
        config
      );
      if (res.data.status === true) {
        dispatch(paymentMethodUpdated(res.data.response));
        dispatch(setAlert("Payment Method Updated.", "success"));
        navigate(`/admin/payment-methods/list`);
      } else {
        const errors = res.data.errors;
        if (errors) {
          dispatch(paymentMethodError());
          dispatch(setAlert(res.data.message, "danger"));

          errors.forEach((error) => {
            dispatch(setErrorsList(error.msg, error.path));
          });
        }
      }
      return res.data ? res.data : { status: false };
    } catch (err) {
      if (err.response.data && err.response.data.tokenStatus === 0) {
        dispatch(adminLogout());
      } else {
        err.response &&
          dispatch(
            paymentMethodError({
              msg: err.response.statusText,
              status: err.response.status,
            })
          );

        dispatch(setAlert(err.response.message, "danger"));
      }
    }
  };

// Delete Payment Method
export const deletePaymentMethod = (paymentMethod_id) => async (dispatch) => {
  try {
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };
    await api.delete(`/api/admin/payment-methods/${paymentMethod_id}`, config);

    dispatch(paymentMethodDeleted(paymentMethod_id));
    dispatch(setAlert("Payment Method deleted", "success"));
  } catch (err) {
    err.response &&
      dispatch(
        paymentMethodError({
          msg: err.response.statusText,
          status: err.response.status,
        })
      );
  }
};

export const cancelSave = (navigate) => async (dispatch) => {
  dispatch(removeErrors());
  navigate("/admin/payment-methods");
};

// Reset errors
export const removePaymentMethodErrors = () => async (dispatch) => {
  dispatch(removeErrors());
};

// Dispatch Reset store
export const resetComponentStore = () => async (dispatch) => {
  await dispatch(resetPaymentMethod());
};

export const setErrors = (errors) => async (dispatch) => {
  if (errors) {
    dispatch(paymentMethodError());
    dispatch(setAlert("Please correct the following errors", "danger"));
    errors.forEach((error) => {
      dispatch(setErrorsList(error.msg, error.path));
    });
  }
};
