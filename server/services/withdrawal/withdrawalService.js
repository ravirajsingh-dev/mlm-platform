const WithdrawalRequest = require("../../models/withdrawal/WithdrawalRequest");
const CommonSettings = require("../../models/CommonSettings");
const Wallet = require("../../models/Wallet");
const { updateWalletBalance } = require("../../utils/dbHelpers");
const {
  clampListPageSize,
  clampPositivePage,
} = require("../../utils/paginationLimits");

/**
 * Get withdrawal settings from CommonSettings
 */
const getWithdrawalSettings = async () => {
  const settings = await CommonSettings.getOrCreateSettings();
  return {
    withdrawalEnabled: settings.withdrawalEnabled || false,
    minWithdrawalAmount: settings.minWithdrawalAmount || 0,
    maxWithdrawalAmount: settings.maxWithdrawalAmount || 0,
    dailyTxnLimit: settings.dailyTxnLimit || 0,
    withdrawalSurcharge: settings.withdrawalSurcharge || 0,
  };
};

/**
 * Validate withdrawal request eligibility
 */
const validateWithdrawalRequest = async (userId, amount) => {
  const settings = await getWithdrawalSettings();

  // Check if withdrawal is enabled
  if (!settings.withdrawalEnabled) {
    throw new Error("Withdrawal is currently disabled");
  }

  // Check amount limits
  if (amount < settings.minWithdrawalAmount) {
    throw new Error(
      `Minimum withdrawal amount is ₹${settings.minWithdrawalAmount}`
    );
  }

  if (amount > settings.maxWithdrawalAmount) {
    throw new Error(
      `Maximum withdrawal amount is ₹${settings.maxWithdrawalAmount}`
    );
  }

  // Check user's e_cash balance
  const wallet = await Wallet.findOne({ user: userId }).lean();
  if (!wallet) {
    throw new Error("Wallet not found");
  }

  if (wallet.e_cash < amount) {
    throw new Error("Insufficient e_cash balance");
  }

  // Check for existing PENDING request
  const pendingRequest = await WithdrawalRequest.findOne({
    userId,
    status: "PENDING",
  }).lean();

  if (pendingRequest) {
    throw new Error("You already have a pending withdrawal request");
  }

  // Check daily transaction limit - only count APPROVED requests
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const todayApprovedRequests = await WithdrawalRequest.find({
    userId,
    status: "APPROVED",
    createdAt: { $gte: startOfToday },
  }).lean();

  const todayApprovedCount = todayApprovedRequests.length;

  if (todayApprovedCount >= settings.dailyTxnLimit) {
    throw new Error(
      `Daily withdrawal limit of ${settings.dailyTxnLimit} approved requests reached`
    );
  }

  // Check total amount limit - sum of all APPROVED requests today should not exceed maxWithdrawalAmount
  const totalApprovedAmountToday = todayApprovedRequests.reduce(
    (sum, req) => sum + (req.amount || 0),
    0
  );

  if (totalApprovedAmountToday + amount > settings.maxWithdrawalAmount) {
    const remainingAmount =
      settings.maxWithdrawalAmount - totalApprovedAmountToday;
    if (remainingAmount <= 0) {
      throw new Error(
        `Daily withdrawal amount limit of ₹${settings.maxWithdrawalAmount} reached. You have already withdrawn ₹${totalApprovedAmountToday} today.`
      );
    } else {
      throw new Error(
        `This request would exceed the daily withdrawal limit. Maximum daily withdrawal is ₹${settings.maxWithdrawalAmount}. You have already withdrawn ₹${totalApprovedAmountToday} today. You can withdraw up to ₹${remainingAmount} more.`
      );
    }
  }

  return { settings, wallet };
};

/**
 * Calculate surcharge and net payable amount
 */
