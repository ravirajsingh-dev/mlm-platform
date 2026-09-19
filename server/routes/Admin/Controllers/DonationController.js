const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const DonationButton = require("../../../models/DonationButton");
const DonationRequest = require("../../../models/DonationRequest");
const CommonSettings = require("../../../models/CommonSettings");
const response = require("../../../config/response");
const { generateQRCodeWithAmount } = require("../../../utils/qrCodeUtils");
const emailService = require("../../../services/email");

/**
 * @route GET /api/common/donation/buttons
 * @desc Get active donation buttons
 * @access Public
 */
const getActiveDonationButtons = async (req, res) => {
  try {
    const buttons = await DonationButton.find({ isActive: true })
      .sort({ amount: 1 })
      .lean();

    return response.successResponse(
      res,
      buttons,
      "Donation buttons retrieved successfully"
    );
  } catch (err) {
    console.error("Error fetching donation buttons:", err);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

/**
 * @route GET /api/common/donation/settings
 * @desc Get donation section visibility settings
 * @access Public
 */
const getDonationSettings = async (req, res) => {
  try {
    const settings = await CommonSettings.getOrCreateSettings();

    const donationSettings = {
      donationEnabled: settings.donationEnabled || false,
      donationMessage: settings.donationMessage || "",
      upi: {
        upiId: settings.upi?.upiId || "",
        upiHolderName: settings.upi?.upiHolderName || "",
      },
      bank: {
        bankName: settings.bank?.bankName || "",
        accountNo: settings.bank?.accountNo || "",
        accountHolderName: settings.bank?.accountHolderName || "",
        ifscCode: settings.bank?.ifscCode || "",
      },
    };

    return response.successResponse(
      res,
      donationSettings,
      "Donation settings retrieved successfully"
    );
  } catch (err) {
    console.error("Error fetching donation settings:", err);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

/**
 * @route POST /api/common/donation/generate-qr
 * @desc Generate QR code for donation amount
 * @access Public
 */
const generateDonationQRCode = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return response.errorResponse(
        res,
        errors.array(),
        "Validation Error",
        400
      );
    }

    const { amount } = req.body;

    const settings = await CommonSettings.getOrCreateSettings();

    if (!settings.upi?.upiId || !settings.upi?.upiHolderName) {
      return response.errorResponse(
        res,
        { msg: "UPI details not configured" },
        "UPI details not configured",
        400
      );
    }

    const qrData = await generateQRCodeWithAmount(
      settings.upi.upiId,
      settings.upi.upiHolderName,
      amount
    );

    return response.successResponse(
      res,
      {
        qrCodeData: qrData.qrCodeData,
        amount: qrData.amount,
      },
      "QR code generated successfully"
    );
  } catch (err) {
    console.error("Error generating QR code:", err);
    return response.errorResponse(
      res,
      { msg: err.message || "Error generating QR code" },
      "Error generating QR code",
      500
    );
  }
};

/**
 * @route POST /api/common/donation/request
 * @desc Submit donation request
 * @access Public
 */
const submitDonationRequest = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return response.errorResponse(
        res,
        errors.array(),
        "Validation Error",
        400
      );
    }

    const { donorName, phone, email, address, amount, utrNumber, paymentMode } =
      req.body;

    // Check if UTR number already exists
    const existingRequest = await DonationRequest.findOne({ utrNumber });
    if (existingRequest) {
      return response.errorResponse(
        res,
        [{ path: "utrNumber", msg: "UTR number already exists" }],
        "UTR number already exists",
        400
      );
    }

    const donationRequest = new DonationRequest({
      donorName,
      phone,
      email,
      address: address || "",
      amount,
      utrNumber,
      paymentMode,
      status: "pending",
    });

    await donationRequest.save();

    return response.successResponse(
      res,
      { id: donationRequest._id },
      "Your donation request has been submitted for admin approval",
      201
    );
  } catch (err) {
    console.error("Error submitting donation request:", err);
    if (err.code === 11000) {
      // Duplicate key error (UTR number)
      return response.errorResponse(
        res,
        [{ path: "utrNumber", msg: "UTR number already exists" }],
        "UTR number already exists",
        400
      );
    }
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

/**
 * @route GET /api/admin/donation/buttons
 * @desc Get all donation buttons (admin)
 * @access Private (Admin)
 */
const getAllDonationButtons = async (req, res) => {
  try {
    const buttons = await DonationButton.find().sort({ amount: 1 }).lean();

    return response.successResponse(
      res,
      buttons,
      "Donation buttons retrieved successfully"
    );
  } catch (err) {
    console.error("Error fetching donation buttons:", err);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

/**
 * @route POST /api/admin/donation/buttons
 * @desc Create donation button (admin)
 * @access Private (Admin)
 */
const createDonationButton = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return response.errorResponse(
        res,
        errors.array(),
        "Validation Error",
        400
      );
    }

    const { amount, peopleFed, type, buttonText, isActive } = req.body;
    const buttonType = type || "FIXED";

    // If type is ANY, check if one already exists
    if (buttonType === "ANY") {
      const existingAnyButton = await DonationButton.findOne({ type: "ANY" });
      if (existingAnyButton) {
        return response.errorResponse(
          res,
          [
            {
              path: "type",
              msg: "Only one 'ANY' type donation button is allowed",
            },
          ],
          "Only one 'ANY' type donation button is allowed",
          400
        );
      }
    }

    const donationButton = new DonationButton({
      amount: buttonType === "ANY" ? 0 : amount,
      peopleFed: buttonType === "ANY" ? 0 : peopleFed,
      type: buttonType,
      buttonText:
        buttonType === "ANY" ? buttonText || "Donate Any Other Amount" : null,
      isActive: isActive !== undefined ? isActive : true,
    });

    await donationButton.save();

    return response.successResponse(
      res,
      donationButton,
      "Donation button created successfully",
      201
    );
  } catch (err) {
    console.error("Error creating donation button:", err);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

/**
 * @route PUT /api/admin/donation/buttons/:id
 * @desc Update donation button (admin)
 * @access Private (Admin)
 */
const updateDonationButton = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return response.errorResponse(
        res,
        errors.array(),
        "Validation Error",
        400
      );
    }

    const { id } = req.params;
    const { amount, peopleFed, type, buttonText, isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return response.errorResponse(res, {}, "Invalid donation button ID", 400);
    }

    const donationButton = await DonationButton.findById(id);
    if (!donationButton) {
      return response.errorResponse(res, {}, "Donation button not found", 404);
    }

    // If changing to ANY type, check if another ANY button exists
    if (type !== undefined && type === "ANY" && donationButton.type !== "ANY") {
      const existingAnyButton = await DonationButton.findOne({
        type: "ANY",
        _id: { $ne: id },
      });
      if (existingAnyButton) {
        return response.errorResponse(
          res,
          [
            {
              path: "type",
              msg: "Only one 'ANY' type donation button is allowed",
            },
          ],
          "Only one 'ANY' type donation button is allowed",
          400
        );
      }
    }

    if (type !== undefined) donationButton.type = type;
    const buttonType = type !== undefined ? type : donationButton.type;

    if (buttonType === "FIXED") {
      if (amount !== undefined) donationButton.amount = amount;
      if (peopleFed !== undefined) donationButton.peopleFed = peopleFed;
      donationButton.buttonText = null;
    } else {
      // For ANY type, set to 0
      donationButton.amount = 0;
      donationButton.peopleFed = 0;
      if (buttonText !== undefined)
        donationButton.buttonText = buttonText || "Donate Any Other Amount";
    }

    if (isActive !== undefined) donationButton.isActive = isActive;

    await donationButton.save();

    return response.successResponse(
      res,
      donationButton,
      "Donation button updated successfully"
    );
  } catch (err) {
    console.error("Error updating donation button:", err);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

/**
 * @route DELETE /api/admin/donation/buttons/:id
 * @desc Delete donation button (admin)
 * @access Private (Admin)
 */
const deleteDonationButton = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return response.errorResponse(res, {}, "Invalid donation button ID", 400);
    }

    const donationButton = await DonationButton.findById(id);
    if (!donationButton) {
      return response.errorResponse(res, {}, "Donation button not found", 404);
    }

    await DonationButton.findByIdAndDelete(id);

    return response.successResponse(
      res,
      {},
      "Donation button deleted successfully"
    );
  } catch (err) {
    console.error("Error deleting donation button:", err);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

/**
 * @route GET /api/admin/donation/requests
 * @desc Get all donation requests with filters (admin)
 * @access Private (Admin)
 */
const getAllDonationRequests = async (req, res) => {
  try {
    const {
      status,
      fromDate,
      toDate,
      phone,
      email,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (phone) {
      query.phone = { $regex: phone, $options: "i" };
    }

    if (email) {
      query.email = { $regex: email, $options: "i" };
    }

    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) {
        query.createdAt.$gte = new Date(fromDate);
      }
      if (toDate) {
        const toDateEnd = new Date(toDate);
        toDateEnd.setHours(23, 59, 59, 999);
        query.createdAt.$lte = toDateEnd;
      }
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [requests, total] = await Promise.all([
      DonationRequest.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      DonationRequest.countDocuments(query),
    ]);

    return response.successResponse(
      res,
      {
        data: requests,
        pagination: {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          total,
          pages: Math.ceil(total / parseInt(limit, 10)),
        },
      },
      "Donation requests retrieved successfully"
    );
  } catch (err) {
    console.error("Error fetching donation requests:", err);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

/**
 * @route GET /api/admin/donation/requests/:id
 * @desc Get single donation request (admin)
 * @access Private (Admin)
 */
const getDonationRequest = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return response.errorResponse(
        res,
        {},
        "Invalid donation request ID",
        400
      );
    }

    const donationRequest = await DonationRequest.findById(id).lean();

    if (!donationRequest) {
      return response.errorResponse(res, {}, "Donation request not found", 404);
    }

    return response.successResponse(
      res,
      donationRequest,
      "Donation request retrieved successfully"
    );
  } catch (err) {
    console.error("Error fetching donation request:", err);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

/**
 * @route PUT /api/admin/donation/requests/:id/approve
 * @desc Approve donation request (admin)
 * @access Private (Admin)
 */
const approveDonationRequest = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return response.errorResponse(
        res,
        {},
        "Invalid donation request ID",
        400
      );
    }

    const donationRequest = await DonationRequest.findById(id);

    if (!donationRequest) {
      return response.errorResponse(res, {}, "Donation request not found", 404);
    }

    if (donationRequest.status === "approved") {
      return response.errorResponse(
        res,
        {},
        "Donation request is already approved",
        400
      );
    }

    donationRequest.status = "approved";
    await donationRequest.save();

    // Send thank you email to donor
    // Email failures are handled gracefully - won't crash the request
    const emailResult = await emailService.sendDonationThankYouEmail(donationRequest);
    if (!emailResult.success) {
      console.error("Failed to send donation thank you email:", emailResult.error);
      // Continue processing - email failure should not block donation approval
    }

    return response.successResponse(
      res,
      donationRequest,
      "Donation request approved successfully"
    );
  } catch (err) {
    console.error("Error approving donation request:", err);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

/**
 * @route PUT /api/admin/donation/requests/:id/reject
 * @desc Reject donation request (admin)
 * @access Private (Admin)
 */
const rejectDonationRequest = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return response.errorResponse(
        res,
        {},
        "Invalid donation request ID",
        400
      );
    }

    const donationRequest = await DonationRequest.findById(id);

    if (!donationRequest) {
      return response.errorResponse(res, {}, "Donation request not found", 404);
    }

    if (donationRequest.status === "rejected") {
      return response.errorResponse(
        res,
        {},
        "Donation request is already rejected",
        400
      );
    }

    donationRequest.status = "rejected";
    await donationRequest.save();

    return response.successResponse(
      res,
      donationRequest,
      "Donation request rejected successfully"
    );
  } catch (err) {
    console.error("Error rejecting donation request:", err);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

module.exports = {
  // Public routes
  getActiveDonationButtons,
  getDonationSettings,
  generateDonationQRCode,
  submitDonationRequest,
  // Admin routes
  getAllDonationButtons,
  createDonationButton,
  updateDonationButton,
  deleteDonationButton,
  getAllDonationRequests,
  getDonationRequest,
  approveDonationRequest,
  rejectDonationRequest,
};
