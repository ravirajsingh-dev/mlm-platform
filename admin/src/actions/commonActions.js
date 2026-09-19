import { removeErrors } from "@src/reducers/errors";
import { removeAlertMsg } from "@src/reducers/alert";
import { setAlert } from "./alert";
import { setErrorsList } from "./errors";
import api from "@src/utils/axiosSetup";
import {
  servicesListUpdated,
  productsListUpdated,
  productServicesListUpdated,
  productServiceCategoriesListUpdated,
  loadingOnGenerateQRCode,
  generateQRCodeUpdated,
  adminPrimeCredentialListUpdated,
  adminDetailsUpdated,
  userDashboardDetailsUpdated,
  EPUserLoaded,
} from "@src/reducers/commonReducer";

export const getServicesList = () => async (dispatch) => {
  try {
    const config = { headers: { "Content-Type": "application/json" } };

    const res = await api.get(`/api/common/services-list`, config);

    dispatch(servicesListUpdated(res.data.response));
    return res.data ? res.data : { status: false };
  } catch (err) {
    console.log(err);
    if (err.response.data && err.response.data.tokenStatus === 0) {
      dispatch(logout());
    }
  }
};

export const getDashboardStash = (user_id) => async (dispatch) => {
  try {
    const config = { headers: { "Content-Type": "application/json" } };

    console.log("");

    const res = await api.get(`/api/common/dashboard-stash/${user_id}`, config);

    console.log("res.data.response", res.data.response);

    dispatch(userDashboardDetailsUpdated(res.data.response));
    return res.data ? res.data : { status: false };
  } catch (err) {
    console.log(err);
    if (err.response.data && err.response.data.tokenStatus === 0) {
      dispatch(logout());
    }
  }
};

export const getProductsList = () => async (dispatch) => {
  try {
    const config = { headers: { "Content-Type": "application/json" } };

    const res = await api.get(`/api/common/products-list`, config);

    dispatch(productsListUpdated(res.data.response));
    return res.data ? res.data : { status: false };
  } catch (err) {
    console.log(err);
    if (err.response.data && err.response.data.tokenStatus === 0) {
      dispatch(logout());
    }
  }
};

export const getProductServicesListByID = (product_id) => async (dispatch) => {
  try {
    const config = { headers: { "Content-Type": "application/json" } };

    const res = await api.get(
      `/api/common/product-services/${product_id}/list-full`,
      config
    );

    dispatch(productServicesListUpdated(res.data.response));
    return res.data ? res.data : { status: false };
  } catch (err) {
    console.log(err);
    if (err.response.data && err.response.data.tokenStatus === 0) {
      dispatch(logout());
    }
  }
};

export const getProductServiceCategoriesListByID =
  (product_service_id) => async (dispatch) => {
    try {
      const config = { headers: { "Content-Type": "application/json" } };

      const res = await api.get(
        `/api/common/services-categories/${product_service_id}`,
        config
      );

      dispatch(productServiceCategoriesListUpdated(res.data.response));
      return res.data ? res.data : { status: false };
    } catch (err) {
      console.log(err);
      if (err.response.data && err.response.data.tokenStatus === 0) {
        dispatch(logout());
      }
    }
  };

export const getAdminDetails = () => async (dispatch) => {
  try {
    const config = { headers: { "Content-Type": "application/json" } };

    const res = await api.get(`/api/common/admin/details`, config);

    dispatch(adminDetailsUpdated(res.data.response));
    return res.data ? res.data : { status: false };
  } catch (err) {
    console.log(err);
    if (err.response.data && err.response.data.tokenStatus === 0) {
      dispatch(logout());
    }
  }
};

// Get EP_ID Details
export const getEPDetails = (e2e_id) => async (dispatch) => {
  try {
    const res = await api.get(`/api/common/user/${e2e_id}`);

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

export const removeAllErrors = () => async (dispatch) => {
  console.log("Ue");
  dispatch(removeErrors());
  dispatch(removeAlertMsg());
};
