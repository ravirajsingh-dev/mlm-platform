const mongoose = require("mongoose");
var response = require("../../../config/response");
const User = require("../../../models/User");
const UserUpline = require("../../../models/UserUpline");
const {
  clampListPageSize,
  clampPositivePage,
} = require("../../../utils/paginationLimits");

const getUserDownlineTree = async (req, res) => {
  try {
    const userId = req.params.user_id;

    // Optimized projection using inclusion only
    const userProjection = {
      _id: 1,
      name: 1,
      email: 1,
      EP_ID: 1,
      status: 1,
      user_level: 1,
      left_leg: 1,
      right_leg: 1,
    };

    const userDetails = await User.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "users",
          let: { leftLegId: "$left_leg" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$leftLegId"] },
              },
            },
            { $project: userProjection },
          ],
          as: "left_leg",
        },
      },
      {
        $lookup: {
          from: "users",
          let: { rightLegId: "$right_leg" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$rightLegId"] },
              },
            },
            { $project: userProjection },
          ],
          as: "right_leg",
        },
      },
      {
        $addFields: {
          left_leg: { $ifNull: [{ $arrayElemAt: ["$left_leg", 0] }, null] },
          right_leg: { $ifNull: [{ $arrayElemAt: ["$right_leg", 0] }, null] },
        },
      },
      {
        $project: {
          ...userProjection,
          team: {
            $filter: {
              input: ["$left_leg", "$right_leg"],
              as: "member",
              cond: { $ne: ["$$member", null] },
            },
          },
        },
      },
      {
        $limit: 1, // Ensure single document output
      },
    ]).allowDiskUse(true); // For large datasets

    if (!userDetails.length) {
      return response.errorResponse(res, {}, "User not found.", 404);
    }

    return response.successResponse(
      res,
      userDetails[0],
      "Downline tree fetched successfully."
    );
  } catch (err) {
    console.error("Error fetching downline tree:", err);
    return response.errorResponse(
      res,
      {},
      "Server error. Please try again later.",
      500
    );
  }
};

const getUserDirectDownline = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      limit = 20,
      page = 1,
      orderBy = "createdAt",
      ascending = "desc",
      filters = [],
    } = req.query;

    // Validate pagination parameters (cap page size to limit accidental full scans)
    const rawPageSize = parseInt(limit, 10);
    const pageNumber = parseInt(page, 10);
    const order = ascending === "desc" ? -1 : 1;

    if (
      isNaN(pageNumber) ||
      pageNumber < 1 ||
      isNaN(rawPageSize) ||
      rawPageSize < 1
    ) {
      return response.errorResponse(
        res,
        {},
        "Invalid pagination parameters.",
        400
      );
    }
    const pageSize = Math.min(rawPageSize, 100);

    // Find current user
    const user = await User.findById(userId);
    if (!user) {
      return response.errorResponse(
        res,
        { msg: "User not found." },
        "User not found.",
        400
      );
    }

    // Parse filters
    let filtersArray = filters;
    if (typeof filters === "string") {
      try {
        filtersArray = JSON.parse(filters);
      } catch (e) {
        console.error("Invalid filters format:", e);
        filtersArray = [];
      }
    }

    // Build match criteria
    const matchCriteria = { sponsorEP: user.EP_ID };

    // Apply filters
    filtersArray.forEach(({ field, operator, value }) => {
      if (!field || !operator) return;

      let parsedValue = value;

      // Handle numeric fields
      if (field === "user_level") {
        parsedValue = parseInt(value);
        if (isNaN(parsedValue)) return;
      }

      switch (operator) {
        case "eq":
          matchCriteria[field] = parsedValue;
          break;
        case "ne":
          matchCriteria[field] = { $ne: parsedValue };
          break;
        case "regex":
          matchCriteria[field] = { $regex: parsedValue, $options: "i" };
          break;
        case "in":
          matchCriteria[field] = {
            $in: Array.isArray(parsedValue) ? parsedValue : [parsedValue],
          };
          break;
        case "nin":
          matchCriteria[field] = {
            $nin: Array.isArray(parsedValue) ? parsedValue : [parsedValue],
          };
          break;
      }
    });

    const skip = pageSize * (pageNumber - 1);

    const pipeline = [
      { $match: matchCriteria },
      {
        $lookup: {
          from: "users",
          localField: "uplineEP",
          foreignField: "EP_ID",
          as: "uplineInfo",
        },
      },
      { $unwind: { path: "$uplineInfo", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "wallets",
          localField: "_id",
          foreignField: "user",
          as: "walletInfo",
        },
      },
      { $unwind: { path: "$walletInfo", preserveNullAndEmptyArrays: true } },
      {
        $facet: {
          metadata: [
            { $count: "totalRecord" },
            { $addFields: { current_page: pageNumber, per_page: pageSize } },
          ],
          data: [
            { $sort: { [orderBy]: order } },
            { $skip: skip },
            { $limit: pageSize },
            {
              $project: {
                name: 1,
                phone: 1,
                email: 1,
                user_level: 1,
                position: 1,
                sponsorEP: 1,
                uplineEP: 1,
                uplineName: "$uplineInfo.name",
                EP_ID: 1,
                status: 1,
                state: 1,
                city: 1,
                createdAt: 1,
                e_cash: { $ifNull: ["$walletInfo.e_cash", 0] },
              },
            },
          ],
        },
      },
    ];

    const results = await User.aggregate(pipeline);

    if (results[0].metadata.length > 0) {
      return response.successResponse(
        res,
        results,
        "Direct downline fetched successfully."
      );
    } else {
      return response.successResponse(
        res,
        [
          {
            metadata: [
              { totalRecord: 0, current_page: pageNumber, per_page: pageSize },
            ],
            data: [],
          },
        ],
        "Direct downline fetched successfully."
      );
    }
  } catch (err) {
    console.error("Error fetching direct downline:", err);
    return response.errorResponse(
      res,
      {},
      "Server error. Please try again later.",
      500
    );
  }
};

