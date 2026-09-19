const { validationResult } = require("express-validator");
var response = require("../../../config/response");

const Admin = require("../../../models/Admin");
const User = require("../../../models/User");
const Wallet = require("../../../models/Wallet");

const fetchAdminDashboardData = async (req, res) => {
  try {
    const adminID = req.user.id;

    const admin = await Admin.findById({ _id: adminID }).select("_id").lean();

    if (!admin) {
      return response.errorResponse(
        res,
        { msg: "Admin not found." },
        "Admin not found.",
        400
      );
    }

    const totalUserCount = await User.countDocuments({});

    const totalCurrentBalanceResult = await Wallet.aggregate([
      {
        $group: {
          _id: null,
          totalCurrentBalance: { $sum: "$totalBalance" },
        },
      },
    ]);

    const totalCurrentBalance =
      totalCurrentBalanceResult.length > 0
        ? totalCurrentBalanceResult[0].totalCurrentBalance
        : 0;

    const adminDashboardData = {
      totalUserCount,
      totalCurrentBalance,
    };

    return response.successResponse(
      res,
      adminDashboardData,
      "Admin dashboard data fetched successfully."
    );
  } catch (err) {
    console.log(err);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

module.exports = {
  fetchAdminDashboardData,
};
