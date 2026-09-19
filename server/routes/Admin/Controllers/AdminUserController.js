var response = require("../../../config/response");
const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const ExcelJS = require("exceljs");

const User = require("../../../models/User");
const Admin = require("../../../models/Admin");
const Session = require("../../../models/Session");
const { comparePasswords } = require("../../../utils/helper");
const Level = require("../../../models/Level");
const {
  createPaymentLinkAsLevel,
} = require("../../../utils/userAndLinkHelpers");
const { processSearchFilters } = require("../../../utils/searchHelper");
const moment = require("moment");

const getUsersList = async (req, res) => {
  try {
    const {
      limit = 10,
      page = 1,
      orderBy = "createdAt",
      ascending = "desc",
    } = req.query || req.body;

    let filters = [];
    let query = {};

    if (req.query.limit) {
      if (typeof req.query.filters === "string") {
        filters = req.query.filters.split(",");
      } else if (Array.isArray(req.query.filters)) {
        filters = req.query.filters;
      }

      // Handle query as JSON string or object
      if (typeof req.query.query === "string") {
        try {
          query = JSON.parse(req.query.query);
        } catch (e) {
          query = {};
        }
      } else if (typeof req.query.query === "object") {
        query = req.query.query;
      } else {
        query = {};
      }
    } else {
      if (typeof req.body.filters === "string") {
        filters = req.body.filters.split(",");
      } else if (Array.isArray(req.body.filters)) {
        filters = req.body.filters;
      }

      query = typeof req.body.query === "object" ? req.body.query : {};
    }

    const rawLimit = parseInt(limit, 10);
    const pageSize = Math.min(
      Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : 10,
      50
    );
    const skip = pageSize * (page - 1);
    const sortOrder = ascending === "desc" ? -1 : 1;

    const matchQuery = processSearchFilters(filters, query);

    const usersList = await User.aggregate([
      { $match: matchQuery },
      {
        $facet: {
          metadata: [
            { $count: "totalRecord" },
            {
              $addFields: {
                current_page: parseInt(page, 10),
                per_page: pageSize,
              },
            },
          ],
          data: [
            { $sort: { [orderBy]: sortOrder } },
            { $skip: skip },
            { $limit: pageSize },
            {
              $lookup: {
                from: "users",
                localField: "sponsorEP",
                foreignField: "EP_ID",
                as: "sponsorInfo",
              },
            },
            {
              $unwind: {
                path: "$sponsorInfo",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "uplineEP",
                foreignField: "EP_ID",
                as: "uplineInfo",
              },
            },
            {
              $unwind: {
                path: "$uplineInfo",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                name: 1,
                phone: 1,
                EP_ID: 1,
                sponsorEP: 1,
                uplineEP: 1,
                sponsorName: "$sponsorInfo.name",
                uplineName: "$uplineInfo.name",
                city: 1,
                state: 1,
                position: 1,
                status: 1,
                createdAt: 1,
                updatedAt: 1,
              },
            },
          ],
        },
      },
    ]).collation({ locale: "en", strength: 1 });

    const [result] = usersList;

    if (result?.metadata?.length > 0) {
      return response.successResponse(res, usersList, "Users List");
    } else {
      return response.successResponse(
        res,
        [
          {
            metadata: [
              { totalRecord: 0, current_page: page, per_page: pageSize },
            ],
            data: [],
          },
        ],
        "No Users"
      );
    }
  } catch (err) {
    console.error("Error fetching users:", err);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById({ _id: req.params.user_id })
      .select(
        "name email phone passCopy txnPassCopy status EP_ID state city country"
      )
      .lean();
    if (!user) {
      return response.errorResponse(
        res,
        { msg: "User not found." },
        "User not found.",
        400
      );
    }

    return response.successResponse(res, user, "User data.");
  } catch (err) {
    console.error(err.message);
    if (err.kind == "ObjectId") {
      return response.errorResponse(
        res,
        { msg: "User not found." },
        "User not found.",
        400
      );
    }
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

const updateUserById = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return response.errorResponse(res, errors.array());
  }

  try {
    const {
      name,
      phone,
      passCopy,
      txnPassCopy,
      status,
      newPassword,
      newTxnPassword,
      state,
      city,
    } = req.body;

    const userID = req.params.user_id;

    const user = await User.findById(userID);
    if (!user) {
      return response.errorResponse(
        res,
        { msg: "User not found." },
        "User not found.",
        400
      );
    }

    const userFields = {};
    let passwordChanged = false;

    if (name) userFields.name = name;
    if (phone) userFields.phone = phone;
    if (status !== undefined) userFields.status = status;
    if (state !== undefined) userFields.state = state;
    if (city !== undefined) userFields.city = city;

    // Update login password if provided
    if (newPassword) {
      const salt = await bcrypt.genSalt(10);
      const newPasswordHash = await bcrypt.hash(newPassword, salt);
      userFields.password = newPasswordHash;
      userFields.passCopy = newPassword;
      userFields.passwordChangedAt = new Date(); // Track password change timestamp
      passwordChanged = true;
    }

    // Update transaction password if provided
    if (newTxnPassword) {
      const salt = await bcrypt.genSalt(10);
      const newTxnPasswordHash = await bcrypt.hash(newTxnPassword, salt);
      userFields.txn_password = newTxnPasswordHash;
      userFields.txnPassCopy = newTxnPassword;
      passwordChanged = true;
    }

    console.log("userFields", userFields);

    const updatedUser = await User.findByIdAndUpdate(
      { _id: userID },
      { $set: userFields },
      { returnDocument: "after" }
    ).lean();

    // Invalidate all sessions if password or txn password was changed
    if (passwordChanged) {
      await Session.deleteMany({ userID: userID });
    }

    return response.successResponse(res, updatedUser, "User Updated.");
  } catch (err) {
    return response.errorResponse(res, {}, "Server Error.", 500);
  }
};

