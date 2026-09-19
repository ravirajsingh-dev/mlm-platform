const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const response = require("../../../config/response");

const Admin = require("../../../models/Admin");
const User = require("../../../models/User");
const EPin = require("../../../models/EPin");
const EPinTransferReport = require("../../../models/EPinTransferReport");

const {
  generateUniqueEPinID,
  comparePasswords,
} = require("../../../utils/helper");
const {
  clampListPageSize,
  clampPositivePage,
} = require("../../../utils/paginationLimits");

const getEPinsList = async (req, res) => {
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

    let filterData = {};

    const epinsList = await EPin.aggregate([
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

    if (epinsList[0].metadata.length > 0) {
      return response.successResponse(res, epinsList, "EP-Keys List.");
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
        "No EPin Found."
      );
    }
  } catch (err) {
    console.error("Error fetching e-pins:", err);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

const createEPinForEPUser = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const adminID = req.user.id;
    const { EP_ID, quantity, txn_password, txn_type } = req.body;

    console.log("txn_type", txn_type);

    // Validate transaction type
    if (!["CR", "DR"].includes(txn_type)) {
      return response.errorResponse(
        res,
        [{ path: "txn_type", msg: "Invalid transaction type" }],
        "Validation failed",
        400
      );
    }

    // Parallelize initial fetches
    const [admin, user] = await Promise.all([
      Admin.findById(adminID).select("txn_password").lean(),
      User.findOne({ EP_ID }).select("_id").lean(),
    ]);

    if (!admin) return response.errorResponse(res, {}, "Admin not found", 404);
    if (!user) return response.errorResponse(res, {}, "User not found", 404);

    // Validate transaction password
    const validPassword = await comparePasswords(
      txn_password,
      admin.txn_password
    );
    if (!validPassword) {
      return response.errorResponse(
        res,
        [{ path: "txn_password", msg: "Incorrect Transaction password" }],
        "Authentication failed",
        401
      );
    }

    // Validate quantity
    const epinQuantity = parseInt(quantity, 10);
    const MAX_QUANTITY = 5000;
    if (
      isNaN(epinQuantity) ||
      epinQuantity <= 0 ||
      epinQuantity > MAX_QUANTITY
    ) {
      return response.errorResponse(
        res,
        {},
        `Quantity must be 1-${MAX_QUANTITY}`,
        400
      );
    }

    // Handle CREDIT operation (create new ePins)
    if (txn_type === "CR") {
      // Bulk generate EPins
      const epinDocs = Array.from({ length: epinQuantity }, () => ({
        EP_ID,
        EPin_ID: generateUniqueEPinID(13),
        is_expired: false,
      }));

      // Bulk insert EPins
      const insertedEPins = await EPin.insertMany(epinDocs, { session });

      // Create transfer report
      await EPinTransferReport.create(
        [
          {
            transferredBy: "Admin",
            transferredTo: EP_ID,
            quantity: epinQuantity,
            type: "CREDIT",
          },
        ],
        { session }
      );

      await session.commitTransaction();

      // Extract only EPin IDs for response
      const epins = insertedEPins.map((doc) => doc.EPin_ID);

      return response.successResponse(
        res,
        { epins },
        `${epinQuantity} EP-Keys created for ${EP_ID} successfully`
      );
    }
    // Handle DEBIT operation (delete ePins)
    else if (txn_type === "DR") {
      // Find active ePins for the user (oldest first)
      const activeEPins = await EPin.find({
        EP_ID,
        is_expired: false,
      })
        .sort({ createdAt: 1 }) // Oldest first
        .limit(epinQuantity)
        .session(session);

      // Check if sufficient ePins exist
      if (activeEPins.length < epinQuantity) {
        return response.errorResponse(
          res,
          {},
          `User only has ${activeEPins.length} active ePins (${epinQuantity} requested)`,
          400
        );
      }

      // Get IDs of ePins to delete
      const epinIdsToDelete = activeEPins.map((epin) => epin._id);

      // Directly delete the ePins
      const deleteResult = await EPin.deleteMany(
        { _id: { $in: epinIdsToDelete } },
        { session }
      );

      // Verify deletion
      if (deleteResult.deletedCount !== epinQuantity) {
        throw new Error(
          `Deleted ${deleteResult.deletedCount} ePins but expected ${epinQuantity}`
        );
      }

      // Create transfer report with details of deleted ePins
      await EPinTransferReport.create(
        [
          {
            transferredBy: "Admin",
            transferredTo: EP_ID,
            quantity: epinQuantity,
            type: "DEBIT",
            epins: activeEPins.map((epin) => epin.EPin_ID), // Track which ePins were deleted
          },
        ],
        { session }
      );

      await session.commitTransaction();

      return response.successResponse(
        res,
        { epins: activeEPins.map((epin) => epin.EPin_ID) },
        `${epinQuantity} EP-Keys deleted from ${EP_ID} successfully`
      );
    }
  } catch (err) {
    await session.abortTransaction();
    console.error("Transaction error:", err);
    return res.status(500).json({
      message: "Failed to process E-PIN operation",
      error: err.message,
    });
  } finally {
    session.endSession();
  }
};

const getEPinTransferReport = async (req, res) => {
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
    const userId = req.user.id;

    const user = await Admin.findById(userId).lean();

    if (!user) {
      return response.errorResponse(
        res,
        { msg: "Admin not found." },
        "Admin not found.",
        400
      );
    }

    let filterData = {};

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
  createEPinForEPUser,
  getEPinTransferReport,
};
