const express = require("express");
const router = express.Router();
const { UserAuth } = require("../../middleware/auth");
const {
  withdrawalRequestValidation,
} = require("../../validators/withdrawal/withdrawalValidator");
const {
  requestWithdrawal,
  getMyWithdrawalRequests,
  getSettings,
  getMyWithdrawalQRCode,
} = require("./Controllers/WithdrawalController");

/**
 * @route GET /api/withdrawal/settings
 * @desc Get withdrawal settings
 * @access Private (User)
 */
router.get("/settings", UserAuth, getSettings);

/**
 * @route POST /api/withdrawal/request
 * @desc Create a withdrawal request
 * @access Private (User)
 */
router.post(
  "/request",
  [UserAuth, ...withdrawalRequestValidation],
  requestWithdrawal
);

/**
 * @route GET /api/withdrawal/requests
 * @desc Get user's withdrawal requests
 * @access Private (User)
 */
router.get("/requests", UserAuth, getMyWithdrawalRequests);

/**
 * @route GET /api/withdrawal/qr-code/:id
 * @desc Generate QR code for a withdrawal request (user's own request)
 * @access Private (User)
 */
router.get("/qr-code/:id", UserAuth, getMyWithdrawalQRCode);

module.exports = router;
