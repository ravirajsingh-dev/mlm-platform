const mongoose = require("mongoose");
const EPin = require("../models/EPin");
const PaymentLink = require("../models/PaymentLink");
const User = require("../models/User");
const Wallet = require("../models/Wallet");
const WalletTransaction = require("../models/WalletTransaction");
const UserUpline = require("../models/UserUpline");

const getWalletDetails = async (userObjectId) => {
  return Wallet.findOne({ user: userObjectId })
    .select("user totalBalance e_cash upgrade ddf")
    .lean();
};

const getPaymentSummary = async (userObjectId) => {
  const paymentStats = await PaymentLink.aggregate([
    {
      $match: {
        $or: [
          {
            receiver: userObjectId,
            sender_status: "paid",
            receiver_status: "confirmed",
            status: "completed",
          },
          {
            sender: userObjectId,
            payment_type: "Upgrade",
            sender_status: "paid",
            receiver_status: "confirmed",
            status: "completed",
          },
        ],
      },
    },
    {
      $facet: {
        receivedPayments: [
          {
            $match: {
              receiver: userObjectId,
              sender_status: "paid",
              receiver_status: "confirmed",
              status: "completed",
            },
          },
          {
            $group: {
              _id: "$payment_type",
              totalReceived: { $sum: "$amount" },
            },
          },
        ],
        upgradePaid: [
          {
            $match: {
              sender: userObjectId,
              payment_type: "Upgrade",
              sender_status: "paid",
              receiver_status: "confirmed",
              status: "completed",
            },
          },
          {
            $group: {
              _id: null,
              totalPaid: { $sum: "$amount" },
            },
          },
        ],
      },
    },
  ]);

  const receivedData = paymentStats[0]?.receivedPayments || [];
  const upgradePaidData = paymentStats[0]?.upgradePaid?.[0]?.totalPaid || 0;

  const paymentSummary = {
    directReceived: 0,
    passiveReceived: 0,
    upgradeReceived: 0,
    upgradePaid: upgradePaidData,
  };

  for (const entry of receivedData) {
    if (entry._id === "Direct")
      paymentSummary.directReceived = entry.totalReceived;
    else if (entry._id === "Passive")
      paymentSummary.passiveReceived = entry.totalReceived;
    else if (entry._id === "Upgrade")
      paymentSummary.upgradeReceived = entry.totalReceived;
  }

  return paymentSummary;
};

const getUnusedEPins = async (EP_ID) => {
  if (!EP_ID) return 0;

  return EPin.countDocuments({
    EP_ID: EP_ID,
    is_expired: false,
    $or: [{ used_by: null }, { used_by: { $exists: false } }],
  });
};

const getCommunityDDF = async (communityId) => {
  const communityWallet = await Wallet.findOne({ user: communityId })
    .select("ddf")
    .lean();
  return communityWallet?.ddf || 0;
};

const calculateSponsorIncome = async (userId) => {
  const result = await WalletTransaction.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        description: { $regex: /^Upgrade commission: Received/i },
        type: "credit",
      },
    },
    {
      $group: {
        _id: null,
        totalSponsorIncome: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ]);

  return result[0] || { totalSponsorIncome: 0, count: 0 };
};

const getTeamSummary = async (userObjectId, leftLegId, rightLegId) => {
  const { start, end } = getTodayISTRangeUTC();

  const [leftUsers, rightUsers] = await Promise.all([
    leftLegId
      ? getDownlineCountsWithAggregation(leftLegId, start, end)
      : { active: 0, inactive: 0, total: 0, today: 0 },
    rightLegId
      ? getDownlineCountsWithAggregation(rightLegId, start, end)
      : { active: 0, inactive: 0, total: 0, today: 0 },
  ]);

  return {
    totalTeam: leftUsers.total + rightUsers.total,
    totalActive: leftUsers.active + rightUsers.active,
    totalInactive: leftUsers.inactive + rightUsers.inactive,
    todayJoined: leftUsers.today + rightUsers.today,
    totalLeft: leftUsers.active,
    totalRight: rightUsers.active,
  };
};

const getDownlineCountsWithAggregation = async (
  rootLegIdObjectId,
  startOfToday,
  endOfToday
) => {
  const pipeline = [
    {
      $match: {
        $or: [{ user: rootLegIdObjectId }, { uplines: rootLegIdObjectId }],
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "userData",
      },
    },
    { $unwind: "$userData" },
    { $replaceRoot: { newRoot: "$userData" } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: {
          $sum: { $cond: [{ $eq: ["$status", 1] }, 1, 0] },
        },
        inactive: {
          $sum: { $cond: [{ $in: ["$status", [2, 3]] }, 1, 0] },
        },
        today: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gte: ["$createdAt", startOfToday] },
                  { $lte: ["$createdAt", endOfToday] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
    { $project: { _id: 0, total: 1, active: 1, inactive: 1, today: 1 } },
  ];

  const result = await UserUpline.aggregate(pipeline);
  return result[0] || { total: 0, active: 0, inactive: 0, today: 0 };
};

const getTodayISTRangeUTC = () => {
  const now = new Date();

  // Get today's IST date parts
  const istYear = now.toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
  });
  const istMonth = now.toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
    month: "2-digit",
  });
  const istDay = now.toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
  });

  // IST midnight → UTC (subtract 5:30)
  const start = new Date(`${istYear}-${istMonth}-${istDay}T00:00:00+05:30`);
  const end = new Date(`${istYear}-${istMonth}-${istDay}T23:59:59.999+05:30`);

  return { start, end };
};

module.exports = {
  getWalletDetails,
  getPaymentSummary,
  getUnusedEPins,
  getCommunityDDF,
  getTeamSummary,
  calculateSponsorIncome,
};
