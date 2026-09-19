import api from "@src/utils/axiosSetup";
import { setAlert, removeAlert } from "./alert";
import { setErrorsList } from "./errors";
import { removeErrors } from "@src/reducers/errors";
import { adminLogout } from "./adminAuth";
import {
  galleryImageCreated,
  resetGallery,
  galleryListUpdated,
  galleryUpdated,
  galleryDeleted,
  galleryError,
  gallerySearchParameterUpdate,
  loadingOnGallerySubmit,
  loadingGalleryList,
  galleryCategoriesUpdated,
} from "@reducers/adminGalleryReducer";

export const getGalleryImages = (galleryParams) => async (dispatch) => {
  try {
    const config = {
      "Content-Type": "application/json",
      paramsSerializer: {
        serialize: (params) => {
          const searchParams = new URLSearchParams();
          Object.keys(params).forEach((key) => {
            if (params[key] !== null && params[key] !== undefined) {
              searchParams.append(key, params[key]);
            }
          });
          return searchParams.toString();
        },
      },
    };

    const query = galleryParams.query ? galleryParams.query : {};
    galleryParams.query = query;
    config.params = galleryParams;

    dispatch(loadingGalleryList());

    const res = await api.get(`/api/admin/gallery`, config);

    dispatch(gallerySearchParameterUpdate(galleryParams));
    dispatch(galleryListUpdated(res.data.response[0]));
    if (res.data.response[0].categories) {
      dispatch(galleryCategoriesUpdated(res.data.response[0].categories));
    }
  } catch (err) {
    console.error(err.response);
    if (err.response?.data && err.response.data.tokenStatus === 0) {
      dispatch(adminLogout());
    } else {
      err.response &&
        dispatch(
          galleryError({
            msg: err.response.statusText,
            status: err.response.status,
          })
        );

      dispatch(setAlert(err.response?.message || "Error fetching gallery", "danger"));
    }
  }
};

export const createGalleryImage = (formData, navigate) => async (dispatch) => {
  try {
    const config = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    };

    dispatch(loadingOnGallerySubmit());

    const res = await api.post(`/api/admin/gallery`, formData, config);
    if (res.data.status === true) {
      dispatch(galleryImageCreated(res.data.response));
      dispatch(setAlert("Gallery image uploaded successfully.", "success"));
      if (navigate) {
        navigate(`/admin/gallery`);
      }
    } else {
      const errors = res.data.errors;
      if (errors) {
        dispatch(galleryError());
        dispatch(setAlert(res.data.message, "danger"));

        errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
        });
      }
    }
    return res.data ? res.data : { status: false };
  } catch (err) {
    console.error(err);
    if (err.response?.data && err.response.data.tokenStatus === 0) {
      dispatch(adminLogout());
    } else {
      err.response &&
        dispatch(
          galleryError({
            msg: err.response.statusText,
            status: err.response.status,
          })
        );

      dispatch(setAlert(err.response?.message || "Error uploading image", "danger"));
    }
  }
};

export const updateGalleryImage = (formData, id, navigate) => async (dispatch) => {
  dispatch(removeErrors());
  try {
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };
    const res = await api.put(`/api/admin/gallery/${id}`, formData, config);
    if (res.data.status === true) {
      dispatch(galleryUpdated(res.data.response));
      dispatch(setAlert("Gallery image updated successfully.", "success"));
      if (navigate) {
        navigate(`/admin/gallery`);
      }
    } else {
      const errors = res.data.errors;
      if (errors) {
        dispatch(galleryError());
        dispatch(setAlert(res.data.message, "danger"));

        errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
        });
      }
    }
    return res.data ? res.data : { status: false };
  } catch (err) {
    if (err.response?.data && err.response.data.tokenStatus === 0) {
      dispatch(adminLogout());
    } else {
      err.response &&
        dispatch(
          galleryError({
            msg: err.response.statusText,
            status: err.response.status,
          })
        );

      dispatch(setAlert(err.response?.message || "Error updating gallery", "danger"));
    }
  }
};

export const deleteGalleryImage = (id) => async (dispatch) => {
  try {
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };
    await api.delete(`/api/admin/gallery/${id}`, config);

    dispatch(galleryDeleted(id));
    dispatch(setAlert("Gallery image deleted successfully", "success"));
  } catch (err) {
    err.response &&
      dispatch(
        galleryError({
          msg: err.response.statusText,
          status: err.response.status,
        })
      );
    dispatch(setAlert(err.response?.message || "Error deleting image", "danger"));
  }
};

export const resetComponentStore = () => async (dispatch) => {
  await dispatch(resetGallery());
};

export const removeGalleryErrors = () => async (dispatch) => {
  dispatch(removeErrors());
};

