const response = require("../../../config/response");
const { validationResult } = require("express-validator");
const {
  createWithdrawalRequest,
  getUserWithdrawalRequests,
  getWithdrawalSettings,
} = require("../../../services/withdrawal/withdrawalService");
const WithdrawalRequest = require("../../../models/withdrawal/WithdrawalRequest");
const { generateWithdrawalQRCode } = require("../../../utils/qrCodeUtils");

/**
 * @route POST /api/withdrawal/request
 * @desc Create a withdrawal request
 * @access Private (User)
 */
const requestWithdrawal = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return response.errorResponse(
      res,
      errors.array(),
      "Validation Error",
      400
    );
  }

  try {
    const userId = req.user.id;
    const { amount, upiId, upiHolderName } = req.body;

    const withdrawalRequest = await createWithdrawalRequest(
      userId,
      parseFloat(amount),
      upiId,
      upiHolderName
    );

    return response.successResponse(
      res,
      {
        withdrawalRequest: {
          _id: withdrawalRequest._id,
          amount: withdrawalRequest.amount,
          surchargeAmount: withdrawalRequest.surchargeAmount,
          netPayableAmount: withdrawalRequest.netPayableAmount,
          status: withdrawalRequest.status,
          createdAt: withdrawalRequest.createdAt,
        },
      },
      "Withdrawal request created successfully"
    );
  } catch (err) {
    console.error("Error creating withdrawal request:", err);
    // Return the actual error message from service
    // The error message will be in the 'message' field of the response
    return response.errorResponse(
      res,
      err.message ? [{ msg: err.message }] : [],
      err.message || "Failed to create withdrawal request",
      400
    );
  }
};

/**
 * @route GET /api/withdrawal/requests
 * @desc Get user's withdrawal requests
 * @access Private (User)
 */
const getMyWithdrawalRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await getUserWithdrawalRequests(userId, page, limit);

    return response.successResponse(
      res,
      result,
      "Withdrawal requests retrieved successfully"
    );
  } catch (err) {
    console.error("Error fetching withdrawal requests:", err);
    return response.errorResponse(
      res,
      {},
      "Failed to fetch withdrawal requests",
      500
    );
  }
};

/**
 * @route GET /api/withdrawal/settings
 * @desc Get withdrawal settings (for frontend)
 * @access Private (User)
 */
const getSettings = async (req, res) => {
  try {
    const settings = await getWithdrawalSettings();

    // Check if user has pending request
    const WithdrawalRequest = require("../../../models/withdrawal/WithdrawalRequest");
    const pendingRequest = await WithdrawalRequest.findOne({
      userId: req.user.id,
      status: "PENDING",
    }).lean();

    return response.successResponse(
      res,
      {
        ...settings,
        hasPendingRequest: !!pendingRequest,
      },
      "Withdrawal settings retrieved successfully"
    );
  } catch (err) {
    console.error("Error fetching withdrawal settings:", err);
    return response.errorResponse(
      res,
      {},
      "Failed to fetch withdrawal settings",
      500
    );
  }
};

/**
 * @route GET /api/withdrawal/qr-code/:id
 * @desc Generate QR code for a withdrawal request (user's own request)
 * @access Private (User)
 */
const getMyWithdrawalQRCode = async (req, res) => {
  try {
    const requestId = req.params.id;
    const userId = req.user.id;

    // Find the withdrawal request and verify it belongs to the user
    const withdrawalRequest = await WithdrawalRequest.findOne({
      _id: requestId,
      userId: userId,
    })
      .populate("userId", "name EP_ID")
      .lean();

    if (!withdrawalRequest) {
      return response.errorResponse(
        res,
        { msg: "Withdrawal request not found" },
        "Withdrawal request not found",
        404
      );
    }

    // Validate required fields
    if (!withdrawalRequest.upiId || !withdrawalRequest.upiHolderName || !withdrawalRequest.netPayableAmount) {
      return response.errorResponse(
        res,
        { msg: "Withdrawal request is missing required fields for QR code generation" },
        "Withdrawal request is missing required fields for QR code generation",
        400
      );
    }

    // Generate QR code
    const qrCodeData = await generateWithdrawalQRCode(withdrawalRequest);

    // Return QR code with withdrawal request details
    return response.successResponse(
      res,
      {
        qrCodeData: qrCodeData.qrCodeData,
        transactionRef: qrCodeData.transactionRef,
        withdrawalRequest: {
          _id: withdrawalRequest._id,
          amount: withdrawalRequest.amount,
          netPayableAmount: withdrawalRequest.netPayableAmount,
          surchargeAmount: withdrawalRequest.surchargeAmount,
          upiId: withdrawalRequest.upiId,
          upiHolderName: withdrawalRequest.upiHolderName,
          status: withdrawalRequest.status,
          userId: withdrawalRequest.userId,
        },
      },
      "QR code generated successfully"
    );
  } catch (err) {
    console.error("Error generating QR code:", err);

    // Handle validation errors
    if (err.message.includes("required") || err.message.includes("Invalid")) {
      return response.errorResponse(
        res,
        { msg: err.message },
        err.message,
        400
      );
    }

    return response.errorResponse(
      res,
      { msg: err.message },
      err.message || "Failed to generate QR code",
      500
    );
  }
};

module.exports = {
  requestWithdrawal,
  getMyWithdrawalRequests,
  getSettings,
  getMyWithdrawalQRCode,
};
