const mongoose = require("mongoose");
const response = require("../../../config/response");

const PaymentLink = require("../../../models/PaymentLink");
const User = require("../../../models/User");

const {
  checkPassiveEligibilityAndGenerateLink,
  updateUserUpline,
} = require("../../../utils/userAndLinkHelpers");
const {
  clampListPageSize,
  clampPositivePage,
} = require("../../../utils/paginationLimits");

const Admin = require("../../../models/Admin");

// Helper to find user and validate
const findUserById = async (userId, linkType) => {
  if (linkType === "Help") {
    const admin = await Admin.findById(userId).select("_id").lean();
    return admin;
  } else {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");
    return user;
  }
};

// Helper to find payment link and validate
const findPaymentLinkById = async (linkId) => {
  const paymentLink = await PaymentLink.findById(linkId);
  if (!paymentLink) throw new Error("Payment link not found");
  return paymentLink;
};

const updateSenderData = async (sender, paymentLink) => {
  try {
    const senderInfo = await findUserById(sender._id);
    if (!senderInfo.is_direct_paid && paymentLink.payment_type === "Direct") {
      senderInfo.is_direct_paid = true;
    } else if (
      !senderInfo.is_passive_paid &&
      paymentLink.payment_type === "Passive"
    ) {
      const paidPassiveLinks = await PaymentLink.countDocuments({
        sender: sender._id,
        payment_type: "Passive",
        sender_status: { $in: ["paid"] },
        receiver_status: { $in: ["confirmed"] },
        status: "completed",
      });

      if (paidPassiveLinks === 1) {
        senderInfo.is_passive_paid = true;
      }
    } else if (
      !senderInfo.is_help_paid &&
      paymentLink.payment_type === "Help"
    ) {
      senderInfo.is_help_paid = true;
    }

    await senderInfo.save();
    checkUserForActivation(senderInfo);
  } catch (error) {
    console.error("Error updating sender data:", error);
    throw new Error("Error updating sender data.");
  }
};

const updateSponsorUser = async (user) => {
  try {
    const sponsor = await User.findOne({
      EP_ID: user.sponsorEP,
    });

    if (!sponsor) {
      throw new Error("Sponsor not found.");
    }

    const userPosition = sponsor?.left_leg?.equals(user._id) ? "left" : "right";

    if (userPosition === "left" && !sponsor.i_added_to_left) {
      sponsor.i_added_to_left = true;
    } else if (userPosition === "right" && !sponsor.i_added_to_right) {
      sponsor.i_added_to_right = true;
    }

    sponsor.total_direct_users += 1;

    await sponsor.save();
  } catch (err) {
    console.error("Error checking user for activation:", err);
    throw new Error("Error checking user for activation.");
  }
};

const checkUserForActivation = async (user) => {
  try {
    if (
      user.status === 3 &&
      user.is_direct_paid &&
      user.is_passive_paid &&
      user.is_help_paid
    ) {
      const result = await user.updateOne({
        status: 1,
      });

      console.log("checkUserForActivation in it ");

      updateUserUpline(user);

      await updateSponsorUser(user);
      checkPassiveEligibilityAndGenerateLink(user);
    }

    // else if (
    //   user.status === 1 &&
    //   user.i_added_to_left &&
    //   user.i_added_to_left
    // ) {
    //   checkUserLinkAvailablity(user);
    // }
  } catch (err) {
    console.error("Error checking user for activation:", err);
    throw new Error("Error checking user for activation.");
  }
};

