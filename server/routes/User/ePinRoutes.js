const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const { UserAuth } = require("../../middleware/auth");
const standard_password = require("../../utils/constants");

const {
  getEPinsList,
  getSponsorUserDetails,
  transferEPin,
  getEPinTransferReport,
} = require("./Controllers/EPinsController");
const User = require("../../models/User");

// @route GET api/user/e-pins/list
// @desc Get users epins list
// @access Private
router.get("/", [UserAuth], getEPinsList);

// @route GET /api/users/e-pins/sponsor-user/:sponsor_id
// @desc get sponsor details
// @access Private
router.get("/sponsor-user/:sponsor_id", [UserAuth], getSponsorUserDetails);

// @route POST api/user/e-pins/create
// @desc Create EP-Keys for users
// @access Private
router.post(
  "/transfer",
  [
    UserAuth,

    check(
      "quantity",
      "Quantity is required and should be at most 4 characters long"
    )
      .isString()
      .isLength({ max: 4 }),
    check("EP_ID", "EP_ID is required and should be at most 9 characters long")
      .isString()
      .isLength({ max: 9 })
      .custom(async (value, { req }) => {
        if (value) {
          const capitalEPID = value.toUpperCase();

          const selfUser = await User.findById(req.user.id)
            .select("EP_ID")
            .lean();

          // Ensure user is not transferring to themselves
          if (capitalEPID === selfUser.EP_ID) {
            throw new Error("You cannot transfer to your own wallet.");
          }

          const userData = await User.findOne({ EP_ID: capitalEPID }).lean();

          if (!userData) {
            throw new Error("No user found with this EP ID.");
          }

          // Check if the user is active (status !== 2)
          if (userData.status === 2) {
            throw new Error("Cannot transfer to an inactive user.");
          }
        }
      }),

    check("txn_password", standard_password.validation_msg).matches(
      standard_password.validation_pattern
    ),
  ],
  transferEPin
);

// @route GET /api/users/e-pins/transfer-report
// @desc get epin transfer-report
// @access Private
router.get("/transfer-report", [UserAuth], getEPinTransferReport);

module.exports = router;
