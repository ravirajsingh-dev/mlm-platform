import api from "@src/utils/axiosSetup";

import { setAlert, removeAlert } from "./alert";
import { setErrorsList } from "./errors";
import { removeErrors } from "@src/reducers/errors";
import { adminLogout } from "./adminAuth";

import {
  userCreated,
  resetUser,
  loadUserPage,
  userUpdated,
  userDeleted,
  userError,
  userDetailsById,
  userListUpdated,
  userSearchParameterUpdate,
  loadingOnUserSubmit,
  loadingUsersList,
} from "@reducers/adminUsersReducer";

export const getUsersList = (userParams) => async (dispatch) => {
  try {
    const query = userParams.query ? userParams.query : {};
    const rawLimit = parseInt(userParams.limit, 10);
    const limit = Math.min(
      Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : 20,
      50
    );
    const params = { ...userParams, query, limit };

    const config = {
      headers: { "Content-Type": "application/json" },
      params,
      paramsSerializer: {
        serialize: (params) => {
          const searchParams = new URLSearchParams();
          Object.keys(params || {}).forEach((key) => {
            if (params[key] !== null && params[key] !== undefined) {
              if (key === "query" && typeof params[key] === "object") {
                searchParams.append(key, JSON.stringify(params[key]));
              } else if (key === "filters" && Array.isArray(params[key])) {
                searchParams.append(key, params[key].join(","));
              } else {
                searchParams.append(key, params[key]);
              }
            }
          });
          return searchParams.toString();
        },
      },
    };

    dispatch(loadingUsersList());

    const res = await api.get(`/api/admin/users/list`, config);

    console.log("res.data.response[0]", res.data);

    dispatch(userSearchParameterUpdate(params));
    dispatch(userListUpdated(res.data.response[0]));
  } catch (err) {
    console.error(err.response);
    if (err.response?.data?.tokenStatus === 0) {
      dispatch(adminLogout());
    } else {
      err.response &&
        dispatch(
          userError({
            msg: err.response?.statusText || err.message,
            status: err.response?.status,
          })
        );

      dispatch(setAlert(err.response?.data?.message || err.response?.message || err.message || "Error loading users", "danger"));
    }
  }
};

// get User by id
export const getUserById = (user_id) => async (dispatch) => {
  dispatch(removeErrors());
  dispatch(loadingOnUserSubmit());
  try {
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };
    const res = await api.get(`/api/admin/users/${user_id}`, config);

    dispatch(userDetailsById(res.data.response));
    return res.data ? res.data.response : { status: false };
  } catch (err) {
    if (err.response?.data?.tokenStatus === 0) {
      dispatch(adminLogout());
    } else {
      err.response &&
        dispatch(
          userError({
            msg: err.response?.statusText || err.message,
            status: err.response?.status,
          })
        );

      dispatch(setAlert(err.response?.data?.message || err.response?.message || err.message || "Error loading user", "danger"));
    }
  }
};

export const create = (formData, navigate) => async (dispatch) => {
  try {
    const config = {
      "Content-Type": "application/json",
    };

    dispatch(loadingOnUserSubmit());

    const res = await api.post(`/api/admin/users`, formData, config);
    if (res.data.status === true) {
      dispatch(userCreated(res.data.response));
      dispatch(setAlert("User Created.", "success"));
      navigate(`/admin/users`);
    } else {
      const errors = res.data.errors;
      if (errors) {
        dispatch(userError());
        dispatch(setAlert(res.data.message, "danger"));

        errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
        });
      }
    }
    return res.data ? res.data : { status: false };
  } catch (err) {
    console.error(err);
    if (err.response?.data?.tokenStatus === 0) {
      dispatch(adminLogout());
    } else {
      err.response &&
        dispatch(
          userError({
            msg: err.response?.statusText || err.message,
            status: err.response?.status,
          })
        );

      dispatch(setAlert(err.response?.data?.message || err.response?.message || err.message || "Error creating user", "danger"));
    }
  }
};

// Edit User
export const editUser = (formData, navigate, user_id) => async (dispatch) => {
  dispatch(removeErrors());
  try {
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };
    const res = await api.put(`/api/admin/users/${user_id}`, formData, config);
    if (res.data.status === true) {
      dispatch(userUpdated(res.data.response));
      dispatch(setAlert("User Updated.", "success"));
    } else {
      const errors = res.data.errors;
      if (errors) {
        dispatch(userError());
        dispatch(setAlert(res.data.message, "danger"));

        errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
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
          userError({
            msg: err.response?.statusText || err.message,
            status: err.response?.status,
          })
        );

      dispatch(setAlert(err.response?.data?.message || err.response?.message || err.message || "Error updating user", "danger"));
    }
  }
};

// Delete User
export const deleteUser = (user_id) => async (dispatch) => {
  try {
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };
    await api.delete(`/api/admin/users/${user_id}`, config);

    dispatch(userDeleted(user_id));
    dispatch(setAlert("User deleted", "success"));
  } catch (err) {
    err.response &&
      dispatch(
        userError({
          msg: err.response.statusText,
          status: err.response.status,
        })
      );
  }
};

export const cancelSave = (navigate) => async (dispatch) => {
  dispatch(removeErrors());
  navigate("/admin/users");
};

// reset errors
export const removeUserErrors = () => async (dispatch) => {
  dispatch(removeErrors());
};

// Dispatch Reset store
export const resetComponentStore = () => async (dispatch) => {
  await dispatch(resetUser());
};

export const setErrors = (errors) => async (dispatch) => {
  if (errors) {
    dispatch(userError());
    dispatch(setAlert("Please correct the following errors", "danger"));
    errors.forEach((error) => {
      dispatch(setErrorsList(error.msg, error.path));
    });
  }
};

// Reactivate inactive user (restore status + payment links)
export const reactivateUser = (user_id, txn_password) => async (dispatch) => {
  try {
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };
    const res = await api.post(
      `/api/admin/users/${user_id}/reactivate`,
      { txn_password },
      config
    );
    if (res.data?.status === true) {
      dispatch(setAlert(res.data?.message || "User reactivated successfully.", "success"));
      return true;
    } else {
      dispatch(setAlert(res.data?.message || "Reactivation failed.", "danger"));
      const errors = res.data?.errors;
      if (errors?.length) {
        errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
        });
      }
      return false;
    }
  } catch (err) {
    const msg =
      err.response?.data?.message || err.response?.statusText || "Reactivation failed.";
    dispatch(setAlert(msg, "danger"));
    const errors = err.response?.data?.errors;
    if (errors?.length) {
      errors.forEach((error) => {
        dispatch(setErrorsList(error.msg, error.path));
      });
    }
    if (err.response?.data?.tokenStatus === 0) {
      dispatch(adminLogout());
    }
    return false;
  }
};

// Export Users List to Excel
export const exportUsersList = (userParams) => async (dispatch) => {
  try {
    const config = {
      "Content-Type": "application/json",
      responseType: "blob", // Important for file download
    };

    const query = userParams.query ? userParams.query : "";
    userParams.query = query;
    config.params = userParams;

    const res = await api.get(`/api/admin/users/export`, config);
    return res;
  } catch (err) {
    console.error(err.response);
    if (err.response?.data?.tokenStatus === 0) {
      dispatch(adminLogout());
    } else {
      err.response &&
        dispatch(
          userError({
            msg: err.response?.statusText || err.message,
            status: err.response?.status,
          })
        );

      dispatch(setAlert(err.response?.data?.message || err.response?.message || err.message || "Error exporting users", "danger"));
    }
    throw err;
  }
};
