// axios with token
import api from "@src/utils/axiosSetup";

import { setAlert } from "./alert";
import { setErrorsList } from "./errors";
import { removeErrors } from "@src/reducers/errors";
import { logout } from "./auth";

import {
  treeDownlineUpdated,
  leftDownlineUpdated,
  rightDownlineUpdated,
  directDownlineUpdated,
  loadingDownline,
  downlineError,
  resetDownline,
  loadingTreeStructure,
  teamsSearchParameterUpdated,
  totalTeamUpdated,
  totalLevelWiseTeamUpdated,
  loadingLevelSummary,
  levelSummaryUpdated,
  levelUsersUpdated,
  loadingLevelUsers,
  loadingDirectDownline,
  loadingLegTeam,
  myLegTeamUpdated,
} from "@reducers/teamReducer";

const updateDataByID = (user, user_id, newData) => {
  return new Promise((resolve, reject) => {
    try {
      if (!user) return;
      let userCopy = { ...user };

      if (user?._id === user_id) {
        userCopy = newData;
        return resolve(userCopy);
      }

      if (Array.isArray(user.team)) {
        Promise.all(
          user.team.map((member) =>
            member?._id ? updateDataByID(member, user_id, newData) : null
          )
        )
          .then((updatedTeam) => {
            userCopy.team = updatedTeam;
            resolve(userCopy);
          })
          .catch(reject);
      } else {
        resolve(userCopy);
      }
    } catch (error) {
      reject(error);
    }
  });
};

const updateDownlineTree = async (treeDownline, user_id, data) => {
  let treeCopy = treeDownline;

  if (!treeCopy?.name) {
    return data;
  }

  const newdata = await updateDataByID(treeCopy, user_id, data);

  return newdata;
};

// Fetch Tree Downline
export const getStructureList = (treeDownline, user_id) => async (dispatch) => {
  dispatch(removeErrors());
  dispatch(loadingTreeStructure());

  try {
    const res = await api.get(`/api/users/downline/${user_id}/structure`);

    if (res.data.status === true) {
      const newData = await updateDownlineTree(
        treeDownline,
        user_id,
        res.data.response
      );

      dispatch(treeDownlineUpdated(newData));
    } else {
      handleErrors(res, dispatch);
    }
    return res.data ? res.data : { status: false };
  } catch (err) {
    handleRequestError(err, dispatch);
  }
};

// Fetch Direct Downline
export const getDirectDownlineList = (user_id) => async (dispatch) => {
  dispatch(removeErrors());
  dispatch(loadingDirectDownline());
  try {
    const res = await api.get(`/api/users/downline/direct`);
    if (res.data.status === true) {
      dispatch(directDownlineUpdated(res.data.response[0]));
    } else {
      handleErrors(res, dispatch);
    }
    return res.data ? res.data : { status: false };
  } catch (err) {
    handleRequestError(err, dispatch);
  }
};

// Handle Errors
const handleErrors = (res, dispatch) => {
  const errors = res.data.errors;
  if (errors) {
    dispatch(downlineError());
    dispatch(setAlert(res.data.message, "danger"));
    errors.forEach((error) => {
      dispatch(setErrorsList(error.msg, error.path));
    });
  }
};

// Handle Request Errors
const handleRequestError = (err, dispatch) => {
  console.error("Error fetching downline:", err);
  if (
    err.response &&
    err.response.data &&
    err.response.data.tokenStatus === 0
  ) {
    dispatch(logout());
  } else {
    err.response &&
      dispatch(
        downlineError({
          msg: err.response.statusText,
          status: err.response.status,
        })
      );
    dispatch(setAlert(err.response.message, "danger"));
  }
};

// Reset Downline Errors
export const removeDownlineErrors = () => async (dispatch) => {
  dispatch(removeErrors());
};

// Dispatch Reset store
export const resetComponentStore = () => async (dispatch) => {
  await dispatch(resetDownline());
};

