const express = require("express");
const router = express.Router();
const response = require("../../config/response");
const { check } = require("express-validator");
const standard_password = require("../../utils/constants");
const { AdminAuth } = require("../../middleware/auth");

const User = require("../../models/User");

const {
  transferMoneyToEPUser,
  getWalletTransferReport,
  getWalletTransactions,
  getUsersWalletBalance,
  getUserWalletTransfers,
} = require("./Controllers/AdminWalletController");

// @route POST api/admin/e-pins/create
// @desc Create EP-Keys for users
// @access Private
router.post(
  "/transfer",
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

    check(
      "amount",
      "Amount is required and should be at most 5 characters long"
    )
      .isString()
      .isLength({ max: 5 }),

    check("txn_type", "TXN Type is required.").isString().isLength({ max: 2 }),

    check("txn_password", standard_password.validation_msg).matches(
      standard_password.validation_pattern
    ),
  ],
  transferMoneyToEPUser
);

// @route GET /api/admin/wallet/transfer-report
// @desc get wallet transfer-report
// @access Private
router.get("/transfer-report", [AdminAuth], getWalletTransferReport);

// @route GET /api/admin/wallet/transactions
// @desc get all wallet transactions (for Wallet Details page)
// @access Private
router.get("/transactions", [AdminAuth], getWalletTransactions);

// @route GET /api/admin/wallet/users-balance
// @desc get users wallet balance (for E-Cash Balance page)
// @access Private
router.get("/users-balance", [AdminAuth], getUsersWalletBalance);

// @route GET /api/admin/wallet/user-transfers
// @desc get user-to-user wallet transfers (exclude admin transfers)
// @access Private
router.get("/user-transfers", [AdminAuth], getUserWalletTransfers);

module.exports = router;
