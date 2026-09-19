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
// import { rememberUserCredentials } from "@src/utils/credentialsHelper";

// Reducers
import { removeErrors } from "@reducers/errors";
import {
  userLoaded,
  registerSuccess,
  loginSuccess,
  registerFail,
  authError,
  logoutAuth,
  loginFail,
  loadingOnLoginSubmit,
  registerError,
  authTokenRefresh,
  setLoadingOnChangePassword,
  changePasswordSuccess,
  changePasswordError,
  updateUserSidebarExpended,
} from "@reducers/auth";

export const login = (formData, navigate) => async (dispatch) => {
  dispatch(removeErrors());
  dispatch(loadingOnLoginSubmit());
  dispatch(removeAlert());
  try {
    const config = { headers: { "Content-Type": "application/json" } };

    const res = await api.post(`/api/auth`, formData, config);

    if (res.data.status === true) {
      const { accessToken, refreshToken, user, sessionID } = res.data.response;
      dispatch(loginSuccess({ user, accessToken, refreshToken, sessionID }));
      setAuthToken(accessToken);
      setAuthRefreshToken(refreshToken);
      setSessionID(sessionID);

      navigate("/user/dashboard");

      dispatch(setAlert("Login successfully", "success"));

      //Remember me

      // if (formData.rememberPassword) {
      //   rememberUserCredentials(formData, "email_or_selfSponsorID_or_phone");
      // }
    } else {
      const errors = res.data.errors;
      if (errors) {
        dispatch(setAlert(res.data.message, "danger"));
        errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
        });
      }
      dispatch(
        loginFail({
          msg: res.response.data.message || res.response.statusText,
          status: res.response.status,
        })
      );
    }
    return res.data ? res.data : { status: false };
  } catch (err) {
    console.log("error from auth:", err);
    const errors = err.response?.data?.errors;
    if (errors.length > 0) {
      dispatch(setAlert(err.response.data.message, "danger"));
      errors.forEach((error) => {
        dispatch(setErrorsList(error.msg, error.path));
      });
    }

    if (err.response) {
      dispatch(
        loginFail({
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

export const register = (formData, navigate) => async (dispatch) => {
  try {
    dispatch(removeAlert());
    dispatch(removeErrors());
    const config = {
      "Content-Type": "application/json",
    };

    const res = await api.post(`/api/auth/users/register`, formData, config);

    if (res.data.status === true) {
      dispatch(registerSuccess(res.data.response));
      dispatch(
        setAlert(
          "You’re all set for the EP Max Community. Please hold on for login details",
          "success"
        )
      );

      const { accessToken, sessionID, refreshToken } = res.data.response;

      setAuthToken(accessToken);
      setAuthRefreshToken(refreshToken);
      setSessionID(sessionID);

      const submitData = {
        ...formData,
        email_or_selfSponsorID_or_phone: formData.phone || formData.email,
      };

      dispatch(login(submitData, navigate));
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

export const loadUser = (navigate) => async (dispatch) => {
  try {
    const res = await api.get(`/api/auth/load-user`);

    if (res.data.status === true) {
      dispatch(userLoaded(res.data.response));
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
  setAuthToken();
  setAuthRefreshToken();
  setSessionID();
  dispatch(logoutAuth());
};

export const refreshAccessToken = (navigate) => async (dispatch) => {
  try {
    const oldRefreshToken = getRefreshToken();
    if (!oldRefreshToken) {
      dispatch(logoutAuthActions());
      return new Error("Refresh token not found");
    }

    const res = await api.post(`/api/auth/refresh-token`, {
      refreshToken: oldRefreshToken,
    });

    if (res.data.status) {
      const { accessToken, refreshToken, sessionID } = res.data.response;
      dispatch(updateAuthTokens(accessToken, refreshToken, sessionID));
      dispatch(loadUser(navigate));
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
  (accessToken, refreshToken, sessionID) => (dispatch) => {
    dispatch(authTokenRefresh({ accessToken, refreshToken, sessionID }));
    setAuthToken(accessToken);
    setAuthRefreshToken(refreshToken);
    setSessionID(sessionID);
  };

export const initializeAuth = (navigate) => async (dispatch) => {
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
      dispatch(loadUser(navigate));
    }
  }
};

//Logout
export const logout = () => async (dispatch) => {
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
      `/api/auth/logout`,
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
          authError({
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
export const changePassword = (formData, navigate) => async (dispatch) => {
  try {
    dispatch(removeErrors());
    dispatch(setLoadingOnChangePassword());
    dispatch(removeAlert());
    const config = {
      "Content-Type": "application/json",
    };

    const res = await api.post(`/api/auth/change-password`, formData, config);

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
    const res = await api.post(`/api/auth/set-txn-password`, formData, config);

    if (res.data.status === true) {
      dispatch(changePasswordSuccess(res.data.response));
      dispatch(setAlert(res.data.message, "success"));
      navigate("/user/credentials/create");
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
      `/api/auth/change-txn-password`,
      formData,
      config
    );

    if (res.data.status === true) {
      dispatch(changePasswordSuccess(res.data.response));
      dispatch(setAlert(res.data.message, "success"));
      navigate("/user/dashboard");
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

export const removeAllErrors = () => async (dispatch) => {
  dispatch(removeErrors());
};

// Redirect to Login screen
export const loginRedirect = (history, type) => async (dispatch) => {
  dispatch(removeAlert());
  dispatch(removeErrors());
  history.push("/login");
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

// sidebar update
export const updateUserSidebarExpendedAction = () => async (dispatch) => {
  dispatch(await updateUserSidebarExpended());
};

// reset errors
export const removeRegistrationErrors = () => async (dispatch) => {
  dispatch(removeErrors());
};
export const removeLoginErrors = () => async (dispatch) => {
  dispatch(removeErrors());
};
