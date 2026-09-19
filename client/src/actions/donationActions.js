import api from "@src/utils/axiosSetup";
import { setAlert } from "./alert";
import { setErrorsList } from "./errors";
import {
  donationButtonsUpdated,
  loadingDonationButtons,
  donationSettingsUpdated,
  loadingDonationSettings,
  qrCodeUpdated,
  loadingQRCode,
  loadingSubmitDonation,
  submitDonationSuccess,
} from "@src/reducers/donationReducer";

/**
 * Get active donation buttons
 */
export const getActiveDonationButtons = () => async (dispatch) => {
  try {
    dispatch(loadingDonationButtons());
    const config = { headers: { "Content-Type": "application/json" } };

    const res = await api.get(`/api/common/donation/buttons`, config);

    if (res.data && res.data.status === true) {
      dispatch(donationButtonsUpdated(res.data.response));
    }
    return res.data ? res.data : { status: false };
  } catch (err) {
    console.error("Error fetching donation buttons:", err);
    dispatch(donationButtonsUpdated([]));
    return { status: false };
  }
};

/**
 * Get donation settings
 */
export const getDonationSettings = () => async (dispatch) => {
  try {
    dispatch(loadingDonationSettings());
    const config = { headers: { "Content-Type": "application/json" } };

    const res = await api.get(`/api/common/donation/settings`, config);

    if (res.data && res.data.status === true) {
      dispatch(donationSettingsUpdated(res.data.response));
    }
    return res.data ? res.data : { status: false };
  } catch (err) {
    console.error("Error fetching donation settings:", err);
    dispatch(
      donationSettingsUpdated({
        donationEnabled: false,
        donationMessage: "",
        upi: { upiId: "", upiHolderName: "" },
        bank: {
          bankName: "",
          accountNo: "",
          accountHolderName: "",
          ifscCode: "",
        },
      })
    );
    return { status: false };
  }
};

/**
 * Generate QR code for donation amount
 */
export const generateDonationQRCode = (amount) => async (dispatch) => {
  try {
    dispatch(loadingQRCode());
    const config = {
      headers: { "Content-Type": "application/json" },
      allowDuplicates: true, // Allow duplicate requests for same amount when modal reopens
    };

    const res = await api.post(
      `/api/common/donation/generate-qr`,
      { amount },
      config
    );

    if (res.data && res.data.status === true) {
      dispatch(qrCodeUpdated(res.data.response.qrCodeData));
      return res.data;
    }
    return { status: false };
  } catch (err) {
    console.error("Error generating QR code:", err);
    dispatch(qrCodeUpdated(""));
    if (err.response && err.response.data && err.response.data.errors) {
      const errors = err.response.data.errors;
      errors.forEach((error) => {
        dispatch(setErrorsList(error.msg, error.path));
      });
      dispatch(
        setAlert(
          err.response.data.message || "Error generating QR code",
          "danger"
        )
      );
    }
    return { status: false };
  }
};

/**
 * Submit donation request
 */
export const submitDonationRequest = (formData) => async (dispatch) => {
  try {
    dispatch(loadingSubmitDonation());
    const config = { headers: { "Content-Type": "application/json" } };

    const res = await api.post(
      `/api/common/donation/request`,
      formData,
      config
    );

    if (res.data && res.data.status === true) {
      dispatch(submitDonationSuccess());
      dispatch(
        setAlert(
          res.data.message ||
            "Your donation request has been submitted for admin approval",
          "success"
        )
      );
      return res.data;
    } else {
      dispatch(submitDonationSuccess());
      if (res.data.errors) {
        res.data.errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
        });
      }
      dispatch(
        setAlert(
          res.data.message || "Error submitting donation request",
          "danger"
        )
      );
      return { status: false };
    }
  } catch (err) {
    console.error("Error submitting donation request:", err);
    dispatch(submitDonationSuccess());
    if (err.response && err.response.data) {
      if (err.response.data.errors) {
        err.response.data.errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
        });
      }
      dispatch(
        setAlert(
          err.response.data.message || "Error submitting donation request",
          "danger"
        )
      );
    } else {
      dispatch(setAlert("Error submitting donation request", "danger"));
    }
    return { status: false };
  }
};
