const response = require("../../../config/response");
const { validationResult } = require("express-validator");
const {
  getAllWithdrawalRequests,
  approveWithdrawalRequest,
  rejectWithdrawalRequest,
} = require("../../../services/withdrawal/withdrawalService");
const WithdrawalRequest = require("../../../models/withdrawal/WithdrawalRequest");
const { generateWithdrawalQRCode } = require("../../../utils/qrCodeUtils");

/**
 * @route GET /api/admin/withdrawal/requests
 * @desc Get all withdrawal requests (with filters)
 * @access Private (Admin)
 */
const getWithdrawalRequests = async (req, res) => {
  try {
    const status = req.query.status || null;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const epId = req.query.epId || null;

    const result = await getAllWithdrawalRequests(status, page, limit, epId);

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
 * @route GET /api/admin/withdrawal/requests/:id
 * @desc Get a single withdrawal request by ID
 * @access Private (Admin)
 */
const getWithdrawalRequestById = async (req, res) => {
  try {
    const requestId = req.params.id;
    
    const request = await WithdrawalRequest.findById(requestId)
      .populate("userId", "name EP_ID email phone")
      .populate("adminId", "name admin_id")
      .lean();

    if (!request) {
      return response.errorResponse(
        res,
        { msg: "Withdrawal request not found" },
        "Withdrawal request not found",
        404
      );
    }

    // Get real-time e-cash balance
    const Wallet = require("../../../models/Wallet");
    const wallet = await Wallet.findOne({ user: request.userId._id })
      .select("e_cash")
      .lean();
    
    if (wallet) {
      request.currentECashBalance = wallet.e_cash || 0;
    } else {
      request.currentECashBalance = 0;
    }

    return response.successResponse(
      res,
      request,
      "Withdrawal request retrieved successfully"
    );
  } catch (err) {
    console.error("Error fetching withdrawal request:", err);
    return response.errorResponse(
      res,
      {},
      "Failed to fetch withdrawal request",
      500
    );
  }
};

/**
 * @route POST /api/admin/withdrawal/approve/:id
 * @desc Approve a withdrawal request
 * @access Private (Admin)
 */
const approveWithdrawal = async (req, res) => {
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
    const requestId = req.params.id;
    const adminId = req.user.id;
    const { utrNumber, adminRemark } = req.body;

    const withdrawalRequest = await approveWithdrawalRequest(
      requestId,
      adminId,
      utrNumber,
      adminRemark
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
          utrNumber: withdrawalRequest.utrNumber,
          adminRemark: withdrawalRequest.adminRemark,
          actionAt: withdrawalRequest.actionAt,
        },
      },
      "Withdrawal request approved successfully"
    );
  } catch (err) {
    console.error("Error approving withdrawal request:", err);

    // Handle specific error cases
    if (err.message.includes("not found")) {
      return response.errorResponse(
        res,
        { msg: err.message },
        err.message,
        404
      );
    }

    if (err.message.includes("already")) {
      return response.errorResponse(
        res,
        { msg: err.message },
        err.message,
        400
      );
    }

    if (err.message.includes("Insufficient balance")) {
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
      err.message || "Failed to approve withdrawal request",
      500
    );
  }
};

/**
 * @route POST /api/admin/withdrawal/reject/:id
 * @desc Reject a withdrawal request
 * @access Private (Admin)
 */
const rejectWithdrawal = async (req, res) => {
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
    const requestId = req.params.id;
    const adminId = req.user.id;
    const { adminRemark } = req.body;

    const withdrawalRequest = await rejectWithdrawalRequest(
      requestId,
      adminId,
      adminRemark
    );

    return response.successResponse(
      res,
      {
        withdrawalRequest: {
          _id: withdrawalRequest._id,
          amount: withdrawalRequest.amount,
          status: withdrawalRequest.status,
          adminRemark: withdrawalRequest.adminRemark,
          actionAt: withdrawalRequest.actionAt,
        },
      },
      "Withdrawal request rejected successfully"
    );
  } catch (err) {
    console.error("Error rejecting withdrawal request:", err);

    // Handle specific error cases
    if (err.message.includes("not found")) {
      return response.errorResponse(
        res,
        { msg: err.message },
        err.message,
        404
      );
    }

    if (err.message.includes("already")) {
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
      err.message || "Failed to reject withdrawal request",
      500
    );
  }
};

/**
 * @route GET /api/admin/withdrawal/qr-code/:id
 * @desc Generate QR code for a withdrawal request
 * @access Private (Admin)
 */
const getWithdrawalQRCode = async (req, res) => {
  try {
    const requestId = req.params.id;

    // Find the withdrawal request
    const withdrawalRequest = await WithdrawalRequest.findById(requestId)
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
  getWithdrawalRequests,
  getWithdrawalRequestById,
  approveWithdrawal,
  rejectWithdrawal,
  getWithdrawalQRCode,
};
