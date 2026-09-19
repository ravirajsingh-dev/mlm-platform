const response = require("../../../config/response");
const User = require("../../../models/User");
const PaymentLink = require("../../../models/PaymentLink");

// @desc Get dashboard statistics for a specific user
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.params.user_id;

    // Fetch user to get EP_ID
    const user = await User.findById(userId).select("EP_ID user_level");

    if (!user) {
      return response.errorResponse(
        res,
        { msg: "User not found." },
        "User not found.",
        400
      );
    }

    const { EP_ID, user_level } = user;

    console.log("user=============", user);

    // Count of direct users for the specific sponsorEP
    const directUsersCount = await User.countDocuments({
      sponsorEP: EP_ID,
    });

    // Aggregate statistics for payments
    const stats = await PaymentLink.aggregate([
      {
        $match: { receiver: user._id },
      },
      {
        $group: {
          _id: null,
          totalDirectReceived: {
            $sum: {
              $cond: [{ $eq: ["$payment_type", "Direct"] }, "$amount", 0],
            },
          },
          totalDirectPending: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$payment_type", "Direct"] },
                    { $eq: ["$receiver_status", "pending"] },
                  ],
                },
                "$amount",
                0,
              ],
            },
          },
          totalPassiveReceived: {
            $sum: {
              $cond: [{ $eq: ["$payment_type", "Passive"] }, "$amount", 0],
            },
          },
          totalPassivePending: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$payment_type", "Passive"] },
                    { $eq: ["$receiver_status", "pending"] },
                  ],
                },
                "$amount",
                0,
              ],
            },
          },
          totalPendingRequests: {
            $sum: {
              $cond: [{ $eq: ["$receiver_status", "pending"] }, 1, 0],
            },
          },
        },
      },
    ]);

    // Destructure results safely
    const [result] = stats;
    const directReceived = result?.totalDirectReceived || 0;
    const directPending = result?.totalDirectPending || 0;
    const passiveReceived = result?.totalPassiveReceived || 0;
    const passivePending = result?.totalPassivePending || 0;
    const totalPendingRequests = result?.totalPendingRequests || 0;

    return response.successResponse(
      res,
      {
        directUsersCount,
        totalDirectReceived: directReceived,
        totalDirectPending: directPending,
        totalPassiveReceived: passiveReceived,
        totalPassivePending: passivePending,
        totalPendingRequests,
        userLevelObject: {
          user_level,
        },
      },
      "Dashboard statistics fetched successfully."
    );
  } catch (err) {
    console.error("Error fetching dashboard stats:", err);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

module.exports = {
  getDashboardStats,
};
