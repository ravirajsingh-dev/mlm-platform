const express = require("express");
const { check } = require("express-validator");
const router = express.Router();

// Custom imports
const standard_password = require("../../utils/constants");
const User = require("../../models/User");
const {
  login,
  logout,
  logoutAll,
  checkAuth,
  changePassword,
  getSponsorUserDetails,
  setTxnPassword,
  changeTnxPassword,
  forgotPasswordStep1,
  forgotPasswordStep2,
} = require("./Controllers/AuthController");
const refreshToken = require("./Controllers/RefreshTokenController");
const { isSelfSponsorIDValid } = require("../../utils/helper");
const { UserAuth } = require("../../middleware/auth");
const { checkSessionExpiry } = require("../../middleware/checkSessionExpiry");

// @route POST api/auth
// @desc Authenticate user
// @access Public
router.post(
  "/",
  [
    check("EP_ID", "Invalid EP ID.")
      .trim()
      .custom(async (value, { req }) => {
        const isSelfSponsorID = isSelfSponsorIDValid(value);

        if (!isSelfSponsorID) {
          throw new Error("Invalid EP ID.");
        }

        if (isSelfSponsorID) {
          const is_user_exists = await User.findOne({
            EP_ID: value,
          });

          if (
            !is_user_exists ||
            (typeof is_user_exists === "object" &&
              is_user_exists !== null &&
              Object.keys(is_user_exists).length === 0)
          ) {
            throw new Error("Invalid credentials.");
          }
        }
      }),
    check("password", standard_password.validation_msg).matches(
      standard_password.validation_pattern
    ),
  ],
  login
);

// @route PUT api/auth/logout
// @desc Logout user from current device
// @access Private (requires authentication)
router.put("/logout", UserAuth, logout);

// @route PUT api/auth/logout-all
// @desc Logout user from all devices
// @access Private (requires authentication)
router.put("/logout-all", UserAuth, logoutAll);

// @route GET api/auth/load-user
// @desc Load authenticated user
// @access Private
router.get("/load-user", UserAuth, checkSessionExpiry, checkAuth);

// @route GET api/auth/sponsor-user/:sponsor_id
// @desc Load sponsor user by sponsor_id
// @access Private
router.get("/sponsor-user/:sponsor_id", getSponsorUserDetails);

// @route POST api/auth/refresh-token
// @desc Refresh access token
// @access Private (requires authentication)
router.post("/refresh-token", refreshToken);

// @route POST api/auth/set-txn-password
// @desc Set tnx password
// @access Private (requires authentication)
router.post(
  "/set-txn-password",
  UserAuth,
  checkSessionExpiry,
  [
    check("txn_password", standard_password.validation_msg).matches(
      standard_password.validation_pattern
    ),
  ],
  setTxnPassword
);

// @route POST api/auth/change-txn-password
// @desc Change tnx password
// @access Private (requires authentication)
router.post(
  "/change-txn-password",

  UserAuth,
  [
    check("oldTxnPassword", standard_password.validation_msg).matches(
      standard_password.validation_pattern
    ),

    check("txn_password", standard_password.validation_msg).matches(
      standard_password.validation_pattern
    ),
  ],
  checkSessionExpiry,
  changeTnxPassword
);

// @route POST api/auth/refresh-token
// @desc Change password
// @access Private (requires authentication)
router.post(
  "/change-password",

  UserAuth,
  [
    check("oldPassword", standard_password.validation_msg).matches(
      standard_password.validation_pattern
    ),

    check("password", standard_password.validation_msg).matches(
      standard_password.validation_pattern
    ),
  ],
  checkSessionExpiry,
  changePassword
);

// @route POST api/auth/forgot-password/verify
// @desc Change password
// @access Private (requires authentication)
router.post(
  "/forgot-password/verify",
  [
    check("EP_ID", "EP_ID is required and should be at most 9 characters long")
      .isString()
      .isLength({ max: 9 })
      .custom(async (value, { req }) => {
        if (value) {
          const capitalEPID = value.toUpperCase();
          console.log("capitalEPID", capitalEPID);
          const userData = await User.findOne({ EP_ID: capitalEPID })
            .select("EP_ID")
            .lean();
          if (!userData) {
            throw new Error("No user found with this EP ID.");
          }
        }
      }),
  ],
  forgotPasswordStep1
);

// @route POST api/auth/forgot-password/step2
// @desc Reset password by verifying EP ID and phone
// @access Public (no auth middleware)
router.post(
  "/forgot-password/reset",
  [
    check("EP_ID", "EP_ID is required and must be at most 9 characters long")
      .isString()
      .isLength({ max: 9 })
      .custom(async (value, { req }) => {
        if (value) {
          const capitalEPID = value.toUpperCase();
          const user = await User.findOne({ EP_ID: capitalEPID }).select(
            "phone"
          );
          if (!user) {
            throw new Error("No user found with this EP ID.");
          }

          // Attach user to request for use in controller
          req.forgotUser = user;
        }
      }),
    check("phone", "Phone number is required").not().isEmpty(),
  ],
  forgotPasswordStep2
);

module.exports = router;
