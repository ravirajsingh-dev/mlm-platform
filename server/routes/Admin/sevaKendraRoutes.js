const express = require("express");
const router = express.Router();
const response = require("../../config/response");
const { check, validationResult } = require("express-validator");
const standard_password = require("../../utils/constants");
const { AdminAuth } = require("../../middleware/auth");

const User = require("../../models/User");

const {
  createSevaKendra,
  getSevaKendrasList,
  deleteSevaKendraByID,
} = require("./Controllers/SevaKendraController");
const SevaKendra = require("../../models/SevaKendra");

// @route GET api/admin/first-pay-user
// @desc Get get first pay user list
// @access Private
router.get("/", [AdminAuth], getSevaKendrasList);

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
          req.body.EP_ID = capitalEPID; // Normalize the value

          const userData = await User.findOne({ EP_ID: capitalEPID });
          if (!userData) {
            throw new Error("No user found with this EP ID");
          }

          const existingKendra = await SevaKendra.findOne({
            EP_ID: capitalEPID,
          });
          if (existingKendra) {
            throw new Error("Seva Kendra already exists for this EP ID");
          }
        }
      }),

    check("txn_password", standard_password.validation_msg).matches(
      standard_password.validation_pattern
    ),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return response.errorResponse(
        res,
        { errors: errors.array() },
        "Validation failed",
        400
      );
    }

    return createSevaKendra(req, res);
  }
);

// @route GET api/admin/first-pay-user/delete/:seva_kendra_id
// @desc Delete assigned user from levels
// @access Private
router.delete("/delete/:seva_kendra_id", [AdminAuth], deleteSevaKendraByID);

module.exports = router;