const calculateSurcharge = (amount, surchargePercent) => {
  const surchargeAmount = (amount * surchargePercent) / 100;
  const netPayableAmount = amount - surchargeAmount;

  return {
    surchargePercent,
    surchargeAmount: Math.round(surchargeAmount * 100) / 100, // Round to 2 decimal places
    netPayableAmount: Math.round(netPayableAmount * 100) / 100,
  };
};

/**
 * Create withdrawal request
 */
const createWithdrawalRequest = async (
  userId,
  amount,
  upiId,
  upiHolderName
) => {
  // Validate request
  const { settings, wallet } = await validateWithdrawalRequest(userId, amount);

  // Calculate surcharge
  const surchargeDetails = calculateSurcharge(
    amount,
    settings.withdrawalSurcharge
  );

  // Create withdrawal request
  const withdrawalRequest = await WithdrawalRequest.create({
    userId,
    amount,
    upiId: upiId.trim(),
    upiHolderName: upiHolderName.trim(),
    surchargePercent: surchargeDetails.surchargePercent,
    surchargeAmount: surchargeDetails.surchargeAmount,
    netPayableAmount: surchargeDetails.netPayableAmount,
    status: "PENDING",
  });

  return withdrawalRequest;
};

/**
 * Get user's withdrawal requests
 */
