const { validationResult } = require("express-validator");
const response = require("../../../config/response");
const {
  clampListPageSize,
  clampPositivePage,
} = require("../../../utils/paginationLimits");

const PaymentLink = require("../../../models/PaymentLink");
const User = require("../../../models/User");
const Admin = require("../../../models/Admin");
const Wallet = require("../../../models/Wallet");

const getAllSenderUsersPaidList = async (req, res) => {
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
    let filterData = { sender_status: "paid" };

    const acceptList = await PaymentLink.aggregate([
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
                from: "users",
                localField: "sender",
                foreignField: "_id",
                as: "senderDetails",
              },
            },
            {
              $unwind: {
                path: "$senderDetails",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                sender: {
                  _id: "$senderDetails._id",
                  name: "$senderDetails.name",
                  phone: "$senderDetails.phone",
                  EP_ID: "$senderDetails.EP_ID",
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

    if (acceptList[0].metadata.length > 0) {
      return response.successResponse(res, acceptList, "To be received list.");
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
        "No UPI."
      );
    }
  } catch (err) {
    console.error("Error fetching to be received payment links:", err);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

const editHelpLinksByPaymentID = async (req, res) => {
  const { help_link_id } = req.params;

  try {
    const adminID = req.user.id;

    const admin = await Admin.findById(adminID);
    if (!admin) {
      return res.status(400).json({ message: "Admin not found." });
    }

    const payment_link = await PaymentLink.findById(help_link_id);
    if (!payment_link) {
      return res.status(404).json({ message: "Payment link not found." });
    }

    // Fetch sender and receiver users
    const receiver = await User.findById(payment_link.receiver).select(
      "_id is_direct_paid is_passive_paid"
    );
    const sender = await User.findById(payment_link.sender).select(
      "_id is_direct_paid is_passive_paid"
    );

    if (!receiver || !sender) {
      return res.status(400).json({ message: "Sender or receiver not found." });
    }

    // Fetch wallets for both sender and receiver
    const senderWallet = await Wallet.findOne({ userID: sender._id });
    const receiverWallet = await Wallet.findOne({ userID: receiver._id });

    if (!senderWallet || !receiverWallet) {
      return res
        .status(400)
        .json({ message: "Sender or receiver wallet not found." });
    }

    // Ensure that the payment was made by the sender
    if (payment_link.sender_status !== "paid") {
      return res.status(400).json({
        message: "Cannot update receiver status until the sender has paid.",
      });
    }

    let transactionAmount;
    let description;

    // Update the payment status
    if (payment_link.receiver_status === "pending") {
      payment_link.sender_status = "approved";
      payment_link.receiver_status = "confirmed";

      // Handle Direct Payment
      if (payment_link.payment_type === "Direct") {
        transactionAmount = 800;
        description = "Direct payment";
        sender.is_direct_paid = true;

        // Update wallet balances
        await receiverWallet.addTransaction(
          "credit",
          800,
          `Received direct payment from ${sender.EP_ID}`
        );
        await senderWallet.addTransaction(
          "debit",
          800,
          `Sent direct payment to ${receiver.EP_ID}`
        );

        // Handle Passive Payment
      } else if (payment_link.payment_type === "Passive") {
        transactionAmount = 500;
        description = "Passive payment";
        sender.is_passive_paid = true;

        // Update wallet balances
        await receiverWallet.addTransaction(
          "credit",
          500,
          `Received passive payment from ${sender.EP_ID}`
        );
        await senderWallet.addTransaction(
          "debit",
          500,
          `Sent passive payment to ${receiver.EP_ID}`
        );
      }

      // Save the updated sender and payment_link
      await sender.save();
      await payment_link.save();
    } else {
      return res.status(400).json({
        message: "Receiver status already updated. Cannot change status again.",
      });
    }

    // Return success response
    return res.status(200).json({
      message: "Payment status updated successfully",
      data: payment_link,
    });
  } catch (err) {
    console.error("Error updating payment status:", err);
    return res
      .status(500)
      .json({ message: "Failed to update payment status." });
  }
};

const getAllReceivePaymentLinks = async (req, res) => {
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
    let filterData = {
      sender_status: "paid",
      receiver_status: "pending",
      status: "pending",
    };

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
            {
              $lookup: {
                from: "users",
                localField: "receiver",
                foreignField: "_id",
                as: "receiverDetails",
              },
            },
            {
              $unwind: {
                path: "$usersDetails",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $unwind: {
                path: "$receiverDetails",
                preserveNullAndEmptyArrays: true,
              },
            },
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
                receiverInfo: {
                  name: "$receiverDetails.name",
                  phone: "$receiverDetails.phone",
                  EP_ID: "$receiverDetails.EP_ID",
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
              { totalRecord: 0, current_page: pageNum, per_page: pageSize },
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

const getDownlinePendingLinks = async (req, res) => {
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

    const admin = await Admin.findById(adminID);
    if (!admin) {
      return res.status(400).json({ message: "Admin not found." });
    }

    // Fetch downline pending links
    const filterData = {
      sender: { $ne: null },
      sender_status: "pending",
    };

    const downlinePendingLinks = await PaymentLink.aggregate([
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
            {
              $unwind: {
                path: "$usersDetails",
                preserveNullAndEmptyArrays: true,
              },
            },
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

    if (downlinePendingLinks[0].metadata.length > 0) {
      return response.successResponse(
        res,
        downlinePendingLinks,
        "Downline pending payment links list."
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
        "No pending link found."
      );
    }
  } catch (err) {
    console.error("Error fetching downline pending links:", err);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

module.exports = {
  getAllSenderUsersPaidList,
  editHelpLinksByPaymentID,
  getAllReceivePaymentLinks,
  getDownlinePendingLinks,
};
