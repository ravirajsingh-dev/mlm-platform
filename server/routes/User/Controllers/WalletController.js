const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
var response = require("../../../config/response");

const User = require("../../../models/User");
const Wallet = require("../../../models/Wallet");
const WalletTransaction = require("../../../models/WalletTransaction");
const WithdrawalRequest = require("../../../models/withdrawal/WithdrawalRequest");
const { comparePasswords } = require("../../../utils/helper");

const { addJob } = require("../../../queueSystem/queueFactories/queueService");
const {
  transferWalletAmount,
  updateWalletBalance,
  transferEPoolToECashWithSurcharge,
} = require("../../../utils/dbHelpers");
const {
  clampListPageSize,
  clampPositivePage,
} = require("../../../utils/paginationLimits");

const fetchCurrentBalanceByUserID = async (req, res) => {
  try {
    const userID = req.params.user_id;

    const user = await User.findById(userID).select("_id");
    if (!user) {
      return response.errorResponse(
        res,
        { msg: "User not found." },
        "User not found.",
        400
      );
    }

    const wallet = await Wallet.findOne({ user: user._id }).lean();

    if (!wallet) {
      return response.errorResponse(
        res,
        { msg: "Wallet not found." },
        "Wallet not found.",
        400
      );
    }

    const walletTransactions = await WalletTransaction.find({
      user: user._id,
    })
      .select("type amount")
      .lean();

    let debitedAmount = 0;
    let creditedAmount = 0;

    walletTransactions.map((eachTxn) =>
      eachTxn.type === "debit" ? (debitedAmount += eachTxn?.amount) : 0
    );

    walletTransactions.map((eachTxn) =>
      eachTxn.type === "credit" ? (creditedAmount += eachTxn?.amount) : 0
    );

    // Get pending withdrawal requests
    const pendingWithdrawals = await WithdrawalRequest.find({
      userId: user._id,
      status: "PENDING",
    })
      .select("amount")
      .lean();

    // Calculate total pending withdrawal amount
    const totalPendingWithdrawalAmount = pendingWithdrawals.reduce(
      (sum, withdrawal) => sum + (withdrawal.amount || 0),
      0
    );

    // Calculate available balance (e_cash - pending withdrawal amount)
    const availableBalance = Math.max(
      0,
      wallet.e_cash - totalPendingWithdrawalAmount
    );

    prepapreData = {
      ...wallet,
      debitedAmount,
      creditedAmount,
      pendingWithdrawalAmount: totalPendingWithdrawalAmount,
      availableBalance: availableBalance,
      hasPendingWithdrawal: pendingWithdrawals.length > 0,
    };

    return response.successResponse(
      res,
      prepapreData,
      "Fetch Total Balance Successfully."
    );
  } catch (err) {
    console.log(err);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

const fetchWalletTransactionsByUserID = async (req, res) => {
  const {
    limit = 20,
    page = 1,
    orderBy = "createdAt",
    ascending = "desc",
    filters = [],
  } = req.query;

  const pageSize = clampListPageSize(limit, 20, 100);
  const pageNum = clampPositivePage(page, 1);
  const order = ascending === "desc" ? -1 : 1;
  const skip = pageSize * (pageNum - 1);

  try {
    const userID = req.params.user_id;

    // Check if the user exists
    const user = await User.findById(userID).select("_id").lean();
    if (!user) {
      return response.errorResponse(
        res,
        { msg: "User not found." },
        "User not found.",
        400
      );
    }

    // Validate and parse filters from query params
    // Filters can come as: array, JSON string, or undefined
    let filtersArray = [];
    
    if (filters === undefined || filters === null) {
      filtersArray = [];
    } else if (Array.isArray(filters)) {
      // Already an array - use directly
      filtersArray = filters;
    } else if (typeof filters === "string") {
      // JSON string - parse it
      // Express automatically URL-decodes query params, so we should have clean JSON
      const trimmed = filters.trim();
      if (trimmed === "" || trimmed === "[]" || trimmed === "null") {
        filtersArray = [];
      } else {
        try {
          // Try parsing as JSON
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            filtersArray = parsed;
          } else {
            // Not an array - invalid format
            filtersArray = [];
          }
        } catch (e) {
          // Invalid JSON - treat as empty
          filtersArray = [];
        }
      }
    } else {
      // Unexpected type - treat as empty
      filtersArray = [];
    }

    // Base filter - always filter by user
    const filterData = {
      user: user._id,
    };

    // Process filters - convert frontend filter values to backend-compatible format
    filtersArray.forEach((filter) => {
      // Validate filter structure
      if (!filter || typeof filter !== "object") {
        return;
      }
      
      const { field, operator, value } = filter;
      
      // Skip if required fields are missing
      if (!field || !operator || value === null || value === undefined) {
        return;
      }

      const isNumericField = ["amount", "balanceAfterTransaction"].includes(field);
      const isDateField = field === "createdAt" || field === "updatedAt";
      let parsedValue = value;

      // Handle numeric fields
      if (isNumericField) {
        parsedValue = parseFloat(value);
        if (isNaN(parsedValue)) {
          return; // Invalid number
        }
      }

      // Handle date fields - convert ISO string dates to Date objects
      if (isDateField && typeof parsedValue === "string") {
        parsedValue = new Date(parsedValue);
        if (isNaN(parsedValue.getTime())) {
          return; // Invalid date
        }
      }

      // Handle regex fields - ensure value is a string and sanitize for partial matching
      if (operator === "regex") {
        if (typeof parsedValue !== "string" || !parsedValue.trim()) {
          return;
        }
        // Trim and escape special regex characters for safe partial matching
        parsedValue = parsedValue.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      }

      // Normalize enum fields before applying
      if (field === "walletType" && typeof parsedValue === "string") {
        parsedValue = parsedValue.toLowerCase().trim();
      }
      if (field === "type" && typeof parsedValue === "string") {
        parsedValue = parsedValue.toLowerCase().trim();
      }

      // Apply operator to filterData
      // Support multiple operators on same field (e.g., both gte and lte for ranges)
      switch (operator) {
        case "eq":
          filterData[field] = parsedValue;
          break;
        case "ne":
          filterData[field] = { $ne: parsedValue };
          break;
        case "regex":
          // parsedValue already escaped and trimmed above
          // No anchors (^ or $) means it will match anywhere in the string (partial match)
          filterData[field] = { $regex: parsedValue, $options: "i" };
          break;
        case "in":
          if (!Array.isArray(parsedValue) || parsedValue.length === 0) {
            return;
          }
          filterData[field] = {
            $in: parsedValue,
          };
          break;
        case "nin":
          if (!Array.isArray(parsedValue) || parsedValue.length === 0) {
            return;
          }
          filterData[field] = {
            $nin: parsedValue,
          };
          break;
        case "gte":
          // Greater than or equal - for amount/date ranges
          // Support multiple operators on same field (e.g., both gte and lte)
          if (!filterData[field] || typeof filterData[field] !== "object" || Array.isArray(filterData[field])) {
            filterData[field] = {};
          }
          filterData[field].$gte = parsedValue;
          break;
        case "lte":
          // Less than or equal - for amount/date ranges
          // Support multiple operators on same field (e.g., both gte and lte)
          if (!filterData[field] || typeof filterData[field] !== "object" || Array.isArray(filterData[field])) {
            filterData[field] = {};
          }
          filterData[field].$lte = parsedValue;
          break;
        case "gt":
          // Greater than
          if (!filterData[field] || typeof filterData[field] !== "object" || Array.isArray(filterData[field])) {
            filterData[field] = {};
          }
          filterData[field].$gt = parsedValue;
          break;
        case "lt":
          // Less than
          if (!filterData[field] || typeof filterData[field] !== "object" || Array.isArray(filterData[field])) {
            filterData[field] = {};
          }
          filterData[field].$lt = parsedValue;
          break;
        default:
          // Unknown operator - skip
          return;
      }
    });

    if (filterData.walletType && typeof filterData.walletType === "string") {
      const validWalletTypes = [
        "e_cash",
        "upgrade",
        "help",
        "ddf",
        "e_pool",
        "e_pool_upgrade",
      ];
      const normalizedWalletType = filterData.walletType.toLowerCase().trim();
      if (!validWalletTypes.includes(normalizedWalletType)) {
        delete filterData.walletType;
      } else {
        filterData.walletType = normalizedWalletType;
      }
    }

    if (filterData.type && typeof filterData.type === "string") {
      const validTypes = ["credit", "debit"];
      const normalizedType = filterData.type.toLowerCase().trim();
      if (!validTypes.includes(normalizedType)) {
        delete filterData.type;
      } else {
        filterData.type = normalizedType;
      }
    }

    // Ensure filterData is valid and always includes user filter
    if (!filterData.user) {
      filterData.user = user._id;
    }

    // Build aggregation pipeline (sort/skip/limit before lookups to limit work per page)
    const pipeline = [
      { $match: filterData },
      {
        $facet: {
          metadata: [
            { $count: "totalRecord" },
            {
              $addFields: {
                current_page: pageNum,
                per_page: pageSize,
              },
            },
          ],
          data: [
            { $sort: { [orderBy || "createdAt"]: order } },
            { $skip: skip },
            { $limit: pageSize },
            {
              $lookup: {
                from: "wallets",
                localField: "wallet",
                foreignField: "_id",
                as: "walletDetails",
              },
            },
            {
              $unwind: {
                path: "$walletDetails",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                _id: 1,
                user: 1,
                wallet: 1,
                type: 1,
                amount: 1,
                walletType: 1,
                balanceAfterTransaction: 1,
                description: 1,
                createdAt: 1,
                updatedAt: 1,
                walletBalance: "$walletDetails.totalBalance",
              },
            },
          ],
        },
      },
    ];

    const transactionsList = await WalletTransaction.aggregate(pipeline).collation({ locale: "en_US", strength: 1 });

    if (transactionsList[0]?.metadata?.length > 0) {
      return response.successResponse(
        res,
        transactionsList,
        "Wallet Transactions List."
      );
    } else {
      return response.successResponse(
        res,
        [
          {
            metadata: [
              { totalRecord: 0, current_page: pageNum, per_page: pageSize },
            ],
            data: [],
          },
        ],
        "No Wallet Transactions."
      );
    }
  } catch (err) {
    console.error("Error fetching wallet transactions:", err.message);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

const transferWalletToWalletByEPID = async (req, res) => {
  try {
    const senderID = req.user.id;
    const { EP_ID, amount, txn_password } = req.body;

    const transferAmount = Number(amount);
    if (
      isNaN(transferAmount) ||
      transferAmount <= 0 ||
      !Number.isFinite(transferAmount)
    ) {
      return response.errorResponse(
        res,
        {},
        "Amount must be a valid positive number",
        400
      );
    }

    // Early return if amount exceeds reasonable limit (adjust as needed)
    if (transferAmount > 1000000) {
      // Example: 1,000,000 limit
      return response.errorResponse(
        res,
        {},
        "Maximum transfer amount exceeded",
        400
      );
    }

    // Parallel fetching with optimized queries
    const [sender, receiver] = await Promise.all([
      User.findById(senderID).select("txn_password EP_ID status").lean(),
      User.findOne({ EP_ID }).select("_id EP_ID status name user_level").lean(),
    ]);

    // Validation checks
    if (!sender)
      return response.errorResponse(res, {}, "Sender not found", 404);

    if (sender.status === 2) {
      return response.errorResponse(
        res,
        {},
        "Cannot transfer to an inactive user.",
        400
      );
    }

    if (!receiver)
      return response.errorResponse(res, {}, "Receiver not found", 404);

    if (receiver.status === 2) {
      return response.errorResponse(
        res,
        {},
        "Cannot transfer to an inactive user.",
        400
      );
    }

    if (String(sender?.EP_ID) === String(receiver?.EP_ID)) {
      return response.errorResponse(
        res,
        {},
        "Cannot transfer to own wallet",
        400
      );
    }

    // Transaction password verification
    const isValidPassword = await comparePasswords(
      txn_password,
      sender.txn_password
    );
    if (!isValidPassword) {
      return response.errorResponse(
        res,
        [{ path: "txn_password", msg: "Incorrect Transaction Password." }],
        "Incorrect Transaction Password.",
        401
      );
    }

    // Check for pending withdrawal requests and calculate available balance
    const [wallet, pendingWithdrawals] = await Promise.all([
      Wallet.findOne({ user: sender._id }).select("e_cash").lean(),
      WithdrawalRequest.find({
        userId: sender._id,
        status: "PENDING",
      })
        .select("amount")
        .lean(),
    ]);

    if (!wallet) {
      return response.errorResponse(res, {}, "Wallet not found", 404);
    }

    // Calculate total pending withdrawal amount
    const totalPendingWithdrawalAmount = pendingWithdrawals.reduce(
      (sum, withdrawal) => sum + (withdrawal.amount || 0),
      0
    );

    // Calculate available balance (e_cash - pending withdrawal amount)
    // Ensure available balance is never negative
    const availableBalance = Math.max(
      0,
      wallet.e_cash - totalPendingWithdrawalAmount
    );

    // Check if transfer amount exceeds available balance
    if (transferAmount > availableBalance) {
      if (pendingWithdrawals.length > 0) {
        const pendingAmountText = totalPendingWithdrawalAmount.toFixed(2);
        const availableBalanceText = availableBalance.toFixed(2);
        const currentBalanceText = wallet.e_cash.toFixed(2);

        return response.errorResponse(
          res,
          {},
          `Cannot transfer. You have a pending withdrawal request of ₹${pendingAmountText}. Current E-Cash: ₹${currentBalanceText}, Available for transfer: ₹${availableBalanceText}`,
          400
        );
      } else {
        return response.errorResponse(
          res,
          {},
          `Insufficient balance. Available balance: ₹${availableBalance.toFixed(
            2
          )}`,
          400
        );
      }
    }

    // Atomic transfer operation
    const result = await transferWalletAmount(
      sender._id, // sender
      receiver._id, // receiver
      transferAmount, // amount
      "e_cash", // senderWalletType
      "e_cash", // receiverWalletType
      `Debited ₹${transferAmount} for wallet transfer to ${receiver.EP_ID}`, // senderDescription
      `Credited ₹${transferAmount} for wallet transfer from ${sender.EP_ID}` // receiverDescription
    );

    console.log("result=============>>", result);

    // Background processing
    if (receiver.status === 3 && receiver.user_level === 0) {
      setImmediate(async () => {
        try {
          await addJob("paymentProcessing", "sendPayment", receiver);
        } catch (err) {
          console.error("Payment processing job failed:", err);
        }
      });
    }

    // Success response
    return response.successResponse(
      res,
      {
        senderBalance: result.balances?.sender || 0,
        receiverBalance: result.balances?.receiver || 0,
      },
      `Successfully transferred ₹${transferAmount} to ${receiver.EP_ID}`
    );
  } catch (err) {
    console.error("Transfer error:", err);

    // Differentiate between business logic and system errors
    const statusCode =
      err.message.includes("balance") || err.message.includes("Password")
        ? 400
        : 500;

    return response.errorResponse(
      res,
      {},
      statusCode === 400 ? err.message : "Transaction failed",
      statusCode
    );
  }
};

const SURCHARGE_PERCENT = 15;

const transferEPooltoECashByEPID = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, txn_password } = req.body;

    const grossAmount = Number(amount);

    // ❌ Invalid amount
    if (!grossAmount || grossAmount <= 0) {
      return response.errorResponse(res, {}, "Invalid amount", 400);
    }

    const user = await User.findById(userId).select("txn_password EP_ID");
    if (!user) {
      return response.errorResponse(res, {}, "User not found", 404);
    }

    // ❌ Invalid txn password
    const isValidPassword = await comparePasswords(
      txn_password,
      user.txn_password
    );
    if (!isValidPassword) {
      return response.errorResponse(
        res,
        [{ path: "txn_password", msg: "Invalid transaction password" }],
        "Invalid transaction password",
        401
      );
    }

    // 🔴 IMPORTANT: CHECK E-POOL BALANCE
    const wallet = await Wallet.findOne({ user: userId })
      .select("e_pool")
      .lean();

    if (!wallet || wallet.e_pool <= 0) {
      return response.errorResponse(
        res,
        {},
        "Your E-Pool balance is zero",
        400
      );
    }

    if (grossAmount > wallet.e_pool) {
      return response.errorResponse(
        res,
        {},
        "Insufficient E-Pool balance",
        400
      );
    }

    const surcharge = (grossAmount * SURCHARGE_PERCENT) / 100;
    const netAmount = grossAmount - surcharge;

    const result = await transferEPoolToECashWithSurcharge({
      userId,
      grossAmount,
      netAmount,
      surcharge,
    });

    return response.successResponse(
      res,
      result,
      "E-Pool amount successfully transferred to E-Cash"
    );
  } catch (err) {
    console.error("E-Pool Transfer Error:", err);
    return response.errorResponse(res, {}, "Transaction failed", 500);
  }
};

