const express = require("express");
const router = express.Router();
const response = require("../../config/response");
const { check } = require("express-validator");
const standard_password = require("../../utils/constants");
const { AdminAuth } = require("../../middleware/auth");

const User = require("../../models/User");

const {
  createFirstPayUser,
  getFirstPayUsersList,
  checkUserPendingLinkEligibility,
  getAvailableLevelsList,
  deleteFirstPayUserByID,
} = require("./Controllers/AdminFirstPayUsersController");

// @route GET api/admin/first-pay-user
// @desc Get get first pay user list
// @access Private
router.get("/", [AdminAuth], getFirstPayUsersList);

// @route POST api/admin/first-pay-user/create
// @desc Create First-Pay user
// @access Private
router.post(
  "/create",
  [
    AdminAuth,
    check("EP_ID", "EP_ID is required and should be at most 9 characters long")
      .isString()
      .isLength({ max: 9 })
      .custom(async (value, { req }) => {
        if (value) {
          const capitalEPID = value.toUpperCase();

          const userData = await User.findOne({
            EP_ID: capitalEPID,
          });
          if (!userData) {
            return response.errorResponse(
              res,
              {},
              "No user found with this EP ID",
              500
            );
          }
        }
      }),

    check("level", "Level is required."),
    check("pendingLinks", "Pending Links is required."),

    check("txn_password", standard_password.validation_msg).matches(
      standard_password.validation_pattern
    ),
  ],
  createFirstPayUser
);

// @route GET api/admin/first-pay-user/user-details/:level/:e2e_id
// @desc Get user details with EP_ID
// @access Private
router.get(
  "/user-details/:level/:e2e_id",
  [AdminAuth],
  checkUserPendingLinkEligibility
);

// @route GET api/admin/first-pay-user/levels-list
// @desc Get levels list
// @access Private
router.get("/levels-list", [AdminAuth], getAvailableLevelsList);

// @route GET api/admin/first-pay-user/delete/:level_id
// @desc Delete assigned user from levels
// @access Private
router.delete("/delete/:level_id", [AdminAuth], deleteFirstPayUserByID);

module.exports = router;
