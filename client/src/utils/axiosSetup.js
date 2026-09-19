import axios from "axios";
import { getRefreshToken, getToken } from "./getAuthToken";
import getSessionID from "./getSessionID";
import store from "@src/store";
import { setAuthToken, setAuthRefreshToken, setSessionID } from "./setAuthToken";
import { logoutAuth, authTokenRefresh } from "@src/reducers/auth";

const api = axios.create();

const ongoingRequests = new Map();

const getRequestKey = (config) => {
  const { method, url, params, data } = config;
  return [method, url, JSON.stringify(params), JSON.stringify(data)].join("&");
};

const removeRequest = (requestKey) => {
  if (ongoingRequests.has(requestKey)) {
    ongoingRequests.delete(requestKey);
  }
};

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const requestKey = getRequestKey(config);

    // Check for duplicate request unless explicitly allowed
    if (!config.allowDuplicates && ongoingRequests.has(requestKey)) {
      return Promise.reject(new Error("Duplicate request in progress"));
    }

    const source = axios.CancelToken.source();
    config.cancelToken = source.token;
    ongoingRequests.set(requestKey, source);

    // Set Headers
    const token = getToken();
    if (token) {
      config.headers["x-auth-token"] = token;
    }

    const refreshToken = getRefreshToken();
    if (refreshToken) {
      config.headers["x-auth-refresh-token"] = refreshToken;
    }

    const sessionID = getSessionID();
    if (sessionID) {
      config.headers["x-session-id"] = sessionID;
    } else {
      console.warn("Session ID is missing");
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
api.interceptors.response.use(
  (response) => {
    const requestKey = getRequestKey(response.config);
    removeRequest(requestKey);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const { dispatch } = store;

    const requestKey = getRequestKey(originalRequest);
    removeRequest(requestKey);

    // Token expired - attempt to refresh
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const oldRefreshToken = getRefreshToken();
        if (!oldRefreshToken) {
          // Break circular dependency: dispatch reducer directly and clear tokens
          setAuthToken();
          setAuthRefreshToken();
          setSessionID();
          dispatch(logoutAuth());
          return Promise.reject(new Error("No refresh token available"));
        }

        const endpoint = `/api/auth/refresh-token`;
        const response = await axios.post(endpoint, {
          refreshToken: oldRefreshToken,
        });

        const {
          accessToken,
          refreshToken: newRefreshToken,
          sessionID,
        } = response.data.response;

        // Break circular dependency: update tokens and dispatch reducer directly
        setAuthToken(accessToken);
        setAuthRefreshToken(newRefreshToken);
        setSessionID(sessionID);
        dispatch(authTokenRefresh({ accessToken, refreshToken: newRefreshToken, sessionID }));

        originalRequest.headers["x-auth-token"] = accessToken;

        // Retry the original request
        const retrySource = axios.CancelToken.source();
        originalRequest.cancelToken = retrySource.token;
        ongoingRequests.set(getRequestKey(originalRequest), retrySource);

        return api(originalRequest);
      } catch (refreshError) {
        // Break circular dependency: dispatch reducer directly and clear tokens
        setAuthToken();
        setAuthRefreshToken();
        setSessionID();
        dispatch(logoutAuth());
        console.error("Token refresh failed:", refreshError);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Reuse in-flight GET promises (same URL + params) to avoid duplicate reads under Strict Mode / rapid remounts.
const inflightGet = new Map();
const getGetDedupeKey = (url, config) => {
  const params = (config && config.params) || {};
  return ["get", url, JSON.stringify(params), ""].join("&");
};
const rawGet = api.get.bind(api);
api.get = (url, config = {}) => {
  if (config.allowDuplicates) {
    return rawGet(url, config);
  }
  const key = getGetDedupeKey(url, config);
  const existing = inflightGet.get(key);
  if (existing) {
    return existing;
  }
  const p = rawGet(url, config).finally(() => {
    inflightGet.delete(key);
  });
  inflightGet.set(key, p);
  return p;
};

export default api;