const deleteUserById = async (req, res) => {
  try {
    const user = await User.findByIdAndRemove({
      _id: req.params.user_id,
    }).select("_id");

    return response.successResponse(res, user, "User deleted.");
  } catch (err) {
    // console.error(err.message);
    return response.errorResponse(res, {}, "Server Error.", 500);
  }
};

/**
 * Reactivate inactive user (status 2) from deactiveUnpaidAndPaymentLinks.
 * Sets status to 3 (New) and recreates all payment links (Direct, Help, Passive)
 * as per Level model for user_level 0.
 */
const reactivateUserById = async (req, res) => {
  try {
    const { txn_password } = req.body;
    if (!txn_password) {
      return response.errorResponse(
        res,
        [{ path: "txn_password", msg: "Transaction password is required." }],
        "Transaction password is required.",
        400
      );
    }

    const admin = await Admin.findById(req.user.id).select("txn_password").lean();
    if (!admin?.txn_password) {
      return response.errorResponse(
        res,
        [{ path: "txn_password", msg: "Transaction password not set. Please set your transaction password first." }],
        "Transaction password not set.",
        400
      );
    }

    const validPassword = await comparePasswords(txn_password, admin.txn_password);
    if (!validPassword) {
      return response.errorResponse(
        res,
        [{ path: "txn_password", msg: "Incorrect transaction password. Please double-check and try again." }],
        "Incorrect transaction password.",
        400
      );
    }

    const userId = req.params.user_id;
    const user = await User.findById(userId);

    if (!user) {
      return response.errorResponse(
        res,
        { msg: "User not found." },
        "User not found.",
        400
      );
    }

    if (user.status !== 2) {
      return response.errorResponse(
        res,
        { msg: "User is not inactive. Only status 2 users can be reactivated." },
        "Invalid status.",
        400
      );
    }

    const sponsor = await User.findOne({ EP_ID: user.sponsorEP });
    if (!sponsor) {
      return response.errorResponse(
        res,
        { msg: "Sponsor not found. Cannot recreate payment links." },
        "Sponsor not found.",
        400
      );
    }

    const levelZero = await Level.findOne({ level: 0 }).select("bits_for_upgrade");
    if (!levelZero?.bits_for_upgrade?.length) {
      return response.errorResponse(
        res,
        { msg: "Level 0 configuration missing or has no payment links. Cannot reactivate." },
        "Level 0 not configured.",
        500
      );
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await createPaymentLinkAsLevel(sponsor, user, session);
      await User.updateOne(
        { _id: userId },
        { $set: { status: 3, reactivatedAt: new Date() } },
        { session }
      );
      await session.commitTransaction();
    } catch (txErr) {
      await session.abortTransaction();
      throw txErr;
    } finally {
      session.endSession();
    }

    return response.successResponse(
      res,
      { EP_ID: user.EP_ID, status: 3 },
      "User reactivated successfully. Payment links (Direct, Help, Passive) have been recreated."
    );
  } catch (err) {
    console.error("Reactivate user error:", err);
    return response.errorResponse(
      res,
      { msg: err.message || "Reactivation failed." },
      err.message || "Server Error.",
      500
    );
  }
};

