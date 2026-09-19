import { combineReducers } from "redux";

import errors from "./errors";
import alert from "./alert";
import auth from "./auth";

// Users section
import user from "./user";
import wallet from "./walletReducer";
import notifications from "./notificationsReducer";
import downline from "./downlineReducer";
import team from "./teamReducer";
import userUpis from "./userUpisReducer";
import helpLink from "./helpLinksReducer";
import dashboard from "./dashboardReducer";
import epin from "./ePinsReducer";
import upgrade from "./upgradeReducer";
import common from "./commonReducer";
import donation from "./donationReducer";

const rootReducer = combineReducers({
  errors,
  alert,
  auth,
  user,
  wallet,
  notifications,
  userUpis,

  // users
  downline,
  team,

  // help links
  helpLink,
  dashboard,
  epin,
  upgrade,
  common,
  donation,
});

export default rootReducer;
