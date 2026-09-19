import { createSlice } from "@reduxjs/toolkit";
import getSessionID from "@utils/getSessionID";
import { getRefreshToken, getToken } from "@utils/getAuthToken";

const initialState = {
  token: getToken(),
  refreshToken: getRefreshToken(),
  sessionID: getSessionID(),
  isAdminAuthenticated: localStorage.getItem("isAdminAuthenticated") === "true",
  adminLoading: true,
  showWelcomeNotificationModal: false,
  loadingRegister: true,
  loadingOnChangePassword: false,
  showChangePassModal: false,
  admin: null,
  isSidebarExpended: false,
  error: {},
};

const adminAuthSlice = createSlice({
  name: "adminAuth",
  initialState,
  reducers: {
    loadAdminAuthPage(state) {
      return {
        ...state,
        adminLoading: false,
      };
    },

    adminAuthTokenRefresh(state, action) {
      const { accessToken, sessionID, refreshToken, admin } = action.payload;

      localStorage.setItem("token", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("sessionID", sessionID);
      localStorage.setItem("isAdminAuthenticated", "true");
      return {
        ...state,
        token: accessToken,
        refreshToken: refreshToken,
        sessionID,
        isAdminAuthenticated: true,
        adminLoading: false,
        admin,
      };
    },

    adminLoaded(state, action) {
      return {
        ...state,
        isAdminAuthenticated: true,
        adminLoading: false,
        admin: action.payload,
      };
    },

    registerSuccess(state) {
      return {
        ...state,
        loadingRegister: false,
      };
    },

    adminLoginSuccess(state, action) {
      const { user, accessToken, sessionID, refreshToken } = action.payload;
      localStorage.setItem("token", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("sessionID", sessionID);
      localStorage.setItem("isAdminAuthenticated", "true");
      return {
        ...state,
        admin: user,
        sessionID,
        token: accessToken,
        refreshToken: refreshToken,
        isAdminAuthenticated: true,
        adminLoading: false,
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

    adminAuthError(state, action) {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("sessionID");
      localStorage.removeItem("isAdminAuthenticated");
      return {
        ...state,
        error: action.payload,
        token: null,
        refreshToken: null,
        isAdminAuthenticated: false,
        adminLoading: false,
        admin: null,
        sessionID: null,
      };
    },

    logoutAdminAuth(state) {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("sessionID");
      localStorage.removeItem("isAdminAuthenticated");
      return {
        ...state,
        token: null,
        refreshToken: null,
        isAdminAuthenticated: false,
        adminLoading: false,
        admin: null,
        sessionID: null,
      };
    },

    adminLoginFail(state) {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("sessionID");
      localStorage.removeItem("isAdminAuthenticated");
      return {
        ...state,
        token: null,
        refreshToken: null,
        isAdminAuthenticated: false,
        adminLoading: false,
        showWelcomeNotificationModal: false,
        admin: null,
        sessionID: null,
      };
    },

    loadingOnAdminLoginSubmit(state) {
      return {
        ...state,
        adminLoading: true,
      };
    },
    registerError(state, action) {
      return {
        ...state,
        error: action.payload,
        adminLoading: false,
        loadingRegister: false,
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
    updateSidebarExpended(state, action) {
      return {
        ...state,
        isSidebarExpended: !state.isSidebarExpended,
      };
    },
  },
});

export const {
  loadAdminAuthPage,
  adminAuthTokenRefresh,
  adminLoaded,
  registerSuccess,
  adminLoginSuccess,
  registerFail,
  adminAuthError,
  logoutAdminAuth,
  adminLoginFail,
  loadingOnAdminLoginSubmit,
  registerError,
  setLoadingOnChangePassword,
  changePasswordSuccess,
  changePasswordError,
  updateSidebarExpended,
} = adminAuthSlice.actions;

export default adminAuthSlice.reducer;