const getMyTeamList = async (req, res) => {
  const {
    limit = 20,
    page = 1,
    orderBy = "createdAt",
    ascending = "desc",
    filters = [],
  } = req.query;

  const userID = req.params.user_id;
  const pageSize = clampListPageSize(limit, 20, 100);
  const pageNum = clampPositivePage(page, 1);
  const order = ascending === "desc" ? -1 : 1;
  const skip = pageSize * (pageNum - 1);

  try {
    // Validate and parse filters from query params
    // Filters can come as: array, JSON string (possibly URL-encoded), or undefined
    let filtersArray = [];
    
    if (filters === undefined || filters === null) {
      filtersArray = [];
    } else if (Array.isArray(filters)) {
      // Already an array - use directly (Express parsed it from query string)
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

    // Check for leg-based filtering (left/right leg structure)
    const legFilter = filtersArray.find((f) => f.field === "leg");
    let rootLegIdObjectId = null;
    let useLegFiltering = false;

    if (
      legFilter &&
      legFilter.operator === "eq" &&
      ["left", "right"].includes(legFilter.value)
    ) {
      // Get root user to find leg root
      const rootUser = await User.findById(userID)
        .select("left_leg right_leg")
        .lean();
      if (rootUser) {
        const rootLegId =
          legFilter.value === "left" ? rootUser.left_leg : rootUser.right_leg;
        if (rootLegId) {
          rootLegIdObjectId = new mongoose.Types.ObjectId(rootLegId);
          useLegFiltering = true;
        }
      }
      // Remove leg filter from filtersArray as it's handled separately
      filtersArray = filtersArray.filter((f) => f.field !== "leg");
    }

    // Base filter - use leg structure if leg filter is present, otherwise use uplines
    const matchCriteria = useLegFiltering
      ? {
          $or: [{ user: rootLegIdObjectId }, { uplines: rootLegIdObjectId }],
        }
      : {
          uplines: { $in: [new mongoose.Types.ObjectId(userID)] },
        };

    // Process filters - convert frontend filter values to backend-compatible format
    // Build filter conditions that will be applied after $lookup and $unwind of userInfo
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

      // Field path in aggregation after $unwind userInfo
      // After $unwind, userInfo becomes a nested object, so we use dot notation
      const userField = `userInfo.${field}`;
      let parsedValue = value;

      // Handle boolean fields (has_entered_e_pool)
      if (field === "has_entered_e_pool") {
        if (typeof parsedValue === "string") {
          parsedValue = parsedValue.toLowerCase() === "true";
        } else if (typeof parsedValue !== "boolean") {
          parsedValue = Boolean(parsedValue);
        }
      }

      // Handle numeric fields
      if (field === "user_level") {
        parsedValue = parseInt(value, 10);
        if (isNaN(parsedValue)) {
          return;
        }
      }

      // Handle status field - ensure it's a number
      if (field === "status") {
        if (operator === "in" && Array.isArray(parsedValue)) {
          parsedValue = parsedValue.map((v) => {
            if (typeof v === "string") {
              const num = parseInt(v, 10);
              return isNaN(num) ? null : num;
            }
            return typeof v === "number" ? v : null;
          }).filter((v) => v !== null);
          if (parsedValue.length === 0) {
            return;
          }
        } else if (operator === "eq") {
          if (typeof parsedValue === "string") {
            parsedValue = parseInt(parsedValue, 10);
          }
          if (isNaN(parsedValue) || typeof parsedValue !== "number") {
            return;
          }
        }
      }

      // Handle date fields - convert ISO string dates to Date objects
      if (field === "createdAt" && typeof parsedValue === "string") {
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
        // This allows users to search for partial matches without regex injection
        parsedValue = parsedValue.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      }

      // Apply operator to matchCriteria
      switch (operator) {
        case "eq":
          matchCriteria[userField] = parsedValue;
          break;
        case "ne":
          matchCriteria[userField] = { $ne: parsedValue };
          break;
        case "regex":
          // parsedValue already escaped and trimmed above
          // No anchors (^ or $) means it will match anywhere in the string (partial match)
          matchCriteria[userField] = { $regex: parsedValue, $options: "i" };
          break;
        case "in":
          if (!Array.isArray(parsedValue) || parsedValue.length === 0) {
            return;
          }
          matchCriteria[userField] = {
            $in: parsedValue,
          };
          break;
        case "nin":
          if (!Array.isArray(parsedValue) || parsedValue.length === 0) {
            return;
          }
          matchCriteria[userField] = {
            $nin: parsedValue,
          };
          break;
        case "gte":
          // Greater than or equal - for date ranges
          // Support multiple operators on same field (e.g., both gte and lte)
          if (!matchCriteria[userField] || typeof matchCriteria[userField] !== "object" || Array.isArray(matchCriteria[userField])) {
            matchCriteria[userField] = {};
          }
          matchCriteria[userField].$gte = parsedValue;
          break;
        case "lte":
          // Less than or equal - for date ranges
          // Support multiple operators on same field (e.g., both gte and lte)
          if (!matchCriteria[userField] || typeof matchCriteria[userField] !== "object" || Array.isArray(matchCriteria[userField])) {
            matchCriteria[userField] = {};
          }
          matchCriteria[userField].$lte = parsedValue;
          break;
        case "gt":
          // Greater than - for date ranges
          if (!matchCriteria[userField] || typeof matchCriteria[userField] !== "object" || Array.isArray(matchCriteria[userField])) {
            matchCriteria[userField] = {};
          }
          matchCriteria[userField].$gt = parsedValue;
          break;
        case "lt":
          // Less than - for date ranges
          if (!matchCriteria[userField] || typeof matchCriteria[userField] !== "object" || Array.isArray(matchCriteria[userField])) {
            matchCriteria[userField] = {};
          }
          matchCriteria[userField].$lt = parsedValue;
          break;
        default:
          // Unknown operator - skip
          return;
      }
    });

    // Ensure matchCriteria is a valid MongoDB query object
    // It should have base conditions (uplines or $or) plus any filter conditions
    if (!matchCriteria || typeof matchCriteria !== "object" || Array.isArray(matchCriteria)) {
      matchCriteria = {
        uplines: { $in: [new mongoose.Types.ObjectId(userID)] },
      };
    }
    
    // Ensure base condition exists (uplines or $or)
    // If filters overwrote it, restore it
    if (!matchCriteria.uplines && !matchCriteria.$or) {
      matchCriteria.uplines = { $in: [new mongoose.Types.ObjectId(userID)] };
    }

    // Narrow user_uplines before joins; keep userInfo.* filters in a second $match
    const preMatch = {};
    const postMatch = {};
    Object.entries(matchCriteria).forEach(([key, value]) => {
      if (key.startsWith("userInfo.")) postMatch[key] = value;
      else preMatch[key] = value;
    });

    // Build aggregation pipeline
    const pipeline = [
      { $match: preMatch },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
      ...(Object.keys(postMatch).length ? [{ $match: postMatch }] : []),

      {
        $lookup: {
          from: "users",
          localField: "userInfo.sponsorEP",
          foreignField: "EP_ID",
          as: "sponsorInfo",
        },
      },
      { $unwind: { path: "$sponsorInfo", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "users",
          localField: "userInfo.uplineEP",
          foreignField: "EP_ID",
          as: "uplineInfo",
        },
      },
      { $unwind: { path: "$uplineInfo", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "wallets",
          localField: "userInfo._id",
          foreignField: "user",
          as: "walletInfo",
        },
      },
      { $unwind: { path: "$walletInfo", preserveNullAndEmptyArrays: true } },

      {
        $project: {
          EP_ID: "$userInfo.EP_ID",
          name: "$userInfo.name",
          user_level: "$userInfo.user_level",
          position: "$userInfo.position",
          status: "$userInfo.status",
          has_entered_e_pool: "$userInfo.has_entered_e_pool",
          sponsorEP: "$userInfo.sponsorEP",
          uplineEP: "$userInfo.uplineEP",
          sponsorName: "$sponsorInfo.name",
          uplineName: "$uplineInfo.name",
          state: "$userInfo.state",
          city: "$userInfo.city",
          createdAt: "$userInfo.createdAt",
          e_cash: { $ifNull: ["$walletInfo.e_cash", 0] },
          e_pool: { $ifNull: ["$walletInfo.e_pool", 0] },
        },
      },
      {
        $facet: {
          metadata: [
            { $count: "totalRecord" },
            { $addFields: { current_page: pageNum, per_page: pageSize } },
          ],
          data: [
            { $sort: { [orderBy || "createdAt"]: order } },
            { $skip: skip },
            { $limit: pageSize },
          ],
        },
      },
    ];

    const userTeamList = await UserUpline.aggregate(pipeline).collation({ locale: "en_US", strength: 1 });

    if (userTeamList && userTeamList[0] && userTeamList[0].metadata && userTeamList[0].metadata.length > 0) {
      return response.successResponse(res, userTeamList, "My team List.");
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
        "My team list fetched."
      );
    }
  } catch (error) {
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

const applyFilters = (filters) => {
  const matchCriteria = {};

  filters.forEach((filter) => {
    if (filter.operator === "regex") {
      matchCriteria[filter.field] = {
        $regex: filter.value,
        $options: "i",
      };
    } else {
      matchCriteria[filter.field] = filter.value;
    }
  });

  return matchCriteria;
};

const getMyLegList = async (req, res) => {
  try {
    const { user_id, position } = req.params;
    const {
      page = 1,
      limit = 20,
      orderBy = "createdAt",
      ascending = "desc",
      filters: filtersParam = "[]",
    } = req.query;

    // Parse filters
    let filters = [];
    try {
      filters = JSON.parse(filtersParam);
      if (!Array.isArray(filters)) filters = [];
    } catch (e) {
      filters = [];
    }

    const pageSize = clampListPageSize(limit, 20, 100);
    const pageNum = clampPositivePage(page, 1);

    // Validate position
    if (!["left", "right"].includes(position)) {
      return res.status(400).json({
        status: false,
        message: "Invalid position parameter",
      });
    }

    // Find root user
    const rootUser = await User.findById(user_id)
      .select("left_leg right_leg")
      .lean();
    if (!rootUser) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    // Get root leg ID
    const rootLegId =
      position === "left" ? rootUser.left_leg : rootUser.right_leg;
    if (!rootLegId) {
      return res.json({
        status: true,
        response: [],
        count: 0,
      });
    }

    const rootLegIdObjectId = new mongoose.Types.ObjectId(rootLegId);

    const aggregationPipeline = [
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
      {
        $replaceRoot: {
          newRoot: {
            _id: "$userData._id",
            name: "$userData.name",
            status: "$userData.status",
            EP_ID: "$userData.EP_ID",
            sponsorEP: "$userData.sponsorEP",
            uplineEP: "$userData.uplineEP",
            user_level: "$userData.user_level",
            city: "$userData.city",
            state: "$userData.state",
            createdAt: "$userData.createdAt",
          },
        },
      },
      ...(filters.length ? [{ $match: applyFilters(filters) }] : []),
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
            { $sort: { [orderBy]: ascending === "asc" ? 1 : -1 } },
            { $skip: (pageNum - 1) * pageSize },
            { $limit: pageSize },
            {
              $lookup: {
                from: "wallets",
                localField: "_id",
                foreignField: "user",
                as: "walletInfo",
              },
            },
            { $unwind: { path: "$walletInfo", preserveNullAndEmptyArrays: true } },
            {
              $project: {
                _id: 1,
                name: 1,
                status: 1,
                EP_ID: 1,
                sponsorEP: 1,
                uplineEP: 1,
                user_level: 1,
                city: 1,
                state: 1,
                createdAt: 1,
                e_cash: { $ifNull: ["$walletInfo.e_cash", 0] },
              },
            },
          ],
        },
      },
    ];

    const downlineData = await UserUpline.aggregate(aggregationPipeline);

    // const downlineData = await UserUpline.aggregate([
    //   {
    //     $match: {
    //       $or: [{ user: rootLegIdObjectId }, { uplines: rootLegIdObjectId }],
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "users",
    //       localField: "user",
    //       foreignField: "_id",
    //       as: "userData",
    //     },
    //   },
    //   { $unwind: "$userData" },
    //   { $replaceRoot: { newRoot: "$userData" } },
    //   { $match: applyFilters(filters) },
    //   {
    //     $facet: {
    //       metadata: [
    //         { $count: "totalRecord" },
    //         {
    //           $addFields: {
    //             current_page: parseInt(page),
    //             per_page: parseInt(limit),
    //           },
    //         },
    //       ],
    //       data: [
    //         { $sort: { [orderBy]: ascending === "asc" ? 1 : -1 } },
    //         { $skip: (parseInt(page) - 1) * parseInt(limit) },
    //         { $limit: parseInt(limit) },
    //       ],
    //     },
    //   },
    // ]);

    // Handle empty results
    const result = downlineData[0] || { metadata: [], data: [] };
    const metadata = result.metadata[0] || {
      totalRecord: 0,
      current_page: pageNum,
      per_page: pageSize,
    };

    const totalPages = Math.ceil(metadata.totalRecord / pageSize);

    if (downlineData[0].metadata.length > 0) {
      return response.successResponse(res, downlineData, "My Leg List.");
    } else {
      return response.successResponse(
        res,
        [
          {
            metadata: [
              { totalRecord: 0, current_page: 1, per_page: totalPages },
            ],
            data: [],
          },
        ],
        "My Leg list fetched."
      );
    }
  } catch (err) {
    console.error(err);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

const getLevelSummary = async (req, res) => {
  try {
    const userId = req.params.user_id;
    const user = await User.findById(userId).lean();
    if (!user) {
      return response.errorResponse(res, {}, "No User Found", 404);
    }

    const LEVELS = Array.from({ length: 20 }, (_, i) => Math.pow(2, i + 1));
    const result = [];
    let currentLevel = 1;
    let currentUserIds = [userId];
    const BATCH_SIZE = 500; // Adjust based on your DB capacity

    while (currentLevel <= 20) {
      if (currentUserIds.length === 0) {
        result.push({
          level: currentLevel,
          requireTeam: LEVELS[currentLevel - 1],
          totalTeam: 0,
        });
        currentLevel++;
        continue;
      }

      let totalTeam = 0;
      const nextLevelUserIds = [];

      // Process in batches
      for (let i = 0; i < currentUserIds.length; i += BATCH_SIZE) {
        const batchIds = currentUserIds.slice(i, i + BATCH_SIZE);

        const batchResults = await User.aggregate([
          {
            $match: {
              _id: {
                $in: batchIds.map((id) => new mongoose.Types.ObjectId(id)),
              },
            },
          },
          {
            $graphLookup: {
              from: "users",
              startWith: ["$left_leg", "$right_leg"],
              connectFromField: "_id",
              connectToField: "_id",
              as: "direct_downlines",
              depthField: "level",
              maxDepth: 0, // Only direct downlines
            },
          },
          { $unwind: "$direct_downlines" },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              users: { $addToSet: "$direct_downlines._id" },
            },
          },
        ]);

        if (batchResults.length > 0) {
          totalTeam += batchResults[0].total || 0;
          nextLevelUserIds.push(...batchResults[0].users);
        }
      }

      result.push({
        level: currentLevel,
        requireTeam: LEVELS[currentLevel - 1],
        totalTeam,
      });

      // Deduplicate and prepare for next level
      currentUserIds = [...new Set(nextLevelUserIds)];
      currentLevel++;
    }

    const finalResult = LEVELS.map((requireTeam, index) => ({
      level: index + 1,
      requireTeam,
      totalTeam: result[index]?.totalTeam || 0,
    }));

    return response.successResponse(
      res,
      finalResult,
      "Level-wise team summary"
    );
  } catch (error) {
    console.error("Server error:", error);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

const getLevelUsers = async (req, res) => {
  try {
    const { user_id, level } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const parsedLevel = parseInt(level);
    const parsedPage = Math.max(1, parseInt(page));
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit)));

    // Validation
    if (isNaN(parsedLevel) || parsedLevel < 1 || parsedLevel > 20) {
      return response.errorResponse(res, {}, "Invalid level (1-20 only)", 400);
    }

    const user = await User.findById(user_id).lean();
    if (!user) return response.errorResponse(res, {}, "User not found", 404);

    let currentUserIds = [user_id];
    const BATCH_SIZE = 500;

    // Traverse to target level using same logic as getLevelSummary
    for (let currentLevel = 1; currentLevel <= parsedLevel; currentLevel++) {
      const nextLevelUserIds = [];

      // Process in batches
      for (let i = 0; i < currentUserIds.length; i += BATCH_SIZE) {
        const batch = currentUserIds.slice(i, i + BATCH_SIZE);

        const batchResults = await User.aggregate([
          {
            $match: {
              _id: { $in: batch.map((id) => new mongoose.Types.ObjectId(id)) },
            },
          },
          {
            $graphLookup: {
              from: "users",
              startWith: ["$left_leg", "$right_leg"],
              connectFromField: "_id",
              connectToField: "_id",
              as: "direct_downlines",
              depthField: "level",
              maxDepth: 0,
            },
          },
          { $unwind: "$direct_downlines" },
          {
            $group: {
              _id: null,
              users: { $addToSet: "$direct_downlines._id" },
            },
          },
        ]);

        if (batchResults.length > 0) {
          nextLevelUserIds.push(...batchResults[0].users);
        }
      }

      currentUserIds = [...new Set(nextLevelUserIds)];
    }

    // Paginate results
    const total = currentUserIds.length;
    const startIdx = (parsedPage - 1) * parsedLimit;
    const paginatedIds = currentUserIds.slice(startIdx, startIdx + parsedLimit);

    // Get user details
    const users = await User.aggregate([
      {
        $match: {
          _id: {
            $in: paginatedIds.map((id) => new mongoose.Types.ObjectId(id)),
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "uplineEP",
          foreignField: "EP_ID",
          as: "upline",
        },
      },
      { $unwind: { path: "$upline", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "sponsorEP",
          foreignField: "EP_ID",
          as: "sponsor",
        },
      },
      { $unwind: { path: "$sponsor", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "wallets",
          localField: "_id",
          foreignField: "user",
          as: "walletInfo",
        },
      },
      { $unwind: { path: "$walletInfo", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: 1,
          EP_ID: 1,
          user_level: 1,
          position: 1,
          createdAt: 1,
          sponsorEP: 1,
          uplineEP: 1,
          status: 1,
          uplineName: "$upline.name",
          sponsorName: "$sponsor.name",
          e_cash: { $ifNull: ["$walletInfo.e_cash", 0] },
        },
      },
    ]);

    return response.successResponse(
      res,
      {
        users,
        total,
        page: parsedPage,
        totalPages: Math.ceil(total / parsedLimit),
      },
      "Level users fetched successfully"
    );
  } catch (error) {
    console.error("Error fetching level users:", error);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

module.exports = {
  getUserDownlineTree,
  getUserDirectDownline,
  getMyTeamList,
  getLevelSummary,
  getLevelUsers,
  getMyLegList,
};
