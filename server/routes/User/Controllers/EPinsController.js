const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const response = require("../../../config/response");
const { comparePasswords } = require("../../../utils/helper");

const User = require("../../../models/User");
const EPin = require("../../../models/EPin");
const EPinTransferReport = require("../../../models/EPinTransferReport");
const {
  clampListPageSize,
  clampPositivePage,
} = require("../../../utils/paginationLimits");

const getEPinsList = async (req, res) => {
  const {
    limit = 20,
    page = 1,
    orderBy = "createdAt",
    ascending = "desc",
    filters,
  } = req.query;

  const pageSize = clampListPageSize(limit, 20, 100);
  const currentPage = clampPositivePage(page, 1);
  const order = ascending === "desc" ? -1 : 1;
  const skip = pageSize * (currentPage - 1);

  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select("EP_ID").lean();
    if (!user || !user.EP_ID) {
      return response.errorResponse(
        res,
        { msg: "User not found or missing EP_ID." },
        "User not found.",
        400
      );
    }

    const filter = { EP_ID: user.EP_ID };

    // Process filters array if provided
    let filtersArray = [];
    if (filters) {
      try {
        filtersArray =
          typeof filters === "string" ? JSON.parse(filters) : filters;
      } catch (err) {
        console.error("Error parsing filters:", err);
        filtersArray = [];
      }
    }

    // Apply filters to the filter object
    if (Array.isArray(filtersArray) && filtersArray.length > 0) {
      filtersArray.forEach(({ field, operator, value }) => {
        if (!field || !operator) return;

        switch (operator) {
          case "eq":
            filter[field] = value;
            break;
          case "ne":
            filter[field] = { $ne: value };
            break;
          case "in":
            filter[field] = {
              $in: Array.isArray(value) ? value : [value],
            };
            break;
          case "nin":
            filter[field] = {
              $nin: Array.isArray(value) ? value : [value],
            };
            break;
          case "regex":
            filter[field] = { $regex: value, $options: "i" };
            break;
        }
      });
    }

    const epinsList = await EPin.aggregate([
      { $match: filter },
      {
        $facet: {
          metadata: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                used: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $eq: ["$is_expired", true] },
                          { $ne: ["$used_by", null] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                unused: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $eq: ["$is_expired", false] },
                          {
                            $or: [
                              { $eq: ["$used_by", null] },
                              { $not: ["$used_by"] },
                            ],
                          },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
            {
              $project: {
                _id: 0,
                total: 1,
                used: 1,
                unused: 1,
                current_page: { $literal: currentPage },
                per_page: { $literal: pageSize },
              },
            },
          ],
          data: [
            { $sort: { [orderBy]: order } },
            { $skip: skip },
            { $limit: pageSize },
            {
              $project: {
                _id: 0,
                EPin_ID: 1,
                used_by: 1,
                is_expired: 1,
                createdAt: 1,
                updatedAt: 1,
              },
            },
          ],
        },
      },
    ]);

    const result = epinsList[0] || {
      metadata: [
        {
          total: 0,
          used: 0,
          unused: 0,
          current_page: currentPage,
          per_page: pageSize,
        },
      ],
      data: [],
    };

    return response.successResponse(res, result, "EP-Keys List.");
  } catch (err) {
    console.error("Error fetching e-pins:", err);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

const getSponsorUserDetails = async (req, res) => {
  try {
    const sponsorEP = req.params.sponsor_id;

    const user = await User.findOne({ EP_ID: sponsorEP })
      .select("name EP_ID status")
      .lean();

    if (!user) {
      return response.errorResponse(
        res,
        [
          {
            path: "EP_ID",
            msg: "User does not exist with this EP_ID",
          },
        ],
        "User does not exist with this EP_ID",
        404
      );
    }

    // Check if the user is active (status !== 2)
    if (user.status === 2) {
      return response.errorResponse(
        res,
        [
          {
            path: "EP_ID",
            msg: "Cannot transfer to an inactive user.",
          },
        ],
        "Cannot transfer to an inactive user.",
        404
      );
    }

    const userID = req.user.id;

    const userEP = await User.findById(userID).select("name EP_ID").lean();

    if (user.EP_ID === userEP.EP_ID) {
      return response.errorResponse(
        res,
        [
          {
            path: "EP_ID",
            msg: "User does not send EP-Keys to self",
          },
        ],
        "User does not send EP-Keys to self",
        404
      );
    }

    const activeEPinCount = await EPin.countDocuments({
      EP_ID: userEP.EP_ID,
      is_expired: false,
    });

    if (activeEPinCount <= 0) {
      return response.errorResponse(
        res,
        [
          {
            path: "totalEPinCount",
            msg: "User does not have any epin to transfer",
          },
        ],
        "User does not have any epin to transfer",
        404
      );
    }

    const userObj = { ...user, epinCount: activeEPinCount };
    return response.successResponse(res, userObj, "Sopnsor User details");
  } catch (err) {
    console.error(err.message);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

const transferEPin = async (req, res) => {
  const MAX_RETRIES = 3;
  const userID = req.user.id;
  const { EP_ID, quantity, txn_password } = req.body;

  // Validate quantity input
  const epinQuantity = parseInt(quantity, 10);
  if (isNaN(epinQuantity) || epinQuantity <= 0 || epinQuantity > 5000) {
    return response.errorResponse(
      res,
      {},
      "Quantity must be between 1-5000",
      400
    );
  }

  const recipientID = EP_ID.toUpperCase();

  // Fetch sender and recipient in parallel
  const [sender, recipient] = await Promise.all([
    User.findById(userID).select("txn_password EP_ID status"),
    User.findOne({ EP_ID: recipientID }).select("EP_ID status"),
  ]);

  if (!sender || !recipient) {
    return response.errorResponse(
      res,
      {},
      "Sender or recipient not found",
      404
    );
  }

  if (sender.status === 2 || recipient.status === 2) {
    return response.errorResponse(
      res,
      {},
      "Cannot transfer to inactive user(s).",
      400
    );
  }

  // Password verification
  const isPasswordValid = await comparePasswords(
    txn_password,
    sender.txn_password
  );
  if (!isPasswordValid) {
    return response.errorResponse(
      res,
      [{ path: "txn_password", msg: "Incorrect transaction password" }],
      "Authentication failed",
      401
    );
  }

  // Transaction retry loop
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      // Fetch and lock sender EP-Keys
      const epins = await EPin.find(
        {
          EP_ID: sender.EP_ID,
          is_expired: false,
        },
        null,
        { limit: epinQuantity, session }
      ).select("_id");

      if (epins.length < epinQuantity) {
        await session.abortTransaction();
        return response.errorResponse(
          res,
          { msg: "Insufficient EPin balance to transfer." },
          "Insufficient EP-Keys.",
          400
        );
      }

      const epinIds = epins.map((epin) => epin._id);

      // Bulk transfer pins
      const bulkResult = await EPin.updateMany(
        { _id: { $in: epinIds } },
        {
          $set: {
            EP_ID: recipient.EP_ID,
            transferred_at: new Date(),
          },
        },
        { session }
      );

      if (bulkResult.modifiedCount !== epinQuantity) {
        throw new Error(
          `Partial update: ${bulkResult.modifiedCount}/${epinQuantity} updated`
        );
      }

      // Create report (you can move this outside if needed)
      await EPinTransferReport.create(
        [
          {
            transferredBy: sender.EP_ID,
            transferredTo: recipient.EP_ID,
            quantity: epinQuantity,
          },
        ],
        { session }
      );

      await session.commitTransaction();
      return response.successResponse(
        res,
        { count: epinQuantity },
        `${epinQuantity} EP-Keys transferred to ${recipient.EP_ID} successfully`
      );
    } catch (err) {
      if (session.inTransaction()) await session.abortTransaction();

      if (
        err.errorLabels?.includes("TransientTransactionError") &&
        attempt < MAX_RETRIES
      ) {
        await new Promise((resolve) =>
          setTimeout(resolve, 50 * Math.pow(2, attempt))
        );
        continue;
      }

      console.error(`Transfer failed after ${attempt} attempts:`, err);
      return res.status(500).json({
        message: "Failed to transfer E-PINs",
        error: err.message,
      });
    } finally {
      await session.endSession();
    }
  }
};

const getEPinTransferReport = async (req, res) => {
  const {
    limit = 10,
    page = 1,
    orderBy = "createdAt",
    ascending = "desc",
  } = req.query;

  const pageSize = clampListPageSize(limit, 10, 100);
  const pageNum = clampPositivePage(page, 1);
  const order = ascending === "desc" ? -1 : 1;
  const skip = pageSize * (pageNum - 1);

  try {
    const userId = req.user.id;

    const user = await User.findById(userId).lean();

    if (!user) {
      return response.errorResponse(
        res,
        { msg: "User not found." },
        "User not found.",
        400
      );
    }

    let filterData = {
      $or: [{ transferredBy: user.EP_ID }, { transferredTo: user.EP_ID }],
    };

    const epinTransferReportsList = await EPinTransferReport.aggregate([
      {
        $match: filterData,
      },
      {
        $facet: {
          metadata: [
            { $count: "totalRecord" },
            { $addFields: { current_page: pageNum, per_page: pageSize } },
          ],
          data: [
            { $sort: { [orderBy]: order } },
            { $skip: skip },
            { $limit: pageSize },

            // ---- Join transferredBy → User ----
            {
              $lookup: {
                from: "users",
                localField: "transferredBy",
                foreignField: "EP_ID",
                as: "byUser",
              },
            },
            { $unwind: { path: "$byUser", preserveNullAndEmptyArrays: true } },

            // ---- Join transferredTo → User ----
            {
              $lookup: {
                from: "users",
                localField: "transferredTo",
                foreignField: "EP_ID",
                as: "toUser",
              },
            },
            { $unwind: { path: "$toUser", preserveNullAndEmptyArrays: true } },

            // ---- Final formatted output ----
            {
              $project: {
                transferredBy: 1,
                transferredTo: 1,
                quantity: 1,
                status: 1,
                type: 1,
                createdAt: 1,

                transferredByName: "$byUser.name",
                transferredToName: "$toUser.name",
              },
            },
          ],
        },
      },
    ]);

    if (epinTransferReportsList[0].metadata.length > 0) {
      return response.successResponse(
        res,
        epinTransferReportsList,
        "EPin transfer report List."
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
        "No EPin transfer report found."
      );
    }
  } catch (err) {
    console.error("Error fetching e-pins transfer report:", err);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

module.exports = {
  getEPinsList,
  getSponsorUserDetails,
  transferEPin,
  getEPinTransferReport,
};
