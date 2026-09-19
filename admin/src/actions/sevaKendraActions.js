import api from "@src/utils/axiosSetup";
import { setAlert } from "./alert";
import { setErrorsList } from "./errors";
import { removeErrors } from "@src/reducers/errors";
import { logout } from "./auth";

import {
  sevaKendraCreated,
  resetSevaKendra,
  loadSevaKendraPage,
  sevaKendraError,
  sevaKendraListUpdated,
  sevaKendraSearchParameterUpdate,
  loadingOnSevaKendraSubmit,
  loadingSevaKendraList,
  sevaKendraDeleted,
} from "@src/reducers/sevaKendraReducer";

export const getSevaKendrasList = (params) => async (dispatch) => {
  try {
    const config = {
      "Content-Type": "application/json",
    };

    const query = params.query ? params.query : "";
    params.query = query;
    config.params = params;

    dispatch(loadingSevaKendraList());

    const res = await api.get(`/api/admin/seva-kendra`, config);

    dispatch(sevaKendraSearchParameterUpdate(params));
    dispatch(sevaKendraListUpdated(res.data.response[0]));
  } catch (err) {
    console.error(err.response);
    if (err.response.data && err.response.data.tokenStatus === 0) {
      dispatch(logout());
    } else {
      err.response &&
        dispatch(
          sevaKendraError({
            msg: err.response.statusText,
            status: err.response.status,
          })
        );

      dispatch(setAlert(err.response.message, "danger"));
    }
  }
};

export const createSevaKendra = (formData, navigate) => async (dispatch) => {
  try {
    const config = {
      "Content-Type": "application/json",
    };

    dispatch(loadingOnSevaKendraSubmit());

    let res = await api.post(`/api/admin/seva-kendra/create`, formData, config);

    if (res.data.status === true) {
      navigate(`/admin/seva-kendra`);
      dispatch(sevaKendraCreated(res.data.response));
      dispatch(setAlert("First Pay User updated.", "success"));
    } else {
      const errors = res.data.errors?.errors || [];
      dispatch(sevaKendraError());
      dispatch(setAlert(res.data.message, "danger"));

      errors.forEach((error) => {
        dispatch(setErrorsList(error.msg, error.path));
      });
    }

    return res.data ? res.data : { status: false };
  } catch (err) {
    console.error("err", err);

    if (err.response?.data?.tokenStatus === 0) {
      dispatch(logout());
    } else {
      const errors = err.response?.data?.errors?.errors || [];
      dispatch(sevaKendraError());
      dispatch(
        setAlert(err.response?.data?.message || "Server Error", "danger")
      );

      errors.forEach((error) => {
        dispatch(setErrorsList(error.msg, error.path));
      });
    }
  }
};

// Delete User UPI
export const deleteSevaKendra =
  (seva_kendra_id, txn_password) => async (dispatch) => {
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
        },
      };

      const body = JSON.stringify({ txn_password });

      await api.delete(`/api/admin/seva-kendra/delete/${seva_kendra_id}`, {
        data: body,
        ...config,
      });

      dispatch(sevaKendraDeleted(seva_kendra_id));
      dispatch(setAlert("Levels Updated.", "success"));
    } catch (err) {
      if (err.response.data && err.response.data.tokenStatus === 0) {
        dispatch(logout());
      } else {
        let errors = err.response.data.errors;

        if (errors) {
          dispatch(sevaKendraError());
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
  navigate("/admin/seva-kendra");
};

// Reset errors
export const removeSevaKendraErrors = () => async (dispatch) => {
  dispatch(removeErrors());
};

// Dispatch Reset store
export const resetComponentStore = () => async (dispatch) => {
  await dispatch(resetSevaKendra());
};

export const setErrors = (errors) => async (dispatch) => {
  if (errors) {
    dispatch(sevaKendraError());
    dispatch(setAlert("Please correct the following errors", "error"));
    errors.forEach((error) => {
      dispatch(setErrorsList(error.msg, error.path));
    });
  }
};

// Load Page/Show Page
export const loadPage = () => async (dispatch) => {
  await dispatch(loadSevaKendraPage());
};
