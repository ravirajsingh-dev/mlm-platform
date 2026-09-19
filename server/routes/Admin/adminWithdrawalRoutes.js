const express = require("express");
const router = express.Router();
const { AdminAuth } = require("../../middleware/auth");
const {
  approveWithdrawalValidation,
  rejectWithdrawalValidation,
} = require("../../validators/withdrawal/withdrawalValidator");
const {
  getWithdrawalRequests,
  getWithdrawalRequestById,
  approveWithdrawal,
  rejectWithdrawal,
  getWithdrawalQRCode,
} = require("./Controllers/WithdrawalController");

/**
 * @route GET /api/admin/withdrawal/requests
 * @desc Get all withdrawal requests (with filters)
 * @access Private (Admin)
 */
router.get("/requests", AdminAuth, getWithdrawalRequests);

/**
 * @route GET /api/admin/withdrawal/requests/:id
 * @desc Get a single withdrawal request by ID
 * @access Private (Admin)
 */
router.get("/requests/:id", AdminAuth, getWithdrawalRequestById);

/**
 * @route POST /api/admin/withdrawal/approve/:id
 * @desc Approve a withdrawal request
 * @access Private (Admin)
 */
router.post(
  "/approve/:id",
  [AdminAuth, ...approveWithdrawalValidation],
  approveWithdrawal
);

/**
 * @route POST /api/admin/withdrawal/reject/:id
 * @desc Reject a withdrawal request
 * @access Private (Admin)
 */
router.post(
  "/reject/:id",
  [AdminAuth, ...rejectWithdrawalValidation],
  rejectWithdrawal
);

/**
 * @route GET /api/admin/withdrawal/qr-code/:id
 * @desc Generate QR code for a withdrawal request
 * @access Private (Admin)
 */
router.get("/qr-code/:id", AdminAuth, getWithdrawalQRCode);

module.exports = router;

