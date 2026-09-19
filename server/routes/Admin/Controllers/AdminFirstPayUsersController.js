const response = require("../../../config/response");

const Admin = require("../../../models/Admin");
const User = require("../../../models/User");
const FirstPayUser = require("../../../models/FirstPayUser");
const PaymentLink = require("../../../models/PaymentLink");

const { comparePasswords } = require("../../../utils/helper");
const Level = require("../../../models/Level");
const {
  clampListPageSize,
  clampPositivePage,
} = require("../../../utils/paginationLimits");

const getFirstPayUsersList = async (req, res) => {
  const {
    limit = 10,
    page = 1,
    orderBy = "createdAt",
    ascending = "desc",
  } = req.query;

  const pageSize = clampListPageSize(limit, 10, 50);
  const pageNum = clampPositivePage(page, 1);
  const order = ascending === "desc" ? -1 : 1;
  const skip = pageSize * (pageNum - 1);

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

    let firstPayUser = await FirstPayUser.findOne({});
    if (!firstPayUser) {
      firstPayUser = new FirstPayUser();
      await firstPayUser.save();
    }

    const filterData = {};
    const assignUserLevelsList = await FirstPayUser.aggregate([
      {
        $match: filterData,
      },
      {
        $project: {
          levels: {
            $filter: {
              input: "$levels",
              as: "level",
              cond: { $ne: ["$$level.assignedUser", null] },
            },
          },
          createdAt: 1,
        },
      },
      {
        $unwind: "$levels",
      },
      {
        $lookup: {
          from: "users",
          localField: "levels.assignedUser",
          foreignField: "_id",
          as: "assignedUserDetails",
        },
      },
      {
        $unwind: {
          path: "$assignedUserDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "config_levels",
          localField: "levels.value",
          foreignField: "level",
          as: "levelDetails",
        },
      },
      {
        $unwind: {
          path: "$levelDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "payment_links",
          let: {
            assignedUserId: "$levels.assignedUser",
            amount: "$levelDetails.earnings_on_upgrade.deal_bits",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$receiver", "$$assignedUserId"] },
                    { $eq: ["$sender_status", "pending"] },
                    { $eq: ["$status", "pending"] },
                    { $eq: ["$amount", "$$amount"] },
                  ],
                },
              },
            },
          ],
          as: "pendingLinks",
        },
      },
      {
        $addFields: {
          "levels.pendingLinksCount": { $size: "$pendingLinks" },
          "levels.assignedUserName": "$assignedUserDetails.name",
        },
      },
      {
        $group: {
          _id: "$_id",
          levels: { $push: "$levels" },
          createdAt: { $first: "$createdAt" },
        },
      },
      {
        $facet: {
          metadata: [
            { $count: "totalRecord" },
            { $addFields: { current_page: pageNum, per_page: pageSize } },
          ],
          data: [
            {
              $sort: {
                [orderBy]: order,
              },
            },
            { $skip: skip },
            { $limit: pageSize },
          ],
        },
      },
    ]);

    assignUserLevelsList[0].data =
      assignUserLevelsList[0].data && assignUserLevelsList[0].data.length > 0
        ? assignUserLevelsList[0].data[0].levels
        : [];

    if (assignUserLevelsList[0].metadata.length > 0) {
      return response.successResponse(
        res,
        assignUserLevelsList,
        "Filtered Levels List."
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
        "No levels with assigned users found."
      );
    }
  } catch (err) {
    console.error("Error fetching levels:", err);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

const createFirstPayUser = async (req, res) => {
  try {
    const adminID = req.user.id;
    const { EP_ID, level, pendingLinks, txn_password } = req.body;

    if (pendingLinks < 1) {
      return response.errorResponse(
        res,
        {},
        "At least one pending link is required to proceed.",
        400
      );
    }

    const admin = await Admin.findById(adminID).lean();
    if (!admin) {
      return response.errorResponse(res, {}, "Admin not found", 500);
    }

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

    const user = await User.findOne({ EP_ID }).lean();
    if (!user) {
      return response.errorResponse(res, {}, "User not found", 500);
    }

    let firstPayUser = await FirstPayUser.findOne().exec();
    if (!firstPayUser) {
      firstPayUser = new FirstPayUser();
      await firstPayUser.save();
    }

    const levelToAssign = firstPayUser.levels.find(
      (lvl) => lvl.value === level
    );
    if (!levelToAssign) {
      return response.errorResponse(res, {}, "Invalid level specified.", 400);
    }

    levelToAssign.assignedUser = user._id;

    await firstPayUser.save();

    return response.successResponse(
      res,
      { levelToAssign },
      `User successfully assigned to level ${levelToAssign.label}.`
    );
  } catch (err) {
    console.error("Error assigning user to level:", err);
    return res.status(500).json({ message: "Failed to assign user to level." });
  }
};

const checkUserPendingLinkEligibility = async (req, res) => {
  try {
    const { e2e_id: userEPID, level: userLevel } = req.params;

    const user = await User.findOne({ EP_ID: userEPID }).select(
      "name user_level"
    );

    if (!user) {
      return response.errorResponse(
        res,
        [{ path: "EP_ID", msg: "User does not exist with this EP ID." }],
        "User does not exist with this EP ID.",
        404
      );
    }

    const level = await Level.findOne({ level: userLevel });

    if (!level) {
      return response.errorResponse(
        res,
        [{ path: "level", msg: "Invalid level or something went wrong." }],
        "Invalid level or something went wrong.",
        400
      );
    }

    const pendingLinksCount = await PaymentLink.countDocuments({
      receiver: user._id,
      sender_status: "pending",
      amount: level?.earnings_on_upgrade?.deal_bits,
      status: "pending",
    });

    if (pendingLinksCount === 0) {
      return response.errorResponse(
        res,
        [
          {
            path: "level",
            msg: `User ${user.name} is not eligible for the payment of Level: ${level.title}.`,
          },
        ],
        `User ${user.name} is not eligible for the payment of Level: ${level.title}.`,
        400
      );
    }

    const userData = {
      user,
      pendingLinksCount,
    };

    return response.successResponse(
      res,
      userData,
      "User is eligible for pending payment."
    );
  } catch (error) {
    console.error("Error in checkUserPendingLinkEligibility:", error.message);
    return response.errorResponse(res, {}, "Internal Server Error", 500);
  }
};

const getAvailableLevelsList = async (req, res) => {
  try {
    const adminID = req.user.id;
    const admin = await Admin.findById(adminID).select("_id").lean();

    if (!admin) {
      return response.errorResponse(
        res,
        { msg: "Admin not found." },
        "Admin not found.",
        400
      );
    }

    let firstPayUser = await FirstPayUser.findOne({});
    if (!firstPayUser) {
      firstPayUser = new FirstPayUser();
      await firstPayUser.save();
    }

    const levelsList = await FirstPayUser.aggregate([
      {
        $unwind: "$levels",
      },
      {
        $match: {
          "levels.assignedUser": null,
        },
      },
      {
        $replaceRoot: { newRoot: "$levels" },
      },
    ]);

    if (levelsList.length > 0) {
      return response.successResponse(
        res,
        levelsList,
        "Available levels fetched successfully."
      );
    } else {
      return response.successResponse(res, [], "No available levels found.");
    }
  } catch (err) {
    console.error("Error fetching available levels:", err);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

const deleteFirstPayUserByID = async (req, res) => {
  try {
    const adminID = req.user.id;
    const levelID = req.params.level_id;

    const admin = await Admin.findById(adminID)
      .select("_id txn_password")
      .lean();

    if (!admin) {
      return response.errorResponse(
        res,
        { msg: "Admin not found." },
        "Admin not found.",
        400
      );
    }

    const { txn_password } = req.body;

    const validPassword = await comparePasswords(
      txn_password,
      admin.txn_password
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

    const updatedUser = await FirstPayUser.updateOne(
      { "levels._id": levelID },
      { $set: { "levels.$.assignedUser": null } }
    );

    if (updatedUser.nModified === 0) {
      return response.errorResponse(
        res,
        { msg: "Level not found or no changes made." },
        "Failed to update level.",
        400
      );
    }

    return response.successResponse(
      res,
      { msg: "Assigned user reset to null successfully." },
      "Level updated successfully."
    );
  } catch (err) {
    console.error("Error updating level:", err);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

module.exports = {
  getFirstPayUsersList,
  createFirstPayUser,
  checkUserPendingLinkEligibility,
  getAvailableLevelsList,
  deleteFirstPayUserByID,
};
