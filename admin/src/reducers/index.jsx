import { combineReducers } from "redux";

import errors from "./errors";
import alert from "./alert";
import auth from "./auth";

// Admin section
import adminAuth from "./adminAuth";
import adminDashboard from "./adminDashboard";
import adminUsers from "./adminUsersReducer";
import adminWithdrawals from "./adminWithdrawalsReducer";
import adminDeposits from "./adminDepositsReducer";
import adminPaymentMethods from "./adminPaymentMethodsReducer";

// admin default values
import adminWithdrawalDefaultValues from "./adminWithdrawalDefaultValuesReducer";
import adminCommonSettings from "./adminCommonSettingsReducer";
import adminDonation from "./adminDonationReducer";

// Users section

import downline from "./downlineReducer";
import helpLink from "./helpLinksReducer";

// EP-Keys Request
import epin from "./adminEPinsReducer";
import firstPayUser from "./adminFirstPayUserReducer";

import wallet from "./walletReducer";
import sevaKendra from "./sevaKendraReducer";
import common from "./commonReducer";
import adminSlider from "./adminSliderReducer";
import adminGallery from "./adminGalleryReducer";

const rootReducer = combineReducers({
  errors,
  alert,
  auth,

  // users
  downline,

  // admin
  adminAuth,
  adminDashboard,
  adminUsers,
  adminWithdrawals,
  adminDeposits,
  adminPaymentMethods,
  helpLink,

  // admin default values
  adminWithdrawalDefaultValues,
  adminCommonSettings,
  adminDonation,

  // EP-Keys Request
  epin,

  firstPayUser,
  wallet,
  sevaKendra,
  common,
  slider: adminSlider,
  gallery: adminGallery,
});

export default rootReducer;
