import api from "@src/utils/axiosSetup";
import { removeAlert, setAlert } from "./alert";
import { setErrorsList } from "./errors";
import { removeErrors } from "@src/reducers/errors";
import { adminLogout } from "./adminAuth";
import {
  withdrawalDefaultValuesListUpdated,
  withdrawalDefaultValuesError,
  loadingWithdrawalDefaultValuesList,
  loadingOnWithdrawalDefaultValuesSubmit,
  resetWithdrawalDefaultValues,
  withdrawalDefaultValuesUpserted,
} from "@reducers/adminWithdrawalDefaultValuesReducer";

// Get all withdrawal default values
export const getAllWithdrawalDefaultValues = () => async (dispatch) => {
  try {
    dispatch(loadingWithdrawalDefaultValuesList());

    const res = await api.get(`/api/admin/default-values/withdrawal/list`);

    dispatch(withdrawalDefaultValuesListUpdated(res.data.response));
  } catch (err) {
    console.error(err.response);
    if (err.response.data && err.response.data.tokenStatus === 0) {
      dispatch(adminLogout());
    } else {
      err.response &&
        dispatch(
          withdrawalDefaultValuesError({
            msg: err.response.statusText,
            status: err.response.status,
          })
        );

      dispatch(setAlert(err.response.message, "danger"));
    }
  }
};

// Upsert withdrawal default values
export const upsertWithdrawalDefaultValues =
  (formData, withdrawalDefaultValueID = null) =>
  async (dispatch) => {
    dispatch(removeErrors());
    dispatch(loadingOnWithdrawalDefaultValuesSubmit());
    dispatch(removeAlert());
    try {
      if (withdrawalDefaultValueID) {
        formData.withdrawalDefaultValueID = withdrawalDefaultValueID;
      }

      const res = await api.post(
        `/api/admin/default-values/withdrawal/create`,
        formData
      );

      if (res.data.status === true) {
        dispatch(withdrawalDefaultValuesUpserted(res.data.response));
        dispatch(setAlert("Withdrawal default values upserted.", "success"));
      } else {
        dispatch(
          setAlert("Failed to upsert withdrawal default values.", "danger")
        );
      }
    } catch (err) {
      if (err.response.data && err.response.data.tokenStatus === 0) {
        dispatch(adminLogout());
      } else {
        err.response &&
          dispatch(
            withdrawalDefaultValuesError({
              msg: err.response.statusText,
              status: err.response.status,
            })
          );

        dispatch(setAlert(err.response.message, "danger"));
      }
    }
  };

// Reset store
export const resetComponentStore = () => async (dispatch) => {
  await dispatch(resetWithdrawalDefaultValues());
};