const exportUsersList = async (req, res) => {
  try {
    const {
      limit = 10000,
      page = 1,
      orderBy = "createdAt",
      ascending = "desc",
    } = req.query || req.body;

    let filters = [];
    let query = {};

    if (req.query.limit) {
      if (typeof req.query.filters === "string") {
        filters = req.query.filters.split(",");
      } else if (Array.isArray(req.query.filters)) {
        filters = req.query.filters;
      }

      // Handle query as JSON string or object
      if (typeof req.query.query === "string") {
        try {
          query = JSON.parse(req.query.query);
        } catch (e) {
          query = {};
        }
      } else if (typeof req.query.query === "object") {
        query = req.query.query;
      } else {
        query = {};
      }
    } else {
      if (typeof req.body.filters === "string") {
        filters = req.body.filters.split(",");
      } else if (Array.isArray(req.body.filters)) {
        filters = req.body.filters;
      }

      query = typeof req.body.query === "object" ? req.body.query : {};
    }

    const rawExportLimit = parseInt(limit, 10);
    const pageSize = Number.isFinite(rawExportLimit) && rawExportLimit > 0
      ? Math.min(rawExportLimit, 10000)
      : 10000;
    const sortOrder = ascending === "desc" ? -1 : 1;

    const matchQuery = processSearchFilters(filters, query);

    const usersList = await User.aggregate([
      { $match: matchQuery },
      { $sort: { [orderBy]: sortOrder } },
      { $limit: pageSize },
      {
        $lookup: {
          from: "users",
          localField: "sponsorEP",
          foreignField: "EP_ID",
          as: "sponsorInfo",
        },
      },
      { $unwind: { path: "$sponsorInfo", preserveNullAndEmptyArrays: true } },
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
        $project: {
          name: 1,
          phone: 1,
          EP_ID: 1,
          sponsorEP: 1,
          uplineEP: 1,
          sponsorName: "$sponsorInfo.name",
          uplineName: "$uplineInfo.name",
          city: 1,
          state: 1,
          position: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]).collation({ locale: "en", strength: 1 });

    // Map status numbers to labels
    const statusMap = {
      1: "Active",
      2: "Inactive",
      3: "New",
      4: "Temporary Blocked",
    };

    // Prepare data for Excel
    const excelData = usersList.map((user) => ({
      "EP ID": user.EP_ID || "",
      Name: user.name || "",
      Phone: user.phone || "",
      "Sponsor EP": user.sponsorEP
        ? `${user.sponsorName || ""} (${user.sponsorEP})`
        : "",
      "Upline EP": user.uplineEP
        ? `${user.uplineName || ""} (${user.uplineEP})`
        : "",
      "City & State": `${user.city || ""}${user.city && user.state ? ", " : ""}${user.state || ""}`,
      Position: user.position || "",
      Status: statusMap[user.status] || "Unknown",
      "Created At": user.createdAt
        ? moment(user.createdAt).format("DD/MM/YYYY HH:mm:ss")
        : "",
      "Updated At": user.updatedAt
        ? moment(user.updatedAt).format("DD/MM/YYYY HH:mm:ss")
        : "",
    }));

    // Create workbook and worksheet using ExcelJS
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Users");

    // Set column headers
    worksheet.columns = [
      { header: "EP ID", key: "EP ID", width: 15 },
      { header: "Name", key: "Name", width: 25 },
      { header: "Phone", key: "Phone", width: 15 },
      { header: "Sponsor EP", key: "Sponsor EP", width: 30 },
      { header: "Upline EP", key: "Upline EP", width: 30 },
      { header: "City & State", key: "City & State", width: 25 },
      { header: "Position", key: "Position", width: 10 },
      { header: "Status", key: "Status", width: 20 },
      { header: "Created At", key: "Created At", width: 20 },
      { header: "Updated At", key: "Updated At", width: 20 },
    ];

    // Add data rows
    worksheet.addRows(excelData);

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=users_list_${moment().format("YYYY-MM-DD_HH-mm-ss")}.xlsx`
    );

    return res.send(buffer);
  } catch (err) {
    console.error("Error exporting users:", err);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

module.exports = {
  getUsersList,
  getUserById,
  updateUserById,
  deleteUserById,
  exportUsersList,
  reactivateUserById,
};
