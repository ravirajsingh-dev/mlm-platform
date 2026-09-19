import api from "@src/utils/axiosSetup";
import { setAlert, removeAlert } from "./alert";
import { setErrorsList } from "./errors";
import { removeErrors } from "@src/reducers/errors";
import { adminLogout } from "./adminAuth";
import {
  loadingDashboard,
  dashboardDataLoaded,
  dashboardError,
} from "@src/reducers/adminDashboard";

let inflightAdminDashboardFetch = null;

// Fetch Admin Dashboard Data
export const fetchAdminDashboardData = () => async (dispatch) => {
  if (inflightAdminDashboardFetch) {
    return inflightAdminDashboardFetch;
  }
  inflightAdminDashboardFetch = (async () => {
    dispatch(removeErrors());
    dispatch(removeAlert());
    dispatch(loadingDashboard());
    try {
      const res = await api.get(`/api/admin/dashboard`);

      if (res.data.status === true) {
        dispatch(dashboardDataLoaded(res.data.response));
      } else {
        const errors = res.data.errors;
        if (errors) {
          dispatch(dashboardError());

          errors.forEach((error) => {
            dispatch(setErrorsList(error.msg, error.path));
            dispatch(setAlert(error.msg, "danger"));
          });
        }
      }
      return res.data ? res.data : { status: false };
    } catch (err) {
      if (err.response?.data?.tokenStatus === 0) {
        dispatch(adminLogout());
      } else {
        err.response &&
          dispatch(
            dashboardError({
              msg: err.response.statusText,
              status: err.response.status,
            })
          );

        dispatch(setAlert(err.response?.message, "danger"));
      }
    } finally {
      inflightAdminDashboardFetch = null;
    }
  })();
  return inflightAdminDashboardFetch;
};

// reset errors
export const removeAdminDashboardErrors = () => async (dispatch) => {
  dispatch(removeErrors());
};