// Fetch My Team List
export const getMyTeamList = (params, user_id) => async (dispatch) => {
  dispatch(removeErrors());
  dispatch(loadingDownline());
  try {
    // Ensure params has required properties with defaults
    const safeParams = {
      limit: Number(params?.limit) || 20,
      page: Number(params?.page) || 1,
      orderBy: params?.orderBy || "createdAt",
      ascending: params?.ascending || "desc",
      query: params?.query || "",
      filters: Array.isArray(params?.filters) ? params.filters : [],
    };

    // Prepare query parameters
    // Backend expects filters as JSON string in query params
    // Express will automatically URL decode, and backend will parse JSON string to array
    const queryParams = {
      limit: safeParams.limit,
      page: safeParams.page,
      orderBy: safeParams.orderBy,
      ascending: safeParams.ascending,
      query: safeParams.query,
      filters: JSON.stringify(safeParams.filters),
    };

    const config = {
      params: queryParams,
    };

    const res = await api.get(`/api/users/downline/${user_id}/my-team`, config);
    if (res.data.status === true) {
      dispatch(teamsSearchParameterUpdated(params));
      dispatch(totalTeamUpdated(res.data.response[0]));
    } else {
      handleErrors(res, dispatch);
    }
    return res.data ? res.data : { status: false };
  } catch (err) {
    handleRequestError(err, dispatch);
  }
};

// Fetch Left Downline
export const getMyLegList = (params, user_id, position) => async (dispatch) => {
  dispatch(removeErrors());
  dispatch(loadingLegTeam());

  try {
    const config = {
      params: {
        ...params,
        page: params.page,
        limit: params.limit,
        orderBy: params.orderBy,
        ascending: params.ascending,
        filters: JSON.stringify(params.filters),
      },
    };

    const res = await api.get(
      `/api/users/downline/leg/${user_id}/${position}`,
      config
    );

    if (res.data.status === true) {
      dispatch(teamsSearchParameterUpdated(params));
      dispatch(myLegTeamUpdated(res.data.response[0]));
    } else {
      handleErrors(res, dispatch);
    }
  } catch (err) {
    handleRequestError(err, dispatch);
  }
};

export const getLevelSummary = (userId) => async (dispatch) => {
  dispatch(removeErrors());
  dispatch(loadingLevelSummary());
  try {
    const res = await api.get(`/api/users/downline/level-summary/${userId}`);
    if (res.data.status === true) {
      dispatch(levelSummaryUpdated(res.data.response));
    } else {
      handleErrors(res, dispatch);
    }
    return res.data ? res.data : { status: false };
  } catch (err) {
    handleRequestError(err, dispatch);
  }
};

export const getLevelUsers = (userId, level, params) => async (dispatch) => {
  dispatch(removeErrors());
  dispatch(loadingLevelUsers());
  try {
    const config = {
      "Content-Type": "application/json",
      params: params,
    };

    const res = await api.get(
      `/api/users/downline/level-users/${userId}/${level}`,
      config
    );
    if (res.data.status === true) {
      dispatch(
        levelUsersUpdated({
          data: res.data.response.users,
          page: params.page,
          count: res.data.response.total,
        })
      );
    } else {
      handleErrors(res, dispatch);
    }
    return res.data ? res.data : { status: false };
  } catch (err) {
    handleRequestError(err, dispatch);
  }
};

// Update existing getMyLevelWiseTeamList to use new summary endpoint
export const getMyLevelWiseTeamList = (params, user_id) => async (dispatch) => {
  dispatch(removeErrors());
  dispatch(loadingLevelSummary());
  try {
    const res = await api.get(`/api/users/downline/level-summary/${user_id}`);
    if (res.data.status === true) {
      dispatch(levelSummaryUpdated(res.data.response));
    } else {
      handleErrors(res, dispatch);
    }
    return res.data ? res.data : { status: false };
  } catch (err) {
    handleRequestError(err, dispatch);
  }
};
