// axios with token
import api from "@src/utils/axiosSetup";

// Custom imports
import { setAlert, removeAlert } from "./alert";
import { setErrorsList } from "./errors";
import {
  setAuthRefreshToken,
  setAuthToken,
  setSessionID,
} from "@src/utils/setAuthToken";
import { getRefreshToken, getToken } from "@src/utils/getAuthToken";
import { decodeToken } from "@src/utils/helper";
import {
  saveAdminCredentials,
  removeAdminCredentials,
} from "@src/utils/credentialsHelper";
import { updateSidebarExpended } from "@src/reducers/adminAuth";

// Reducers
import { removeErrors } from "@reducers/errors";

import {
  adminLoaded,
  registerSuccess,
  adminLoginSuccess,
  registerFail,
  adminAuthError,
  logoutAdminAuth,
  adminLoginFail,
  loadingOnAdminLoginSubmit,
  registerError,
  adminAuthTokenRefresh,
  setLoadingOnChangePassword,
  changePasswordSuccess,
  changePasswordError,
} from "@reducers/adminAuth";

export const adminLogin = (formData, navigate) => async (dispatch) => {
  dispatch(removeErrors());
  dispatch(loadingOnAdminLoginSubmit());
  dispatch(removeAlert());
  try {
    // Admin authentication must use admin_id only - map formData to admin_id
    const submitData = {
      admin_id: formData.admin_id,
      password: formData.password,
    };

    const config = { headers: { "Content-Type": "application/json" } };

    const res = await api.post(`/api/auth/admin`, submitData, config);

    if (res.data.status === true) {
      const { accessToken, refreshToken, user, sessionID } = res.data.response;
      dispatch(
        adminLoginSuccess({ user, accessToken, refreshToken, sessionID })
      );
      setAuthToken(accessToken);
      setAuthRefreshToken(refreshToken);
      setSessionID(sessionID);

      navigate("/admin/dashboard");
      dispatch(setAlert("Login successfully", "success"));

      //Remember me - Save admin credentials to localStorage (matching client pattern)
      if (formData.rememberPassword && submitData.admin_id) {
        saveAdminCredentials(submitData.admin_id, submitData.password);
      } else {
        removeAdminCredentials();
      }
    } else {
      const errors = res.data.errors;
      if (errors) {
        dispatch(setAlert(res.data.message, "danger"));
        errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
        });
      }
      dispatch(
        adminLoginFail({
          msg: res.response.data.message || res.response.statusText,
          status: res.response.status,
        })
      );
    }
    return res.data ? res.data : { status: false };
  } catch (err) {
    console.log("error from auth:", err);
    const errors = err.response?.data?.errors;
    if (errors && errors.length > 0) {
      dispatch(setAlert(err.response.data.message, "danger"));
      errors.forEach((error) => {
        dispatch(setErrorsList(error.msg, error.path));
      });
    }

    if (err.response) {
      dispatch(
        adminLoginFail({
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

export const adminRegister = (formData, navigate) => async (dispatch) => {
  try {
    dispatch(removeAlert());
    dispatch(removeErrors());
    const config = {
      "Content-Type": "application/json",
    };

    const res = await api.post(`/api/auth/admins/register`, formData, config);

    if (res.data.status === true) {
      dispatch(registerSuccess(res.data.response));

      const { accessToken, sessionID, refreshToken } = res.data.response;

      setAuthToken(accessToken);
      setAuthRefreshToken(refreshToken);
      setSessionID(sessionID);

      dispatch(login(formData, navigate));
      setAlert("Register successfully", 200);
    } else {
      const errors = res.data.errors;

      if (errors) {
        dispatch(setAlert(res.data.message, "danger"));
        errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
        });
      }
    }
  } catch (err) {
    if (err.response) {
      dispatch(
        registerFail({
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

export const loadAdmin = (navigate) => async (dispatch) => {
  try {
    const res = await api.get(`/api/auth/admin/load-admin`);

    if (res.data.status === true) {
      dispatch(adminLoaded(res.data.response));
    } else {
      const errors = res.data.errors;
      if (errors) {
        dispatch(setAlert(res.data.message, "danger"));
      }
    }
  } catch (err) {
    console.log("err", err);
    const error = err?.response?.data;
    if (error) {
      dispatch(setAlert(error.msg, "danger"));
    }
  }
};

export const logoutAuthActions = () => async (dispatch) => {
  setAuthToken("");
  setAuthRefreshToken("");
  setSessionID("");
  dispatch(logoutAdminAuth());
};

export const refreshAccessToken = (navigate) => async (dispatch) => {
  try {
    const oldRefreshToken = getRefreshToken();
    if (!oldRefreshToken) {
      dispatch(logoutAuthActions());
      return new Error("Refresh token not found");
    }

    const res = await api.post(`/api/auth/admin/refresh-token`, {
      refreshToken: oldRefreshToken,
    });

    if (res.data.status) {
      const { accessToken, refreshToken, sessionID, admin } = res.data.response;
      dispatch(updateAuthTokens(accessToken, refreshToken, sessionID, admin));
      dispatch(loadAdmin(navigate));
    }
  } catch (error) {
    dispatch(logoutAuthActions());
    console.error("Failed to refresh access token:", error);
    const errors = error?.response?.data;
    if (errors) {
      dispatch(setAlert(error.msg, "danger"));
    }
  }
};

export const updateAuthTokens =
  (accessToken, refreshToken, sessionID, admin) => (dispatch) => {
    dispatch(
      adminAuthTokenRefresh({ accessToken, refreshToken, sessionID, admin })
    );
    setAuthToken(accessToken);
    setAuthRefreshToken(refreshToken);
    setSessionID(sessionID);
  };

export const initializeAdminAuth = (navigate) => async (dispatch) => {
  const token = getToken();
  const oldRefreshToken = getRefreshToken();

  if (!token || !oldRefreshToken) {
    dispatch(logoutAuthActions());
    return;
  }

  if (token) {
    const decodedToken = decodeToken(token);
    const currentTime = Math.floor(Date.now() / 1000);

    if (decodedToken.exp < currentTime) {
      dispatch(refreshAccessToken(navigate));
    } else {
      setAuthToken(token);
      dispatch(loadAdmin(navigate));
    }
  }
};

//Logout from current device
export const adminLogout = () => async (dispatch) => {
  const config = { headers: { "Content-Type": "application/json" } };
  try {
    dispatch(removeAlert());
    dispatch(removeErrors());

    const oldRefreshToken = getRefreshToken();

    if (!oldRefreshToken) {
      dispatch(logoutAuthActions());
      return;
    }

    const res = await api.put(
      `/api/auth/admin/logout`,
      { refreshToken: oldRefreshToken },
      config
    );

    if (res.data.status === true) {
      dispatch(logoutAuthActions());
    } else {
      const errors = res.data.errors;
      if (errors) {
        dispatch(setAlert(res.data.message, "danger"));
        errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
        });
      }
    }
  } catch (err) {
    if (err.response) {
      if (err.response.data && err.response.data.tokenStatus === 0) {
        dispatch(setAlert(err.response.data.msg, "danger"));
        dispatch(logoutAuthActions());
        dispatch(removeErrors());
      } else {
        dispatch(
          adminAuthError({
            msg: err.response.statusText,
            status: err.response.status,
          })
        );
        dispatch(
          setAlert(
            err.response.data.message || err.response.statusText,
            "danger"
          )
        );
      }
    }
  }
};

//Logout from all devices
export const adminLogoutAll = () => async (dispatch) => {
  const config = { headers: { "Content-Type": "application/json" } };
  try {
    dispatch(removeAlert());
    dispatch(removeErrors());

    const res = await api.put(`/api/auth/admin/logout-all`, {}, config);

    if (res.data.status === true) {
      dispatch(logoutAuthActions());
      dispatch(
        setAlert("Logged out from all devices successfully.", "success")
      );
    } else {
      const errors = res.data.errors;
      if (errors) {
        dispatch(setAlert(res.data.message, "danger"));
        errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
        });
      }
    }
  } catch (err) {
    if (err.response) {
      if (err.response.data && err.response.data.tokenStatus === 0) {
        dispatch(setAlert(err.response.data.msg, "danger"));
        dispatch(logoutAuthActions());
        dispatch(removeErrors());
      } else {
        dispatch(
          adminAuthError({
            msg: err.response.statusText,
            status: err.response.status,
          })
        );
        dispatch(
          setAlert(
            err.response.data.message || err.response.statusText,
            "danger"
          )
        );
      }
    }
  }
};

// Change password
export const changePassword = (formData) => async (dispatch) => {
  try {
    dispatch(removeErrors());
    dispatch(setLoadingOnChangePassword());
    dispatch(removeAlert());
    const config = {
      "Content-Type": "application/json",
    };

    const res = await api.post(
      `/api/auth/admin/change-password`,
      formData,
      config
    );

    if (res.data.status === true) {
      dispatch(changePasswordSuccess(res.data.response));
    } else {
      dispatch(changePasswordError());
      const errors = res.data.errors;
      if (errors.length > 0) {
        dispatch(setAlert(err.response.data.message, "danger"));
        errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
        });
      }
    }
  } catch (err) {
    console.log("error from change password:", err);
    const errors = err.response?.data?.errors;
    if (errors.length > 0) {
      dispatch(setAlert(err.response.data.message, "danger"));
      errors.forEach((error) => {
        dispatch(setErrorsList(error.msg, error.path));
      });
    }
    dispatch(changePasswordError());
  }
};

export const setTxnPassword = (formData, navigate) => async (dispatch) => {
  try {
    dispatch(removeErrors());
    dispatch(setLoadingOnChangePassword());
    dispatch(removeAlert());
    const config = {
      "Content-Type": "application/json",
    };
    console.log("calling from tnx pass");
    const res = await api.post(
      `/api/auth/admin/set-txn-password`,
      formData,
      config
    );

    if (res.data.status === true) {
      dispatch(changePasswordSuccess(res.data.response));
      dispatch(setAlert(res.data.message, "success"));
      navigate("/admin/credentials/create");
    } else {
      dispatch(changePasswordError());
      const errors = res.data.errors;
      if (errors.length > 0) {
        dispatch(setAlert(err.response.data.message, "danger"));
        errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
        });
      }
    }
  } catch (err) {
    console.log("error from change password:", err);
    const errors = err.response?.data?.errors;
    if (errors.length > 0) {
      dispatch(setAlert(err.response.data.message, "danger"));
      errors.forEach((error) => {
        dispatch(setErrorsList(error.msg, error.path));
      });
    }
    dispatch(changePasswordError());
  }
};

export const changeTxnPassword = (formData, navigate) => async (dispatch) => {
  try {
    dispatch(removeErrors());
    dispatch(setLoadingOnChangePassword());
    dispatch(removeAlert());
    const config = {
      "Content-Type": "application/json",
    };

    const res = await api.post(
      `/api/auth/admin/change-txn-password`,
      formData,
      config
    );

    if (res.data.status === true) {
      dispatch(changePasswordSuccess(res.data.response));
      dispatch(setAlert(res.data.message, "success"));
      navigate("/admin/dashboard");
    } else {
      dispatch(changePasswordError());
      const errors = res.data.errors;
      if (errors.length > 0) {
        dispatch(setAlert(err.response.data.message, "danger"));
        errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
        });
      }
    }
  } catch (err) {
    console.log("error from change password:", err);
    const errors = err.response?.data?.errors;
    if (errors.length > 0) {
      dispatch(setAlert(err.response.data.message, "danger"));
      errors.forEach((error) => {
        dispatch(setErrorsList(error.msg, error.path));
      });
    }
    dispatch(changePasswordError());
  }
};

// sidebar update
export const updateSidebarExpendedAction = () => async (dispatch) => {
  dispatch(await updateSidebarExpended());
};

export const removeAllErrors = () => async (dispatch) => {
  dispatch(removeErrors());
};

// Redirect to Login screen
export const loginRedirect = (history, type) => async (dispatch) => {
  dispatch(removeAlert());
  dispatch(removeErrors());
  history.push("/");
};

export const loadPage = () => async (dispatch) => {
  dispatch(removeAlert());
  dispatch(removeErrors());
};

export const setErrors = (errors) => async (dispatch) => {
  if (errors) {
    dispatch(registerError());
    dispatch(setAlert("Please correct the following errors", "danger"));

    errors.forEach((error) => {
      dispatch(setErrorsList(error.msg, error.path));
    });
  }
};

export const removeAdminLoginErrors = () => async (dispatch) => {
  dispatch(removeErrors());
};
