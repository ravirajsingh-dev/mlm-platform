import { createSlice } from "@reduxjs/toolkit";
import getSessionID from "@utils/getSessionID";
import { getRefreshToken, getToken } from "@utils/getAuthToken";

const initialState = {
  token: getToken(),
  refreshToken: getRefreshToken(),
  sessionID: getSessionID(),
  isAuthenticated: null,
  loading: true,
  showWelcomeNotificationModal: false,
  loadingRegister: true,
  loadingOnChangePassword: false,
  showChangePassModal: false,
  user: null,
  isUserSidebarExpended: false,
  error: {},
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loadAuthPage(state) {
      return {
        ...state,
        loading: false,
      };
    },

    authTokenRefresh(state, action) {
      const { accessToken, sessionID, refreshToken } = action.payload;
      localStorage.setItem("token", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("sessionID", sessionID);
      return {
        ...state,
        token: accessToken,
        refreshToken: refreshToken,
        sessionID,
        isAuthenticated: true,
        loading: false,
      };
    },

    userLoaded(state, action) {
      const { sessionID, accessToken } = action.payload;

      return {
        ...state,
        isAuthenticated: true,
        loading: false,
        user: action.payload,
        sessionID,
        token: accessToken,
      };
    },

    registerSuccess(state) {
      return {
        ...state,
        loadingRegister: false,
      };
    },

    loginSuccess(state, action) {
      const { user, accessToken, sessionID, refreshToken } = action.payload;
      localStorage.setItem("token", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("sessionID", sessionID);
      return {
        ...state,
        user,
        sessionID,
        token: accessToken,
        refreshToken: refreshToken,
        isAuthenticated: true,
        loading: false,
        showWelcomeNotificationModal: true,
        loadingOnChangePassword: false,
        showChangePassModal: false,
      };
    },

    registerFail(state, action) {
      return {
        ...state,
        error: action.payload,
        loadingRegister: false,
      };
    },

    authError(state, action) {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("sessionID");
      return {
        ...state,
        error: action.payload,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        loading: false,
        user: null,
        sessionID: null,
      };
    },

    logoutAuth(state) {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("sessionID");
      return {
        ...state,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        loading: false,
        user: null,
        sessionID: null,
      };
    },

    loginFail(state) {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("sessionID");
      return {
        ...state,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        loading: false,
        showWelcomeNotificationModal: false,
        user: null,
        sessionID: null,
      };
    },

    loadingOnLoginSubmit(state) {
      return {
        ...state,
        loading: true,
      };
    },
    registerError(state, action) {
      return {
        ...state,
        error: action.payload,
        loading: false,
        loadingRegister: false,
      };
    },

    setWelcomeNotificationModalShown(state) {
      return {
        ...state,
        showWelcomeNotificationModal: false,
      };
    },

    // Change password
    setLoadingOnChangePassword(state) {
      return {
        ...state,
        loadingOnChangePassword: true,
        showChangePassModal: false,
      };
    },

    changePasswordSuccess(state, action) {
      return {
        ...state,
        loadingOnChangePassword: false,
        showChangePassModal: true,
      };
    },
    changePasswordError(state, action) {
      return {
        ...state,
        loadingOnChangePassword: false,
        showChangePassModal: false,
      };
    },
    updateUserSidebarExpended(state, action) {
      return {
        ...state,
        isUserSidebarExpended: !state.isUserSidebarExpended,
      };
    },
  },
});

export const {
  loadAuthPage,
  authTokenRefresh,
  userLoaded,
  registerSuccess,
  loginSuccess,
  registerFail,
  authError,
  logoutAuth,
  loginFail,
  loadingOnLoginSubmit,
  registerError,
  setWelcomeNotificationModalShown,
  setLoadingOnChangePassword,
  changePasswordSuccess,
  changePasswordError,
  updateUserSidebarExpended,
} = authSlice.actions;

export default authSlice.reducer;
