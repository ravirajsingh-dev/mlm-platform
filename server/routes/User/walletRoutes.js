const express = require("express");
const router = express.Router();
const { UserAuth } = require("../../middleware/auth");
const standard_password = require("../../utils/constants");
const { check } = require("express-validator");

const User = require("../../models/User");

const {
  fetchCurrentBalanceByUserID,
  fetchWalletTransactionsByUserID,
  transferWalletToWalletByEPID,
  transferEPooltoECashByEPID,
  entryToEPool,
} = require("./Controllers/WalletController");

// @route GET api/wallets/:user_id/balance
// @desc Fetch user Wallet balance by user_id
// @access Private
router.get("/:user_id/balance", UserAuth, fetchCurrentBalanceByUserID);

// @route GET api/wallet/:user_id/transactions
// @desc Fetch user Wallet transactions by user_id
// @access Private
router.get("/:user_id/transactions", UserAuth, fetchWalletTransactionsByUserID);

// @route POST api/wallet/transfer
// @desc Wallet to wallet transfer
// @access Private
router.post(
  "/transfer",
  [
    UserAuth,
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

    check(
      "amount",
      "Amount is required and should be at most 5 characters long"
    )
      .isString()
      .isLength({ max: 5 }),

    check("txn_password", standard_password.validation_msg).matches(
      standard_password.validation_pattern
    ),
  ],
  transferWalletToWalletByEPID
);

// @route POST api/wallet/transfer-epool
// @desc E-Pool Wallet to E-Cash wallet transfer-epool
// @access Private
router.post(
  "/transfer-epool-to-ecash",
  UserAuth,
  [
    check(
      "amount",
      "Amount is required and should be at most 5 characters long"
    )
      .isString()
      .isLength({ max: 5 }),

    check("txn_password", standard_password.validation_msg).matches(
      standard_password.validation_pattern
    ),
  ],
  transferEPooltoECashByEPID
);

// @route POST api/wallet/entry-e-pool
// @desc Entry to E-Pool (Debit 500 from e_cash, Credit to e_pool_upgrade)
// @access Private
router.post("/entry-e-pool", UserAuth, entryToEPool);

module.exports = router;