const getUserWithdrawalRequests = async (userId, page = 1, limit = 10) => {
  const pageSize = clampListPageSize(limit, 10, 100);
  const pageNum = clampPositivePage(page, 1);
  const skip = pageSize * (pageNum - 1);

  const [requests, total] = await Promise.all([
    WithdrawalRequest.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),
    WithdrawalRequest.countDocuments({ userId }),
  ]);

  return {
    requests,
    pagination: {
      currentPage: pageNum,
      perPage: pageSize,
      totalRecords: total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
};

/**
 * Get all withdrawal requests (admin)
 */
const getAllWithdrawalRequests = async (
  status = null,
  page = 1,
  limit = 10,
  epId = null
) => {
  const pageSize = clampListPageSize(limit, 10, 50);
  const pageNum = clampPositivePage(page, 1);
  const skip = pageSize * (pageNum - 1);

  const filter = {};
  if (status && ["PENDING", "APPROVED", "REJECTED"].includes(status)) {
    filter.status = status;
  }

  // Build aggregation pipeline for filtering by EP_ID
  const matchStage = { ...filter };
  
  let pipeline = [
    { $match: matchStage },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "userData",
      },
    },
    { $unwind: { path: "$userData", preserveNullAndEmptyArrays: true } },
  ];

  // Filter by EP_ID if provided
  if (epId && epId.trim()) {
    pipeline.push({
      $match: {
        "userData.EP_ID": { $regex: epId.trim(), $options: "i" },
      },
    });
  }

  // Add pagination and populate admin and wallet
  pipeline.push(
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: pageSize },
    {
      $lookup: {
        from: "admins",
        localField: "adminId",
        foreignField: "_id",
        as: "adminData",
      },
    },
    { $unwind: { path: "$adminData", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "wallets",
        localField: "userId",
        foreignField: "user",
        as: "walletData",
      },
    },
    { $unwind: { path: "$walletData", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        userId: {
          _id: "$userData._id",
          name: "$userData.name",
          EP_ID: "$userData.EP_ID",
          email: "$userData.email",
          phone: "$userData.phone",
        },
        amount: 1,
        upiId: 1,
        upiHolderName: 1,
        surchargePercent: 1,
        surchargeAmount: 1,
        netPayableAmount: 1,
        status: 1,
        adminId: {
          _id: "$adminData._id",
          name: "$adminData.name",
          admin_id: "$adminData.admin_id",
        },
        utrNumber: 1,
        adminRemark: 1,
        actionAt: 1,
        createdAt: 1,
        updatedAt: 1,
        currentECashBalance: { $ifNull: ["$walletData.e_cash", 0] },
      },
    }
  );

  // Count total matching documents
  const countPipeline = [
    { $match: matchStage },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "userData",
      },
    },
    { $unwind: { path: "$userData", preserveNullAndEmptyArrays: true } },
  ];

  if (epId && epId.trim()) {
    countPipeline.push({
      $match: {
        "userData.EP_ID": { $regex: epId.trim(), $options: "i" },
      },
    });
  }

  countPipeline.push({ $count: "total" });

  const [requests, countResult] = await Promise.all([
    WithdrawalRequest.aggregate(pipeline),
    WithdrawalRequest.aggregate(countPipeline),
  ]);

  const total = countResult[0]?.total || 0;

  return {
    requests,
    pagination: {
      currentPage: pageNum,
      perPage: pageSize,
      totalRecords: total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
};

/**
 * Approve withdrawal request
 */
const approveWithdrawalRequest = async (
  requestId,
  adminId,
  utrNumber,
  adminRemark
) => {
  // Find the request
  const request = await WithdrawalRequest.findById(requestId);
  if (!request) {
    throw new Error("Withdrawal request not found");
  }

  // Check if already processed
  if (request.status !== "PENDING") {
    throw new Error(
      `Withdrawal request is already ${request.status.toLowerCase()}`
    );
  }

  // Validate required fields
  if (!utrNumber || !utrNumber.trim()) {
    throw new Error("UTR Number is required for approval");
  }

  if (!adminRemark || !adminRemark.trim()) {
    throw new Error("Admin remark is required for approval");
  }

  // 🔴 IMPORTANT: Check real-time e_cash balance before approval
  const wallet = await Wallet.findOne({ user: request.userId }).lean();
  if (!wallet) {
    throw new Error("User wallet not found");
  }

  // Check if withdrawal amount exceeds current e-cash balance
  if (request.amount > wallet.e_cash) {
    throw new Error(
      `Cannot approve withdrawal. Withdrawal amount (₹${request.amount.toFixed(2)}) exceeds user's current E-Cash balance (₹${wallet.e_cash.toFixed(2)}). Please reject this request.`
    );
  }

  // Debit FULL withdrawal amount from user's e_cash
  // Note: The full amount is debited, surcharge is already calculated and stored
  const result = await updateWalletBalance(
    request.userId,
    request.amount, // Full amount
    "e_cash",
    "debit",
    `Withdrawal approved: ₹${request.amount} (Net payable: ₹${request.netPayableAmount}, Surcharge: ₹${request.surchargeAmount})`,
    adminId
  );

  if (!result.success) {
    throw new Error(result.message || "Failed to debit wallet");
  }

  // Update request status
  request.status = "APPROVED";
  request.adminId = adminId;
  request.utrNumber = utrNumber.trim();
  request.adminRemark = adminRemark.trim();
  request.actionAt = new Date();

  await request.save();

  return request;
};

/**
 * Reject withdrawal request
 */
const rejectWithdrawalRequest = async (requestId, adminId, adminRemark) => {
  // Find the request
  const request = await WithdrawalRequest.findById(requestId);
  if (!request) {
    throw new Error("Withdrawal request not found");
  }

  // Check if already processed
  if (request.status !== "PENDING") {
    throw new Error(
      `Withdrawal request is already ${request.status.toLowerCase()}`
    );
  }

  // Validate required field
  if (!adminRemark || !adminRemark.trim()) {
    throw new Error("Admin remark is required for rejection");
  }

  // Update request status (no wallet changes needed as amount was never debited)
  request.status = "REJECTED";
  request.adminId = adminId;
  request.adminRemark = adminRemark.trim();
  request.actionAt = new Date();

  await request.save();

  return request;
};

module.exports = {
  getWithdrawalSettings,
  validateWithdrawalRequest,
  calculateSurcharge,
  createWithdrawalRequest,
  getUserWithdrawalRequests,
  getAllWithdrawalRequests,
  approveWithdrawalRequest,
  rejectWithdrawalRequest,
};
