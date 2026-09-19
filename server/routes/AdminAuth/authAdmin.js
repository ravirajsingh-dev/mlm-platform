const express = require("express");
const { check } = require("express-validator");
const router = express.Router();

// Custom imports
const standard_password = require("../../utils/constants");
const Admin = require("../../models/Admin");
const {
  logout,
  logoutAll,
  checkAuth,
  changePassword,
  adminLogin,
  changeTnxPassword,
  setTxnPassword,
} = require("./Controllers/AdminAuthController");

const adminRefreshToken = require("./Controllers/RefreshTokenController");

const {
  isEmailValid,
  isPhoneNumberValid,
  isSelfSponsorIDValid,
  isAdminIDValid,
} = require("../../utils/helper");

const { AdminAuth } = require("../../middleware/auth");
const { checkSessionExpiry } = require("../../middleware/checkSessionExpiry");

// @route POST api/auth
// @desc Authenticate user
// @access Public
router.post(
  "/",
  [
    check("admin_id", "Admin ID is required")
      .trim()
      .notEmpty()
      .withMessage("Admin ID cannot be empty")
      .isLength({ min: 8, max: 15 })
      .withMessage("Admin ID must be between 8 and 15 characters")
      .custom(async (value, { req }) => {
        // Validate admin_id format: alphanumeric, 8-15 characters
        if (!isAdminIDValid(value)) {
          throw new Error(
            "Invalid Admin ID format. Admin ID must be 8-15 alphanumeric characters."
          );
        }

        // Check if admin exists with this admin_id (case-insensitive)
        const admin = await Admin.findOne({
          admin_id: { $regex: new RegExp("^" + value + "$", "i") },
        });

        if (
          !admin ||
          (typeof admin === "object" &&
            admin !== null &&
            Object.keys(admin).length === 0)
        ) {
          throw new Error("Invalid credentials.");
        }

        // Attach admin to request for use in controller
        req.admin = admin;
      }),
    check("password", standard_password.validation_msg).matches(
      standard_password.validation_pattern
    ),
  ],
  adminLogin
);

// @route PUT api/auth/logout
// @desc Logout admin from current device
// @access Private (requires authentication)
router.put("/logout", AdminAuth, logout);

// @route PUT api/auth/logout-all
// @desc Logout admin from all devices
// @access Private (requires authentication)
router.put("/logout-all", AdminAuth, logoutAll);

// @route GET api/auth/load-user
// @desc Load authenticated user
// @access Private
router.get("/load-admin", AdminAuth, checkSessionExpiry, checkAuth);

// @route POST api/auth/refresh-token
// @desc Refresh access token
// @access Private (requires authentication)
router.post("/refresh-token", adminRefreshToken);

// @route POST api/auth/set-txn-password
// @desc Set tnx password
// @access Private (requires authentication)
router.post(
  "/set-txn-password",
  AdminAuth,
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

  AdminAuth,
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

  AdminAuth,
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

module.exports = router;
