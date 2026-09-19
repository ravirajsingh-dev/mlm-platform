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
  sevaKendraUpdated,
  loadingSevaKendra,
  commonSettingsUpdated,
  loadingCommonSettings,
} from "@reducers/commonReducer";
import { removeErrors } from "@src/reducers/errors";
import { removeAlertMsg } from "@src/reducers/alert";
import { setAlert } from "./alert";
import { setErrorsList } from "./errors";
import { logout } from "./auth";
import api from "@src/utils/axiosSetup";

const inflightDashboardByUser = new Map();
let inflightCommonSettings = null;
const COMMON_SETTINGS_CLIENT_TTL_MS = 8000;
let commonSettingsClientCache = { at: 0, payload: null };

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

export const getSevaKendrasList = () => async (dispatch) => {
  try {
    const config = { headers: { "Content-Type": "application/json" } };

    console.log("");

    dispatch(loadingSevaKendra());

    const res = await api.get(`/api/common/seva-kendra`, config);

    console.log("res.data.response", res.data.response[0]);

    dispatch(sevaKendraUpdated(res.data.response[0]));
    return res.data ? res.data : { status: false };
  } catch (err) {
    console.log(err);
    if (err.response.data && err.response.data.tokenStatus === 0) {
      dispatch(logout());
    }
  }
};

export const getDashboardStash = (user_id) => async (dispatch) => {
  const key = String(user_id);
  if (inflightDashboardByUser.has(key)) {
    return inflightDashboardByUser.get(key);
  }
  const promise = (async () => {
    try {
      const config = { headers: { "Content-Type": "application/json" } };

      const res = await api.get(
        `/api/common/dashboard-stash/${user_id}`,
        config
      );

      dispatch(userDashboardDetailsUpdated(res.data.response));
      return res.data ? res.data : { status: false };
    } catch (err) {
      console.log(err);
      if (err.response?.data?.tokenStatus === 0) {
        dispatch(logout());
      }
    } finally {
      inflightDashboardByUser.delete(key);
    }
  })();
  inflightDashboardByUser.set(key, promise);
  return promise;
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

export const getCommonSettings = () => async (dispatch) => {
  const now = Date.now();
  if (
    commonSettingsClientCache.payload &&
    now - commonSettingsClientCache.at < COMMON_SETTINGS_CLIENT_TTL_MS
  ) {
    dispatch(commonSettingsUpdated(commonSettingsClientCache.payload));
    return { status: true, response: commonSettingsClientCache.payload };
  }

  if (inflightCommonSettings) {
    return inflightCommonSettings;
  }
  inflightCommonSettings = (async () => {
    try {
      dispatch(loadingCommonSettings());
      const config = { headers: { "Content-Type": "application/json" } };

      const res = await api.get(`/api/common/settings`, config);

      if (res.data && res.data.status === true) {
        commonSettingsClientCache = {
          at: Date.now(),
          payload: res.data.response,
        };
        dispatch(commonSettingsUpdated(res.data.response));
      }
      return res.data ? res.data : { status: false };
    } catch (err) {
      console.log("Error fetching common settings:", err);
      dispatch(
        commonSettingsUpdated({
          marqueeEnabled: false,
          marqueeMessage: "",
          marqueeType: "warning",
          name: "EK PAHAL",
          contactUs: "",
          email: "",
          address: "",
          planPdfUrl: "",
          socialMedia: {
            instagram: "",
            facebook: "",
            youtube: "",
            zoomMeeting: "",
          },
        })
      );
    } finally {
      inflightCommonSettings = null;
    }
  })();
  return inflightCommonSettings;
};

export const removeAllErrors = () => async (dispatch) => {
  console.log("Ue");
  dispatch(removeErrors());
  dispatch(removeAlertMsg());
};
