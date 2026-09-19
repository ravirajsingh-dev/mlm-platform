const mongoose = require("mongoose");
var response = require("../../../config/response");
const User = require("../../../models/User");
const Admin = require("../../../models/Admin");
const SevaKendra = require("../../../models/SevaKendra");
const CommonSettings = require("../../../models/CommonSettings");

const { getSetting } = require("../../../models/Setting");

const {
  getWalletDetails,
  getPaymentSummary,
  getUnusedEPins,
  getCommunityDDF,
  getTeamSummary,
  calculateSponsorIncome,
} = require("../../../utils/dashboardUtils");
const {
  getCachedPayload,
  setCachedPayload,
} = require("../../../utils/publicSettingsCache");
const {
  clampListPageSize,
  clampPositivePage,
} = require("../../../utils/paginationLimits");

const getUsersList = async (req, res) => {
  try {
    const limitVal = clampListPageSize(req.query.limit, 50, 50);
    const rawSkip = parseInt(req.query.skip, 10);
    const skip = Number.isFinite(rawSkip) && rawSkip >= 0 ? rawSkip : 0;

    const usersList = await User.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitVal)
      .lean();

    return response.successResponse(res, usersList, "Users List.");
  } catch (err) {
    console.log(err);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

const getAdminDetails = async (req, res) => {
  try {
    const adminDetails = await Admin.findOne({})
      .select("-password -uuid")
      .lean();

    return response.successResponse(res, adminDetails, "Admin Details.");
  } catch (err) {
    console.error("Error fetching primary credentials:", err);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

const EPIDDetails = async (req, res) => {
  try {
    const epID = req.params.e2e_id;

    if (!epID) return;

    // Find the user by ID
    const user = await User.findOne({ EP_ID: epID }).select("name status").lean();

    // If user is not found or inactive, return error
    if (!user || user.status !== 1) {
      return response.errorResponse(
        res,
        [
          {
            path: "EP_ID",
            msg: !user
              ? "No user found with the provided EP_ID"
              : "User is not active",
          },
        ],
        !user ? "User not found with the provided EP_ID" : "User is inactive",
        404
      );
    }

    return response.successResponse(res, user, "Sopnsor User details");
  } catch (err) {
    console.error(err.message);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

const getSevaKendrasList = async (req, res) => {
  const {
    limit = 20,
    page = 1,
    orderBy = "createdAt",
    ascending = "desc",
  } = req.query;

  const pageSize = clampListPageSize(limit, 20, 50);
  const pageNum = clampPositivePage(page, 1);
  const order = ascending === "desc" ? -1 : 1;
  const skip = pageSize * (pageNum - 1);

  try {
    // Get total count
    const totalRecord = await SevaKendra.countDocuments({});

    // Aggregation for paginated SevaKendras with user info
    const data = await SevaKendra.aggregate([
      {
        $sort: { [orderBy]: order },
      },
      {
        $skip: skip,
      },
      {
        $limit: pageSize,
      },
      {
        $lookup: {
          from: "users", // collection name in MongoDB (should match actual name)
          localField: "EP_ID", // SevaKendra.EP_ID
          foreignField: "EP_ID", // User.EP_ID
          as: "userInfo",
        },
      },
      {
        $unwind: {
          path: "$userInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          EP_ID: 1,
          is_active: 1,
          createdAt: 1,
          updatedAt: 1,
          // Add user info
          name: "$userInfo.name",
          phone: "$userInfo.phone",
          city: "$userInfo.city",
          state: "$userInfo.state",
        },
      },
    ]);

    const formattedData = [
      {
        metadata: [
          {
            totalRecord,
            current_page: pageNum,
            per_page: pageSize,
          },
        ],
        data,
      },
    ];

    return response.successResponse(
      res,
      formattedData,
      "Filtered Seva Kendras List with User Info."
    );
  } catch (err) {
    console.error("Error fetching SevaKendras:", err);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

const getDashboardDetails = async (req, res) => {
  try {
    const { user_id } = req.params;
    const userObjectId = new mongoose.Types.ObjectId(user_id);

    // Fetch user data and community ID concurrently
    const [userData, communityId] = await Promise.all([
      User.findById(userObjectId).select("EP_ID left_leg right_leg").lean(),
      getSetting("_community_root_id"),
    ]);

    if (!userData) {
      return response.errorResponse(res, {}, "User not found", 404);
    }

    // Define the start of today for filtering today's joins
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Execute independent operations concurrently
    const [
      walletDetails,
      paymentSummary,
      unusedEPins,
      communityDDF,
      sponsorIncome,
      teamSummary,
    ] = await Promise.all([
      getWalletDetails(userObjectId),
      getPaymentSummary(userObjectId),
      getUnusedEPins(userData.EP_ID),
      getCommunityDDF(communityId),
      calculateSponsorIncome(user_id),
      getTeamSummary(
        userObjectId,
        userData.left_leg,
        userData.right_leg,
        startOfToday
      ),
    ]);

    // Compile the dashboard data
    const dashboardData = {
      walletDetails,
      paymentSummary,
      unusedEPins,
      communityDDF,
      sponsorIncome,
      teamSummary,
    };

    return response.successResponse(res, dashboardData, "Dashboard Details");
  } catch (err) {
    console.error("Dashboard Error:", err.message);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

const getPublicCommonSettings = async (req, res) => {
  try {
    const cached = getCachedPayload();
    if (cached) {
      return response.successResponse(
        res,
        cached,
        "Public settings retrieved successfully."
      );
    }

    // Get or create settings (ensures one document exists)
    const settings = await CommonSettings.getOrCreateSettings();

    // Return public-facing settings (marquee and footer settings)
    const publicSettings = {
      marqueeEnabled: settings.marqueeEnabled || false,
      marqueeMessage: settings.marqueeMessage || "",
      marqueeType: settings.marqueeType || "warning",
      // Footer settings
      name: settings.name || "Application Name",
      contactUs: settings.contactUs || "",
      email: settings.email || "",
      address: settings.address || "",
      planPdfUrl: settings.planPdfUrl || "",
      socialMedia: {
        instagram: settings.socialMedia?.instagram || "",
        facebook: settings.socialMedia?.facebook || "",
        youtube: settings.socialMedia?.youtube || "",
        zoomMeeting: settings.socialMedia?.zoomMeeting || "",
      },
    };

    setCachedPayload(publicSettings);

    return response.successResponse(
      res,
      publicSettings,
      "Public settings retrieved successfully."
    );
  } catch (err) {
    console.error("Error in getPublicCommonSettings:", err);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

module.exports = {
  getUsersList,
  getAdminDetails,
  getDashboardDetails,
  EPIDDetails,
  getSevaKendrasList,
  getPublicCommonSettings,
};
