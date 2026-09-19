import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  donationButtons: [],
  donationSettings: {
    donationEnabled: false,
    donationMessage: "",
    upi: {
      upiId: "",
      upiHolderName: "",
    },
    bank: {
      bankName: "",
      accountNo: "",
      accountHolderName: "",
      ifscCode: "",
    },
  },
  qrCodeData: "",
  loadingDonationButtons: false,
  loadingDonationSettings: false,
  loadingQRCode: false,
  loadingSubmitDonation: false,
};

const donationSlice = createSlice({
  name: "donation",
  initialState,
  reducers: {
    donationButtonsUpdated(state, action) {
      return {
        ...state,
        donationButtons: action.payload,
        loadingDonationButtons: false,
      };
    },
    loadingDonationButtons(state) {
      return {
        ...state,
        loadingDonationButtons: true,
      };
    },
    donationSettingsUpdated(state, action) {
      return {
        ...state,
        donationSettings: action.payload,
        loadingDonationSettings: false,
      };
    },
    loadingDonationSettings(state) {
      return {
        ...state,
        loadingDonationSettings: true,
      };
    },
    qrCodeUpdated(state, action) {
      return {
        ...state,
        qrCodeData: action.payload,
        loadingQRCode: false,
      };
    },
    loadingQRCode(state) {
      return {
        ...state,
        loadingQRCode: true,
      };
    },
    clearQRCode(state) {
      return {
        ...state,
        qrCodeData: "",
        loadingQRCode: false,
      };
    },
    loadingSubmitDonation(state) {
      return {
        ...state,
        loadingSubmitDonation: true,
      };
    },
    submitDonationSuccess(state) {
      return {
        ...state,
        loadingSubmitDonation: false,
      };
    },
    resetDonationState(state) {
      return {
        ...initialState,
      };
    },
  },
});

export const {
  donationButtonsUpdated,
  loadingDonationButtons,
  donationSettingsUpdated,
  loadingDonationSettings,
  qrCodeUpdated,
  loadingQRCode,
  clearQRCode,
  loadingSubmitDonation,
  submitDonationSuccess,
  resetDonationState,
} = donationSlice.actions;
export default donationSlice.reducer;
