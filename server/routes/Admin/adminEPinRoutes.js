const express = require("express");
const router = express.Router();
const response = require("../../config/response");
const { check } = require("express-validator");
const standard_password = require("../../utils/constants");
const { AdminAuth } = require("../../middleware/auth");

const User = require("../../models/User");

const {
  createEPinForEPUser,
  getEPinsList,
  getEPinTransferReport,
} = require("./Controllers/AdminEPinsController");

// @route GET api/user/upis/:user_id/list
// @desc Get users upis list
// @access Private
router.get("/", [AdminAuth], getEPinsList);

// @route POST api/admin/e-pins/create
// @desc Create EP-Keys for users
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

    check("plan", "Plan is required and should be 'epin'").isIn(["epin"]),

    check(
      "quantity",
      "Quantity is required and should be at most 5 characters long"
    )
      .isString()
      .isLength({ max: 5 }),

    check("txn_type", "TXN Type is required.").isString().isLength({ max: 2 }),

    check("txn_password", standard_password.validation_msg).matches(
      standard_password.validation_pattern
    ),
  ],
  createEPinForEPUser
);

// @route GET /api/admin/e-pins/transfer-report
// @desc get epin transfer-report
// @access Private
router.get("/transfer-report", [AdminAuth], getEPinTransferReport);

module.exports = router;
