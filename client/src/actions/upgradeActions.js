import api from "@src/utils/axiosSetup";

import { setAlert, removeAlert } from "./alert";
import { setErrorsList } from "./errors";
import { removeErrors } from "@src/reducers/errors";

import {
  loadingOnUpgradeSubmit,
  upgradeSuccess,
  upgradeError,
  loadingLevelsList,
  levelsListUpdated,
} from "@src/reducers/upgradeReducer";

export const getLevelsList = () => async (dispatch) => {
  dispatch(removeErrors());
  dispatch(removeAlert());
  dispatch(loadingLevelsList());
  try {
    const config = { headers: { "Content-Type": "application/json" } };

    const res = await api.get(`/api/user/upgrade/level/list`, config);

    if (res.data.status === true) {
      dispatch(levelsListUpdated(res.data.response));
    } else {
      const errors = res.data.errors;
      if (errors) {
        errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
        });
      }

      dispatch(
        upgradeError({
          msg: res.data.message || res.statusText,
          status: res.status,
        })
      );
    }
    return res.data ? res.data : { status: false };
  } catch (err) {
    console.log(err);
    if (err.response) {
      dispatch(
        upgradeError({
          msg: err.response.data.message || err.response.statusText,
          status: err.response.status,
        })
      );
      dispatch(
        setAlert(err.response.data.message || err.response.statusText, "danger")
      );
      return err.response.data;
    }
  }
};

export const loadPage = () => async (dispatch) => {
  dispatch(removeAlert());
  dispatch(removeErrors());
};

export const setErrors = (errors) => async (dispatch) => {
  if (errors) {
    dispatch(upgradeError());
    dispatch(setAlert("Please correct the following errors", "danger"));
    errors.forEach((error) => {
      dispatch(setErrorsList(error.msg, error.path));
    });
  }
};

// reset errors
export const removeUpgradeErrors = () => async (dispatch) => {
  dispatch(removeErrors());
};