const entryToEPool = async (req, res) => {
  try {
    const userId = req.user.id;
    const entryAmount = 500;

    const user = await User.findById(userId).lean();
    if (!user) return response.errorResponse(res, {}, "User not found", 404);

    if (user.is_root)
      return response.errorResponse(
        res,
        {},
        "Root users cannot enter E-Pool",
        403
      );

    if (
      !user.i_added_to_left ||
      !user.i_added_to_right ||
      user.total_direct_users < 2
    ) {
      return response.errorResponse(
        res,
        {},
        "You must add at least two direct users (one on left and one on right) before entering the E-Pool.",
        403
      );
    }

    if (user.has_entered_e_pool)
      return response.errorResponse(res, {}, "Already entered E-Pool", 400);

    const wallet = await Wallet.findOne({ user: userId }).lean();
    if (!wallet) {
      return response.errorResponse(res, {}, "Wallet not found", 404);
    }

    // Check for pending withdrawal requests
    const pendingWithdrawals = await WithdrawalRequest.find({
      userId: userId,
      status: "PENDING",
    })
      .select("amount")
      .lean();

    // Calculate total pending withdrawal amount
    const totalPendingWithdrawalAmount = pendingWithdrawals.reduce(
      (sum, withdrawal) => sum + (withdrawal.amount || 0),
      0
    );

    // Calculate available balance (e_cash - pending withdrawal amount)
    const availableBalance = Math.max(
      0,
      wallet.e_cash - totalPendingWithdrawalAmount
    );

    // Check if user has sufficient balance after pending withdrawal requests
    if (availableBalance < entryAmount) {
      if (totalPendingWithdrawalAmount > 0) {
        return response.errorResponse(
          res,
          {},
          `Insufficient E-Cash balance. You have a pending withdrawal request of ₹${totalPendingWithdrawalAmount.toFixed(
            2
          )}. Current E-Cash: ₹${wallet.e_cash.toFixed(
            2
          )}, Available for E-Pool entry: ₹${availableBalance.toFixed(
            2
          )}. Required: ₹${entryAmount.toFixed(2)}`,
          400
        );
      } else {
        return response.errorResponse(
          res,
          {},
          `Insufficient E-Cash balance. Current balance: ₹${wallet.e_cash.toFixed(
            2
          )}, Required: ₹${entryAmount.toFixed(2)}`,
          400
        );
      }
    }

    // Debit e_cash
    await updateWalletBalance(
      userId,
      entryAmount,
      "e_cash",
      "debit",
      `[E-Pool] DR | From:${user.EP_ID} | To:E_POOL | Amt:${entryAmount} | Level:1 | Reason:E-Pool entry`,
      null
    );

    // Credit e_pool_upgrade
    await updateWalletBalance(
      userId,
      entryAmount,
      "e_pool_upgrade",
      "credit",
      `[E-Pool] CR | From:E_POOL | To:${user.EP_ID} | Amt:${entryAmount} | Level:1 | Reason:E-Pool entry`,
      null
    );

    await User.findByIdAndUpdate(userId, { has_entered_e_pool: true });

    // addJob("ePoolProcessing", "EPOOL_ENTRY", { userId });
    addJob("ePoolProcessing", "EPOOL_ENTRY", { userId }).catch((err) => {
      console.error("[EPOOL QUEUE ERROR]", err.message);
    });

    return response.successResponse(res, {}, "Successfully entered E-Pool");
  } catch (err) {
    console.error(err);
    return response.errorResponse(res, {}, err.message, 500);
  }
};

module.exports = {
  fetchCurrentBalanceByUserID,
  fetchWalletTransactionsByUserID,
  transferWalletToWalletByEPID,
  transferEPooltoECashByEPID,
  entryToEPool,
};
