const response = require("../../../config/response");

const Admin = require("../../../models/Admin");
const User = require("../../../models/User");
const Wallet = require("../../../models/Wallet");

const { comparePasswords } = require("../../../utils/helper");
const WalletTransferReport = require("../../../models/WalletTransferReport");
const WalletTransaction = require("../../../models/WalletTransaction");
const { updateWalletBalance } = require("../../../utils/dbHelpers");
const { processSearchFilters } = require("../../../utils/searchHelper");
const mongoose = require("mongoose");
const {
  clampListPageSize,
  clampPositivePage,
} = require("../../../utils/paginationLimits");

// Helper function to extract filters from processSearchFilters result
const extractFilters = (searchFilters) => {
  let extracted = {};
  if (searchFilters.$and && Array.isArray(searchFilters.$and)) {
    searchFilters.$and.forEach((filter) => {
      Object.assign(extracted, filter);
    });
  } else {
    Object.assign(extracted, searchFilters);
    delete extracted.$or;
  }
  return extracted;
};

const transferMoneyToEPUser = async (req, res) => {
  try {
    const adminID = req.user.id;
    const { EP_ID, amount, txn_password, txn_type, walletType = "e_cash" } = req.body;

    // Validate amount
    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      return response.errorResponse(res, {}, "Invalid transfer amount", 400);
    }

    // Validate wallet type
    const validWalletTypes = ["e_cash", "e_pool", "upgrade", "help", "ddf", "e_pool_upgrade"];
    if (!validWalletTypes.includes(walletType)) {
      return response.errorResponse(res, {}, "Invalid wallet type", 400);
    }

    // Fetch admin details
    const admin = await Admin.findById(adminID).lean();
    if (!admin) {
      return response.errorResponse(res, {}, "Admin not found", 500);
    }

    // Validate transaction password
    const validPassword = await comparePasswords(
      txn_password,
      admin?.txn_password
    );
    if (!validPassword) {
      return response.errorResponse(
        res,
        [
          {
            path: "txn_password",
            msg: "Incorrect Tnx password. Please double-check your credentials and try again.",
          },
        ],
        "Incorrect Tnx Password.",
        400
      );
    }

    // Fetch user details
    const user = await User.findOne({ EP_ID }).lean();
    if (!user) {
      return response.errorResponse(res, {}, "User not found", 500);
    }

    // Map transaction type from frontend (CR/DR) to backend (credit/debit)
    const backendTransactionType = txn_type === "CR" ? "credit" : "debit";
    
    // Get wallet type label for description
    const walletTypeLabels = {
      e_cash: "E-Cash",
      e_pool: "E-Pool",
      upgrade: "Upgrade",
      help: "Help",
      ddf: "DDF",
      e_pool_upgrade: "E-Pool Upgrade",
    };
    const walletLabel = walletTypeLabels[walletType] || "Wallet";
    
    const description =
      txn_type === "CR"
        ? `Admin credited ₹${transferAmount} to your ${walletLabel} Wallet`
        : `Admin deducted ₹${transferAmount} from your ${walletLabel} Wallet`;

    // Use the updateWalletBalance function
    const result = await updateWalletBalance(
      user._id, // User ID
      transferAmount, // Amount
      walletType, // Wallet type (dynamic)
      backendTransactionType, // credit/debit
      description, // Transaction description
      adminID // Initiator (admin ID)
    );

    if (!result.success) {
      throw new Error(result.message || "Failed to update wallet balance");
    }

    // Determine the status message based on transaction type
    // Create a descriptive status message for the transaction
    const statusMessage =
      txn_type === "CR"
        ? `Amount credited to user (${EP_ID}) by Admin`
        : `Amount deducted from user (${EP_ID}) by Admin`;

    // Create a Wallet Transfer Report
    const transferReport = new WalletTransferReport({
      transferredBy: "Admin",
      transferredTo: EP_ID,
      amount: transferAmount,
      status: statusMessage,
      type: txn_type, // 'CR' (Credit) or 'DR' (Debit)
      walletType: walletType, // Store wallet type in report
    });

    await transferReport.save();

    return response.successResponse(
      res,
      {
        balance: result.wallet.mudraBalance,
        e_cash: result.wallet.mudraBalance,
        transferReport,
      },
      `Successfully ${
        txn_type === "CR" ? "added" : "deducted"
      } ₹${transferAmount} ${txn_type === "CR" ? "to" : "from"} EP ID: ${EP_ID}`
    );
  } catch (err) {
    console.error("Error transferring money:", err);

    // Handle specific error messages
    if (err.message.includes("Insufficient balance")) {
      return response.errorResponse(
        res,
        [
          {
            path: "amount",
            msg: "User has insufficient balance for this deduction",
          },
        ],
        "Insufficient balance",
        400
      );
    }

    return res.status(500).json({
      message: err.message || "Failed to transfer money",
    });
  }
};

