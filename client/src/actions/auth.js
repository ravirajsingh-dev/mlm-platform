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
  saveUserCredentials,
  removeUserCredentials,
} from "@src/utils/credentialsHelper";

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
  sponsorUserLoaded,
  setLoadingOnForgotPasswordStep1,
  forgotPasswordStep1Success,
  forgotPasswordStep1Error,
  setLoadingOnForgotPasswordStep2,
  forgotPasswordStep2Success,
  forgotPasswordStep2Error,
  loadingOnRegisterSubmit,
} from "@reducers/auth";

export const login = (formData, navigate) => async (dispatch) => {
  dispatch(removeErrors());
  dispatch(loadingOnLoginSubmit());
  dispatch(removeAlert());
  try {
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
      allowDuplicates: true,
    };

    const res = await api.post(`/api/auth`, formData, config);

    if (res.data.status === true) {
      const { accessToken, refreshToken, user, sessionID } = res.data.response;
      dispatch(loginSuccess({ user, accessToken, refreshToken, sessionID }));
      setAuthToken(accessToken);
      setAuthRefreshToken(refreshToken);
      setSessionID(sessionID);

      navigate("/user/dashboard");

      dispatch(setAlert("Login successfully", "success"));

      //Remember me - Save credentials to localStorage
      if (formData.rememberPassword) {
        saveUserCredentials(formData.EP_ID, formData.password);
      } else {
        removeUserCredentials();
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
    dispatch(loadingOnRegisterSubmit());

    const config = {
      headers: {
        "Content-Type": "application/json",
      },
      allowDuplicates: true,
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

      console.log("res.data.response", res.data.response);

      const { accessToken, sessionID, refreshToken } = res.data.response;

      const { EP_ID } = res?.data?.response?.user;

      setAuthToken(accessToken);
      setAuthRefreshToken(refreshToken);
      setSessionID(sessionID);

      // const submitData = {
      //   ...formData,
      //   EP_ID: EP_ID,
      // };

      // dispatch(login(submitData, navigate));
    } else {
      const errors = res.data.errors;

      if (errors) {
        dispatch(setAlert(res.data.message, "danger"));
        errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
        });
      }
    }

    return res.data ? res?.data?.response?.user : { status: false };
  } catch (errors) {
    if (errors.response) {
      let errorMessage =
        errors.response.data.message || errors.response.statusText;

      // Check if there's an array of errors in the response data
      if (
        errors.response.data.errors &&
        Array.isArray(errors.response.data.errors)
      ) {
        // Extract all messages from the errors array
        const errorMessages = errors.response.data.errors.map(
          (error) => error.msg
        );
        errorMessage = errorMessages.join(", ");
      }

      dispatch(
        registerFail({
          msg: errorMessage,
          status: errors.response.status,
        })
      );
      dispatch(setAlert("Data not valid please try again", "danger"));
      errors.response.data.errors.forEach((error) => {
        dispatch(setErrorsList(error.msg, error.path));
      });
      return errors.response.data;
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

//
export const getSponsorUserDetails = (sponsor_id) => async (dispatch) => {
  try {
    const res = await api.get(`/api/auth/sponsor-user/${sponsor_id}`);

    if (res.data.status === true) {
      dispatch(sponsorUserLoaded(res.data.response));
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
      dispatch(setAlert(error.message, "danger"));
      error?.errors.forEach((error) => {
        dispatch(setErrorsList(error.msg, error.path));
      });
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

//Logout from current device
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

//Logout from all devices
export const logoutAll = () => async (dispatch) => {
  const config = { headers: { "Content-Type": "application/json" } };
  try {
    dispatch(removeAlert());
    dispatch(removeErrors());

    const res = await api.put(`/api/auth/logout-all`, {}, config);

    if (res.data.status === true) {
      dispatch(logoutAuthActions());
      dispatch(setAlert("Logged out from all devices successfully.", "success"));
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

// Forgot Password Step 1: Verify EP ID
export const forgotPasswordStep1 = (EP_ID) => async (dispatch) => {
  try {
    dispatch(removeErrors());
    dispatch(setLoadingOnForgotPasswordStep1());
    dispatch(removeAlert());

    const config = {
      "Content-Type": "application/json",
    };

    const res = await api.post(
      `/api/auth/forgot-password/verify`,
      { EP_ID },
      config
    );

    if (res.data.status === true) {
      dispatch(forgotPasswordStep1Success(res.data.response));
      return res.data.response; // Return data for component usage
    } else {
      dispatch(forgotPasswordStep1Error());
      const errors = res.data.errors;
      if (errors && errors.length > 0) {
        dispatch(setAlert(res.data.message, "danger"));
        errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
        });
      }
      throw new Error(res.data.message || "Verification failed");
    }
  } catch (err) {
    console.log("error from forgot password step1:", err);
    const errors = err.response?.data?.errors;
    if (errors && errors.length > 0) {
      dispatch(
        setAlert(err.response?.data?.message || "Verification failed", "danger")
      );
      errors.forEach((error) => {
        dispatch(setErrorsList(error.msg, error.path));
      });
    } else {
      dispatch(setAlert(err.message || "Verification failed", "danger"));
    }
    dispatch(forgotPasswordStep1Error());
    throw err; // Re-throw for component handling
  }
};

// Forgot Password Step 2: Reset Password
export const forgotPasswordStep2 = (EP_ID, phone) => async (dispatch) => {
  try {
    dispatch(removeErrors());
    dispatch(setLoadingOnForgotPasswordStep2());
    dispatch(removeAlert());

    const config = {
      "Content-Type": "application/json",
    };

    const res = await api.post(
      `/api/auth/forgot-password/reset`,
      { EP_ID, phone },
      config
    );

    if (res.data.status === true) {
      dispatch(forgotPasswordStep2Success(res.data));
      return res.data; // Return data for component usage
    } else {
      dispatch(forgotPasswordStep2Error());
      const errors = res.data.errors;
      if (errors && errors.length > 0) {
        dispatch(setAlert(res.data.message, "danger"));
        errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
        });
      }
      throw new Error(res.data.message || "Password reset failed");
    }
  } catch (err) {
    console.log("error from forgot password step2:", err);
    const errors = err.response?.data?.errors;
    if (errors && errors.length > 0) {
      dispatch(
        setAlert(
          err.response?.data?.message || "Password reset failed",
          "danger"
        )
      );
      errors.forEach((error) => {
        dispatch(setErrorsList(error.msg, error.path));
      });
    } else {
      dispatch(setAlert(err.message || "Password reset failed", "danger"));
    }
    dispatch(forgotPasswordStep2Error());
    throw err; // Re-throw for component handling
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
      dispatch(loadUser());
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
