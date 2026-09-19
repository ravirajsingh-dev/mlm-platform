const response = require("../../../config/response");

const Admin = require("../../../models/Admin");
const User = require("../../../models/User");
const SevaKendra = require("../../../models/SevaKendra");

const { comparePasswords } = require("../../../utils/helper");
const {
  clampListPageSize,
  clampPositivePage,
} = require("../../../utils/paginationLimits");

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

const createSevaKendra = async (req, res) => {
  try {
    const adminID = req.user.id;
    const { EP_ID, txn_password } = req.body;

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

    const existing = await SevaKendra.findOne({ EP_ID });
    if (existing) {
      return response.errorResponse(
        res,
        {},
        "Seva Kendra already exists for this EP ID.",
        400
      );
    }

    const sevaKendra = new SevaKendra({ EP_ID, is_active: true });
    await sevaKendra.save();

    return response.successResponse(
      res,
      { sevaKendra },
      "Seva Kendra created and activated successfully."
    );
  } catch (err) {
    console.error("Error creating Seva Kendra:", err);
    return res.status(500).json({ message: "Failed to create Seva Kendra." });
  }
};

const deleteSevaKendraByID = async (req, res) => {
  try {
    const adminID = req.user.id;
    const sevaKendraID = req.params.seva_kendra_id;

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

    const result = await SevaKendra.deleteOne({ _id: sevaKendraID });

    if (result.deletedCount === 0) {
      return response.errorResponse(
        res,
        { msg: "Seva Kendra not found or already deleted." },
        "Delete failed.",
        400
      );
    }

    return response.successResponse(
      res,
      { msg: "Seva Kendra deleted successfully." },
      "Delete successful."
    );
  } catch (err) {
    console.error("Error deleting Seva Kendra:", err);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

module.exports = {
  getSevaKendrasList,
  createSevaKendra,
  deleteSevaKendraByID,
};