// Sender controller
const getSendPaymentLinksByUserID = async (req, res) => {
  const {
    limit = 20,
    page = 1,
    orderBy = "updatedAt",
    ascending = "desc",
    filters = [],
  } = req.query;

  const pageSize = clampListPageSize(limit, 20, 100);
  const pageNum = clampPositivePage(page, 1);
  const order = ascending === "desc" ? -1 : 1;
  const skip = pageSize * (pageNum - 1);

  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("_id").lean();

    if (!user) {
      return response.errorResponse(
        res,
        { msg: "User not found." },
        "User not found.",
        400
      );
    }

    let filterData = {
      sender: user._id,
    };

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

    // Handle receiver filter by EP_ID or phone
    const receiverValues = filtersArray
      .filter((f) => f.field === "receiver" && f.operator === "eq")
      .map((f) => f.value);

    if (receiverValues.length > 0) {
      const matchedUsers = await User.find({
        $or: [
          { EP_ID: { $in: receiverValues } },
          { phone: { $in: receiverValues } },
        ],
      })
        .select("_id")
        .lean();

      const receiverObjectIds = matchedUsers.map((u) => u._id);
      filterData.receiver = { $in: receiverObjectIds };
    }

    // Handle other filters
    filtersArray.forEach(({ field, operator, value }) => {
      if (!field || !operator || field === "receiver") return;

      const isNumericField = ["payment_for_level"].includes(field);
      const parsedValue =
        isNumericField && !isNaN(value) ? Number(value) : value;

      switch (operator) {
        case "eq":
          filterData[field] = parsedValue;
          break;
        case "ne":
          filterData[field] = { $ne: parsedValue };
          break;
        case "in":
          filterData[field] = {
            $in: Array.isArray(parsedValue) ? parsedValue : [parsedValue],
          };
          break;
        case "nin":
          filterData[field] = {
            $nin: Array.isArray(parsedValue) ? parsedValue : [parsedValue],
          };
          break;
        case "regex":
          filterData[field] = { $regex: parsedValue, $options: "i" };
          break;
      }
    });

    console.log("Final filter data:", filterData);

    const toBeSendList = await PaymentLink.aggregate([
      { $match: filterData },
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
            {
              $lookup: {
                from: "credentials",
                let: { receiverId: "$receiver" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$user", "$$receiverId"] },
                      primary: true,
                    },
                  },
                ],
                as: "receiverPaymentDetails",
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "receiver",
                foreignField: "_id",
                as: "usersDetails",
              },
            },
            {
              $unwind: {
                path: "$usersDetails",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                receiverInfo: {
                  name: "$usersDetails.name",
                  phone: "$usersDetails.phone",
                  EP_ID: "$usersDetails.EP_ID",
                  primaryCredential: {
                    $arrayElemAt: ["$receiverPaymentDetails", 0],
                  },
                },
                amount: 1,
                payment_type: 1,
                sender_status: 1,
                receiver_status: 1,
                createdAt: 1,
                updatedAt: 1,
              },
            },
          ],
        },
      },
    ]);

    if (toBeSendList[0].metadata.length > 0) {
      return response.successResponse(res, toBeSendList, "To be sent list.");
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
        "No payment links found."
      );
    }
  } catch (err) {
    console.error("Error fetching payment links:", err);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

const getReceivePaymentLinksByUserID = async (req, res) => {
  const {
    limit = 20,
    page = 1,
    orderBy = "updatedAt",
    ascending = "desc",
    filters = [],
  } = req.query;

  console.log("req.query------------", req.query);

  const pageSize = clampListPageSize(limit, 20, 100);
  const pageNum = clampPositivePage(page, 1);
  const order = ascending === "desc" ? -1 : 1;
  const skip = pageSize * (pageNum - 1);

  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("_id").lean();

    if (!user) {
      return response.errorResponse(
        res,
        { msg: "User not found." },
        "User not found.",
        400
      );
    }

    // Base filter
    const filterData = {
      receiver: user._id,
    };

    // Convert filters to array if needed (for some Express setups)
    let filtersArray = filters;

    // Handle if filters is passed as a string (common in URL encoded GET requests)
    if (typeof filters === "string") {
      try {
        filtersArray = JSON.parse(filters);
      } catch (e) {
        console.error("Invalid filters format:", e);
        filtersArray = [];
      }
    }

    // Apply each filter to the MongoDB query object
    // filtersArray.forEach(({ field, operator, value }) => {
    //   if (!field || !operator) return;

    //   // Try casting numeric strings to actual numbers if needed
    //   const isNumericField = ["payment_for_level", "amount", "level"].includes(
    //     field
    //   );
    //   const parsedValue =
    //     isNumericField && !isNaN(value) ? Number(value) : value;

    //   switch (operator) {
    //     case "eq":
    //       filterData[field] = parsedValue;
    //       break;
    //     case "ne":
    //       filterData[field] = { $ne: parsedValue };
    //       break;
    //     case "in":
    //       filterData[field] = {
    //         $in: Array.isArray(parsedValue) ? parsedValue : [parsedValue],
    //       };
    //       break;
    //     case "nin":
    //       filterData[field] = {
    //         $nin: Array.isArray(parsedValue) ? parsedValue : [parsedValue],
    //       };
    //       break;
    //     case "regex":
    //       filterData[field] = { $regex: parsedValue, $options: "i" };
    //       break;
    //   }
    // });

    // Pre-handle 'sender' filters to match by EP_ID or phone
    const senderValues = filtersArray
      .filter((f) => f.field === "sender" && f.operator === "eq")
      .map((f) => f.value);

    if (senderValues.length > 0) {
      const matchedUsers = await User.find({
        $or: [
          { EP_ID: { $in: senderValues } },
          { phone: { $in: senderValues } },
        ],
      })
        .select("_id")
        .lean();

      const senderObjectIds = matchedUsers.map((u) => u._id);
      filterData.sender = { $in: senderObjectIds };
    }

    // Handle all other filters
    filtersArray.forEach(({ field, operator, value }) => {
      if (!field || !operator || field === "sender") return;

      // You can add more field type logic here
      const parsedValue = isNaN(value) ? value : Number(value);

      switch (operator) {
        case "eq":
          filterData[field] = parsedValue;
          break;
        case "ne":
          filterData[field] = { $ne: parsedValue };
          break;
        case "in":
          filterData[field] = {
            $in: Array.isArray(parsedValue) ? parsedValue : [parsedValue],
          };
          break;
        case "nin":
          filterData[field] = {
            $nin: Array.isArray(parsedValue) ? parsedValue : [parsedValue],
          };
          break;
        case "regex":
          filterData[field] = { $regex: parsedValue, $options: "i" };
          break;
      }
    });

    console.log("filterData------------", filterData);

    const toBeSendList = await PaymentLink.aggregate([
      { $match: filterData },
      {
        $facet: {
          metadata: [
            { $count: "totalRecord" },
            {
              $addFields: { current_page: pageNum, per_page: pageSize },
            },
          ],
          data: [
            { $sort: { [orderBy]: order } },
            { $skip: skip },
            { $limit: pageSize },
            {
              $lookup: {
                from: "credentials",
                localField: "sender",
                foreignField: "user",
                as: "senderPaymentDetails",
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "sender",
                foreignField: "_id",
                as: "usersDetails",
              },
            },
            { $unwind: { path: "$usersDetails", preserveNullAndEmptyArrays: true } },
            {
              $unwind: {
                path: "$senderPaymentDetails",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                senderInfo: {
                  _id: "$senderPaymentDetails._id",
                  name: "$usersDetails.name",
                  phone: "$usersDetails.phone",
                  upi: "$senderPaymentDetails.upi",
                  EP_ID: "$usersDetails.EP_ID",
                },
                amount: 1,
                payment_type: 1,
                sender_status: 1,
                receiver_status: 1,
                status: 1,
                createdAt: 1,
                updatedAt: 1,
              },
            },
          ],
        },
      },
    ]);

    if (toBeSendList[0].metadata.length > 0) {
      return response.successResponse(res, toBeSendList, "To be sent list.");
    } else {
      return response.successResponse(
        res,
        [
          {
            metadata: [
              {
                totalRecord: 0,
                current_page: pageNum,
                per_page: pageSize,
              },
            ],
            data: [],
          },
        ],
        "No UPI."
      );
    }
  } catch (err) {
    console.error("Error fetching to be sent payment links:", err);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

module.exports = {
  getSendPaymentLinksByUserID,
  getReceivePaymentLinksByUserID,
};