const getWalletTransferReport = async (req, res) => {
  const {
    limit = 10,
    page = 1,
    orderBy = "createdAt",
    ascending = "desc",
    transferredBy,
    transferredTo,
  } = req.query;

  const pageSize = clampListPageSize(limit, 10, 50);
  const pageNum = clampPositivePage(page, 1);
  const order = ascending === "desc" ? -1 : 1;
  const skip = pageSize * (pageNum - 1);

  try {
    const userId = req.user.id;

    // Check if the requesting user is an admin
    const admin = await Admin.findById(userId).lean();
    if (!admin) {
      return response.errorResponse(
        res,
        { msg: "Admin not found." },
        "Admin not found.",
        400
      );
    }

    let filterData = {};
    if (transferredBy) {
      filterData.transferredBy = transferredBy;
    }
    if (transferredTo) {
      filterData.transferredTo = transferredTo;
    }

    // Handle query filters
    let filters = [];
    let query = {};
    if (req.query.filters) {
      if (typeof req.query.filters === "string") {
        filters = req.query.filters.split(",");
      } else if (Array.isArray(req.query.filters)) {
        filters = req.query.filters;
      }
    }
    if (req.query.query) {
      if (typeof req.query.query === "string") {
        try {
          query = JSON.parse(req.query.query);
        } catch (e) {
          query = {};
        }
      } else if (typeof req.query.query === "object") {
        query = req.query.query;
      }
    }

    // Process filters for walletType and EP_ID
    const searchFilters = processSearchFilters(filters, query);
    
    // Extract filters from $and array if present
    const extractedFilters = extractFilters(searchFilters);

    if (extractedFilters.walletType) {
      const walletTypeValue = extractedFilters.walletType;
      filterData.walletType = typeof walletTypeValue === "string" 
        ? walletTypeValue 
        : walletTypeValue.toString();
    }
    if (extractedFilters.EP_ID) {
      // EP_ID filter - need to match against transferredBy or transferredTo
      const epIdValue = extractedFilters.EP_ID;
      const epIdRegex = epIdValue.$regex || epIdValue;
      filterData.$or = [
        { transferredBy: { $regex: epIdRegex, $options: "i" } },
        { transferredTo: { $regex: epIdRegex, $options: "i" } },
      ];
    }
    if (extractedFilters.createdAt) {
      filterData.createdAt = extractedFilters.createdAt;
    }

    // Optimized aggregation with summary
    const walletTransferReportsList = await WalletTransferReport.aggregate([
      {
        $match: filterData,
      },
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                totalRecords: { $sum: 1 },
                totalAmount: { $sum: "$amount" },
              },
            },
          ],
          metadata: [
            { $count: "totalRecord" },
            { $addFields: { current_page: pageNum, per_page: pageSize } },
          ],
          data: [
            { $sort: { [orderBy]: order } },
            { $skip: skip },
            { $limit: pageSize },
          ],
        },
      },
    ]);

    const result = walletTransferReportsList[0] || {};
    const summary = result.summary?.[0] || {
      totalRecords: 0,
      totalAmount: 0,
    };

    // Check if data exists
    if (result.metadata?.length > 0) {
      return response.successResponse(
        res,
        [
          {
            ...result,
            summary: {
              totalRecords: summary.totalRecords,
              totalAmount: summary.totalAmount || 0,
            },
          },
        ],
        "Wallet transfer report list retrieved successfully."
      );
    } else {
      return response.successResponse(
        res,
        [
          {
            metadata: [{ totalRecord: 0, current_page: 1, per_page: pageSize }],
            data: [],
            summary: {
              totalRecords: 0,
              totalAmount: 0,
            },
          },
        ],
        "No wallet transfer reports found."
      );
    }
  } catch (err) {
    console.error("Error fetching wallet transfer report:", err);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

// Get all wallet transactions (for Wallet Details page)
const getWalletTransactions = async (req, res) => {
  const {
    limit = 20,
    page = 1,
    orderBy = "createdAt",
    ascending = "desc",
  } = req.query;

  const pageSize = clampListPageSize(limit, 10, 50);
  const pageNum = clampPositivePage(page, 1);
  const order = ascending === "desc" ? -1 : 1;
  const skip = pageSize * (pageNum - 1);

  try {
    const userId = req.user.id;

    // Check if the requesting user is an admin
    const admin = await Admin.findById(userId).lean();
    if (!admin) {
      return response.errorResponse(
        res,
        { msg: "Admin not found." },
        "Admin not found.",
        400
      );
    }

    // Parse filters and query
    let filters = [];
    let query = {};
    if (req.query.filters) {
      if (typeof req.query.filters === "string") {
        filters = req.query.filters.split(",");
      } else if (Array.isArray(req.query.filters)) {
        filters = req.query.filters;
      }
    }
    if (req.query.query) {
      if (typeof req.query.query === "string") {
        try {
          query = JSON.parse(req.query.query);
        } catch (e) {
          query = {};
        }
      } else if (typeof req.query.query === "object") {
        query = req.query.query;
      }
    }

    // Build filter data
    let filterData = {};
    const searchFilters = processSearchFilters(filters, query);

    // Extract filters from $and array if present, or use direct properties
    const extractedFilters = extractFilters(searchFilters);

    // Handle EP_ID filter - optimize with aggregation lookup
    let userMatchStage = {};
    if (extractedFilters.EP_ID) {
      const epIdValue = extractedFilters.EP_ID;
      if (epIdValue && typeof epIdValue === "object" && epIdValue.$regex) {
        userMatchStage = { EP_ID: { $regex: epIdValue.$regex.source || epIdValue.$regex, $options: "i" } };
      } else if (typeof epIdValue === "string") {
        userMatchStage = { EP_ID: { $regex: epIdValue, $options: "i" } };
      }
    }

    // Handle wallet type filter
    if (extractedFilters.walletType) {
      const walletTypeValue = extractedFilters.walletType;
      const validWalletTypes = [
        "e_cash",
        "e_pool",
        "upgrade",
        "help",
        "ddf",
        "e_pool_upgrade",
      ];
      const walletTypeStr = typeof walletTypeValue === "string" 
        ? walletTypeValue 
        : String(walletTypeValue);
      if (validWalletTypes.includes(walletTypeStr)) {
        filterData.walletType = walletTypeStr;
      }
    }

    // Handle transaction type filter (credit/debit)
    if (extractedFilters.type) {
      const typeValue = extractedFilters.type;
      const validTypes = ["credit", "debit"];
      const typeStr = typeof typeValue === "string" 
        ? typeValue 
        : String(typeValue);
      if (validTypes.includes(typeStr)) {
        filterData.type = typeStr;
      }
    }

    // Handle date filter
    if (extractedFilters.createdAt) {
      filterData.createdAt = extractedFilters.createdAt;
    }

    // Optimized aggregation pipeline
    const pipeline = [
      { $match: filterData },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userDetails",
          pipeline: Object.keys(userMatchStage).length > 0
            ? [{ $match: userMatchStage }]
            : [],
        },
      },
      { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
    ];

    // Only include documents with userDetails if EP_ID filter is applied
    if (Object.keys(userMatchStage).length > 0) {
      pipeline.push({
        $match: { userDetails: { $exists: true, $ne: null } },
      });
    }

    // Add summary calculation
    pipeline.push({
      $facet: {
        summary: [
          {
            $group: {
              _id: null,
              totalRecords: { $sum: 1 },
              totalCredit: {
                $sum: { $cond: [{ $eq: ["$type", "credit"] }, "$amount", 0] },
              },
              totalDebit: {
                $sum: { $cond: [{ $eq: ["$type", "debit"] }, "$amount", 0] },
              },
            },
          },
        ],
        metadata: [
          { $count: "totalRecord" },
          { $addFields: { current_page: pageNum, per_page: pageSize } },
        ],
        data: [
          { $sort: { [orderBy]: order } },
          { $skip: skip },
          { $limit: pageSize },
          {
            $project: {
              _id: 1,
              user: {
                _id: "$userDetails._id",
                EP_ID: "$userDetails.EP_ID",
                name: "$userDetails.name",
              },
              wallet: 1,
              type: 1,
              amount: 1,
              walletType: 1,
              balanceAfterTransaction: 1,
              description: 1,
              createdAt: 1,
              updatedAt: 1,
            },
          },
        ],
      },
    });

    const transactionsList = await WalletTransaction.aggregate(pipeline);

    const result = transactionsList[0] || {};
    const summary = result.summary?.[0] || {
      totalRecords: 0,
      totalCredit: 0,
      totalDebit: 0,
    };

    if (result.metadata?.length > 0) {
      return response.successResponse(
        res,
        [
          {
            ...result,
            summary: {
              totalRecords: summary.totalRecords,
              totalCredit: summary.totalCredit,
              totalDebit: summary.totalDebit,
            },
          },
        ],
        "Wallet transactions list retrieved successfully."
      );
    } else {
      return response.successResponse(
        res,
        [
          {
            metadata: [{ totalRecord: 0, current_page: 1, per_page: pageSize }],
            data: [],
            summary: {
              totalRecords: 0,
              totalCredit: 0,
              totalDebit: 0,
            },
          },
        ],
        "No wallet transactions found."
      );
    }
  } catch (err) {
    console.error("Error fetching wallet transactions:", err);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

// Get users wallet balance (for E-Cash Balance page)
const getUsersWalletBalance = async (req, res) => {
  const {
    limit = 20,
    page = 1,
    orderBy = "balance",
    ascending = "desc",
    walletType = "e_cash",
  } = req.query;

  const pageSize = clampListPageSize(limit, 10, 50);
  const pageNum = clampPositivePage(page, 1);
  const order = ascending === "desc" ? -1 : 1;
  const skip = pageSize * (pageNum - 1);

  try {
    const userId = req.user.id;

    // Check if the requesting user is an admin
    const admin = await Admin.findById(userId).lean();
    if (!admin) {
      return response.errorResponse(
        res,
        { msg: "Admin not found." },
        "Admin not found.",
        400
      );
    }

    // Validate wallet type
    const validWalletTypes = [
      "e_cash",
      "e_pool",
      "upgrade",
      "help",
      "ddf",
      "e_pool_upgrade",
    ];
    if (!validWalletTypes.includes(walletType)) {
      return response.errorResponse(res, {}, "Invalid wallet type", 400);
    }

    // Parse filters and query
    let filters = [];
    let query = {};
    if (req.query.filters) {
      if (typeof req.query.filters === "string") {
        filters = req.query.filters.split(",");
      } else if (Array.isArray(req.query.filters)) {
        filters = req.query.filters;
      }
    }
    if (req.query.query) {
      if (typeof req.query.query === "string") {
        try {
          query = JSON.parse(req.query.query);
        } catch (e) {
          query = {};
        }
      } else if (typeof req.query.query === "object") {
        query = req.query.query;
      }
    }

    // Build filter data
    let filterData = {};
    const searchFilters = processSearchFilters(filters, query);

    // Extract filters from $and array if present, or use direct properties
    const extractedFilters = extractFilters(searchFilters);

    // Handle EP_ID filter - optimize with aggregation
    let userMatchStage = {};
    if (extractedFilters.EP_ID) {
      const epIdValue = extractedFilters.EP_ID;
      if (epIdValue && typeof epIdValue === "object" && epIdValue.$regex) {
        userMatchStage = { EP_ID: { $regex: epIdValue.$regex.source || epIdValue.$regex, $options: "i" } };
      } else if (typeof epIdValue === "string") {
        userMatchStage = { EP_ID: { $regex: epIdValue, $options: "i" } };
      }
    }

    // Optimized aggregation pipeline - filter early for performance
    const matchStage = {
      [walletType]: { $gt: 0 }, // Only users with balance > 0 - uses index
    };

    const pipeline = [
      { $match: matchStage }, // Early filter for performance
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userDetails",
          pipeline: Object.keys(userMatchStage).length > 0
            ? [{ $match: userMatchStage }]
            : [],
        },
      },
      { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
    ];

    // Only include documents with userDetails if EP_ID filter is applied
    if (Object.keys(userMatchStage).length > 0) {
      pipeline.push({
        $match: { userDetails: { $exists: true, $ne: null } },
      });
    }

    // Add balance field
    const balanceFieldMap = {
      e_cash: "$e_cash",
      e_pool: "$e_pool",
      upgrade: "$upgrade",
      help: "$help",
      ddf: "$ddf",
      e_pool_upgrade: "$e_pool_upgrade",
    };
    const balanceField = balanceFieldMap[walletType] || "$e_cash";

    pipeline.push({
      $addFields: {
        balance: balanceField,
        walletType: { $literal: walletType },
      },
    });

    pipeline.push({
      $facet: {
        summary: [
          {
            $group: {
              _id: null,
              totalRecords: { $sum: 1 },
              totalBalance: { $sum: balanceField },
              averageBalance: { $avg: balanceField },
            },
          },
        ],
        metadata: [
          { $count: "totalRecord" },
          { $addFields: { current_page: pageNum, per_page: pageSize } },
        ],
        data: [
          { $sort: { [orderBy]: order } },
          { $skip: skip },
          { $limit: pageSize },
          {
            $project: {
              _id: 1,
              user: {
                _id: "$userDetails._id",
                EP_ID: "$userDetails.EP_ID",
                name: "$userDetails.name",
              },
              walletType: 1,
              balance: 1,
            },
          },
        ],
      },
    });

    const usersWithBalance = await Wallet.aggregate(pipeline);

    const result = usersWithBalance[0] || {};
    const summary = result.summary?.[0] || {
      totalRecords: 0,
      totalBalance: 0,
      averageBalance: 0,
    };

    if (result.metadata?.length > 0) {
      return response.successResponse(
        res,
        [
          {
            ...result,
            summary: {
              totalRecords: summary.totalRecords,
              totalBalance: summary.totalBalance || 0,
              averageBalance: summary.averageBalance || 0,
            },
          },
        ],
        "Users wallet balance list retrieved successfully."
      );
    } else {
      return response.successResponse(
        res,
        [
          {
            metadata: [{ totalRecord: 0, current_page: 1, per_page: pageSize }],
            data: [],
            summary: {
              totalRecords: 0,
              totalBalance: 0,
              averageBalance: 0,
            },
          },
        ],
        "No users with wallet balance found."
      );
    }
  } catch (err) {
    console.error("Error fetching users wallet balance:", err);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

// Get user-to-user wallet transfers (exclude admin transfers)
// User transfers are stored in WalletTransaction, not WalletTransferReport
const getUserWalletTransfers = async (req, res) => {
  const {
    limit = 20,
    page = 1,
    orderBy = "createdAt",
    ascending = "desc",
  } = req.query;

  const pageSize = clampListPageSize(limit, 10, 50);
  const pageNum = clampPositivePage(page, 1);
  const order = ascending === "desc" ? -1 : 1;
  const skip = pageSize * (pageNum - 1);

  try {
    const userId = req.user.id;

    // Check if the requesting user is an admin
    const admin = await Admin.findById(userId).lean();
    if (!admin) {
      return response.errorResponse(
        res,
        { msg: "Admin not found." },
        "Admin not found.",
        400
      );
    }

    // Parse filters and query
    let filters = [];
    let query = {};
    if (req.query.filters) {
      if (typeof req.query.filters === "string") {
        filters = req.query.filters.split(",");
      } else if (Array.isArray(req.query.filters)) {
        filters = req.query.filters;
      }
    }
    if (req.query.query) {
      if (typeof req.query.query === "string") {
        try {
          query = JSON.parse(req.query.query);
        } catch (e) {
          query = {};
        }
      } else if (typeof req.query.query === "object") {
        query = req.query.query;
      }
    }

    // Build filter data - only user-to-user transfers (exclude admin)
    // User transfers have description like: "Debited ₹X for wallet transfer to EP_ID" or "Credited ₹X for wallet transfer from EP_ID"
    let filterData = {
      description: {
        $regex: /wallet transfer/i,
        $not: { $regex: /Admin/i },
      },
    };
    const searchFilters = processSearchFilters(filters, query);
    const extractedFilters = extractFilters(searchFilters);

    // Handle EP_ID filter - need to lookup user by EP_ID
    let userMatchStage = {};
    if (extractedFilters.EP_ID) {
      const epIdValue = extractedFilters.EP_ID;
      if (epIdValue && typeof epIdValue === "object" && epIdValue.$regex) {
        userMatchStage = { EP_ID: { $regex: epIdValue.$regex.source || epIdValue.$regex, $options: "i" } };
      } else if (typeof epIdValue === "string") {
        userMatchStage = { EP_ID: { $regex: epIdValue, $options: "i" } };
      }
    }

    // Handle wallet type filter
    if (extractedFilters.walletType) {
      const validWalletTypes = [
        "e_cash",
        "e_pool",
        "upgrade",
        "help",
        "ddf",
        "e_pool_upgrade",
      ];
      const walletTypeStr = typeof extractedFilters.walletType === "string" 
        ? extractedFilters.walletType 
        : String(extractedFilters.walletType);
      if (validWalletTypes.includes(walletTypeStr)) {
        filterData.walletType = walletTypeStr;
      }
    }

    // Handle date filter
    if (extractedFilters.createdAt) {
      filterData.createdAt = extractedFilters.createdAt;
    }

    // Query WalletTransaction for user-to-user transfers
    const pipeline = [
      { $match: filterData },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userDetails",
          pipeline: Object.keys(userMatchStage).length > 0
            ? [{ $match: userMatchStage }]
            : [],
        },
      },
      { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
    ];

    // Only include documents with userDetails if EP_ID filter is applied
    if (Object.keys(userMatchStage).length > 0) {
      pipeline.push({
        $match: { userDetails: { $exists: true, $ne: null } },
      });
    }

    // Extract EP_ID from description and format output
    // Description format: "Debited ₹X for wallet transfer to EP_ID" or "Credited ₹X for wallet transfer from EP_ID"
    pipeline.push({
      $addFields: {
        toEPID: {
          $let: {
            vars: {
              match: { $regexFind: { input: "$description", regex: /to ([A-Z0-9]{9})/i } },
            },
            in: { $ifNull: ["$$match.captures", [""]] },
          },
        },
        fromEPID: {
          $let: {
            vars: {
              match: { $regexFind: { input: "$description", regex: /from ([A-Z0-9]{9})/i } },
            },
            in: { $ifNull: ["$$match.captures", [""]] },
          },
        },
      },
    });

    pipeline.push({
      $project: {
        _id: 1,
        transferredBy: {
          $cond: {
            if: { $eq: ["$type", "debit"] },
            then: "$userDetails.EP_ID",
            else: { $arrayElemAt: ["$fromEPID", 0] },
          },
        },
        transferredTo: {
          $cond: {
            if: { $eq: ["$type", "credit"] },
            then: "$userDetails.EP_ID",
            else: { $arrayElemAt: ["$toEPID", 0] },
          },
        },
        walletType: 1,
        amount: 1,
        status: { $literal: "Success" },
        createdAt: 1,
      },
    });

    // Group by transfer to avoid duplicates (same transfer creates 2 transactions: credit + debit)
    // Group by rounded timestamp (to the second) and amount to pair them
    pipeline.push({
      $addFields: {
        timeKey: {
          $dateToString: {
            format: "%Y-%m-%d %H:%M:%S",
            date: "$createdAt",
          },
        },
      },
    });

    pipeline.push({
      $group: {
        _id: {
          amount: "$amount",
          timeKey: "$timeKey",
          walletType: "$walletType",
        },
        transferredBy: { $max: "$transferredBy" }, // Get non-null value
        transferredTo: { $max: "$transferredTo" }, // Get non-null value
        status: { $first: "$status" },
        createdAt: { $first: "$createdAt" },
      },
    });

    // Lookup user names for transferredBy
    pipeline.push({
      $lookup: {
        from: "users",
        let: { epId: "$transferredBy" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$EP_ID", "$$epId"],
              },
            },
          },
          {
            $project: {
              _id: 0,
              EP_ID: 1,
              name: 1,
            },
          },
        ],
        as: "transferredByUser",
      },
    });

    // Lookup user names for transferredTo
    pipeline.push({
      $lookup: {
        from: "users",
        let: { epId: "$transferredTo" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$EP_ID", "$$epId"],
              },
            },
          },
          {
            $project: {
              _id: 0,
              EP_ID: 1,
              name: 1,
            },
          },
        ],
        as: "transferredToUser",
      },
    });

    // Final format with user names
    pipeline.push({
      $project: {
        _id: 0,
        transferredBy: {
          $ifNull: [{ $arrayElemAt: ["$transferredByUser.EP_ID", 0] }, "$transferredBy"],
        },
        transferredByName: {
          $ifNull: [{ $arrayElemAt: ["$transferredByUser.name", 0] }, null],
        },
        transferredTo: {
          $ifNull: [{ $arrayElemAt: ["$transferredToUser.EP_ID", 0] }, "$transferredTo"],
        },
        transferredToName: {
          $ifNull: [{ $arrayElemAt: ["$transferredToUser.name", 0] }, null],
        },
        walletType: "$_id.walletType",
        amount: "$_id.amount",
        status: 1,
        createdAt: 1,
      },
    });

    pipeline.push({
      $facet: {
        summary: [
          {
            $group: {
              _id: null,
              totalRecords: { $sum: 1 },
              totalAmount: { $sum: "$amount" },
            },
          },
        ],
        metadata: [
          { $count: "totalRecord" },
          { $addFields: { current_page: pageNum, per_page: pageSize } },
        ],
        data: [
          { $sort: { [orderBy]: order } },
          { $skip: skip },
          { $limit: pageSize },
        ],
      },
    });

    const result = await WalletTransaction.aggregate(pipeline);

    const resultData = result[0] || {};
    const summary = resultData.summary?.[0] || {
      totalRecords: 0,
      totalAmount: 0,
    };

    if (resultData.metadata?.length > 0) {
      return response.successResponse(
        res,
        [
          {
            ...resultData,
            summary: {
              totalRecords: summary.totalRecords,
              totalAmount: summary.totalAmount || 0,
            },
          },
        ],
        "User wallet transfers retrieved successfully."
      );
    } else {
      return response.successResponse(
        res,
        [
          {
            metadata: [{ totalRecord: 0, current_page: 1, per_page: pageSize }],
            data: [],
            summary: {
              totalRecords: 0,
              totalAmount: 0,
            },
          },
        ],
        "No user wallet transfers found."
      );
    }
  } catch (err) {
    console.error("Error fetching user wallet transfers:", err);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

module.exports = {
  transferMoneyToEPUser,
  getWalletTransferReport,
  getWalletTransactions,
  getUsersWalletBalance,
  getUserWalletTransfers,
};
