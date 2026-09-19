const { validationResult } = require("express-validator");
const response = require("../../../config/response");
const CommonSettings = require("../../../models/CommonSettings");
const Admin = require("../../../models/Admin");
const Session = require("../../../models/Session");
const { comparePasswords } = require("../../../utils/helper");
const { uploadToR2, deleteFromR2 } = require("../../../helpers/r2Helper");
const {
  clearPublicSettingsCache,
} = require("../../../utils/publicSettingsCache");

const parseBooleanField = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return value;
};

const parseNumberField = (value) => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  }
  return value;
};

const parseObjectField = (value) => {
  if (!value) return value;
  if (typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (err) {
      return value;
    }
  }
  return value;
};

/**
 * @route GET /api/admin/settings
 * @desc Get common settings (auto-creates if not found)
 * @access Private (Admin only)
 */
const getCommonSettings = async (req, res) => {
  try {
    // Get or create settings (ensures one document exists)
    const settings = await CommonSettings.getOrCreateSettings();

    return response.successResponse(
      res,
      settings,
      "Settings retrieved successfully."
    );
  } catch (err) {
    console.error("Error in getCommonSettings:", err);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

/**
 * @route PUT /api/admin/settings
 * @desc Update common settings
 * @access Private (Admin only)
 */
const updateCommonSettings = async (req, res) => {
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

    // Validate transaction password
    const { txn_password } = req.body;
    if (!txn_password) {
      return response.errorResponse(
        res,
        { msg: "Transaction password is required." },
        "Transaction password is required.",
        400
      );
    }

    // Get admin and validate transaction password
    const adminID = req.user.id;
    const admin = await Admin.findById(adminID).select("txn_password").lean();
    if (!admin) {
      return response.errorResponse(
        res,
        { msg: "Admin not found." },
        "Admin not found.",
        400
      );
    }

    // Check if admin has transaction password set
    if (!admin.txn_password) {
      return response.errorResponse(
        res,
        { msg: "Transaction password not set. Please set your transaction password first." },
        "Transaction password not set.",
        400
      );
    }

    // Validate transaction password
    const validPassword = await comparePasswords(txn_password, admin.txn_password);
    if (!validPassword) {
      return response.errorResponse(
        res,
        [
          {
            path: "txn_password",
            msg: "Incorrect transaction password. Please double-check your credentials and try again.",
          },
        ],
        "Incorrect Transaction Password.",
        400
      );
    }

    // Get or create settings first
    let settings = await CommonSettings.getOrCreateSettings();

    // Extract allowed fields from request body
    let {
      name,
      contactUs,
      email,
      address,
      socialMedia,
      withdrawalEnabled,
      minWithdrawalAmount,
      maxWithdrawalAmount,
      dailyTxnLimit,
      withdrawalSurcharge,
      donationEnabled,
      donationMessage,
      marqueeEnabled,
      marqueeMessage,
      marqueeType,
      loginEnabled,
      registerEnabled,
      upi,
      bank,
    } = req.body;

    socialMedia = parseObjectField(socialMedia);
    upi = parseObjectField(upi);
    bank = parseObjectField(bank);

    withdrawalEnabled = parseBooleanField(withdrawalEnabled);
    donationEnabled = parseBooleanField(donationEnabled);
    marqueeEnabled = parseBooleanField(marqueeEnabled);
    loginEnabled = parseBooleanField(loginEnabled);
    registerEnabled = parseBooleanField(registerEnabled);

    minWithdrawalAmount = parseNumberField(minWithdrawalAmount);
    maxWithdrawalAmount = parseNumberField(maxWithdrawalAmount);
    dailyTxnLimit = parseNumberField(dailyTxnLimit);
    withdrawalSurcharge = parseNumberField(withdrawalSurcharge);

    // Update general information
    if (name !== undefined) settings.name = name;
    if (contactUs !== undefined) settings.contactUs = contactUs;
    if (email !== undefined) settings.email = email;
    if (address !== undefined) settings.address = address;

    if (req.file) {
      const uploadResult = await uploadToR2(req.file, "application-settings");
      const oldPlanPdfKey = settings.planPdfKey;

      settings.planPdfUrl = uploadResult.url;
      settings.planPdfKey = uploadResult.key;
      settings.planPdfSize = uploadResult.size || 0;

      if (oldPlanPdfKey) {
        try {
          await deleteFromR2(oldPlanPdfKey);
        } catch (deleteError) {
          console.error("Error deleting old plan PDF from R2:", deleteError);
        }
      }
    }

    // Update withdrawal settings
    if (withdrawalEnabled !== undefined) settings.withdrawalEnabled = withdrawalEnabled;

    // Update withdrawal settings with validation
    if (minWithdrawalAmount !== undefined) {
      if (minWithdrawalAmount < 0) {
        return response.errorResponse(
          res,
          { msg: "Minimum withdrawal amount cannot be negative." },
          "Validation Error",
          400
        );
      }
      settings.minWithdrawalAmount = minWithdrawalAmount;
    }

    if (maxWithdrawalAmount !== undefined) {
      if (maxWithdrawalAmount < 0) {
        return response.errorResponse(
          res,
          { msg: "Maximum withdrawal amount cannot be negative." },
          "Validation Error",
          400
        );
      }
      settings.maxWithdrawalAmount = maxWithdrawalAmount;
    }

    if (dailyTxnLimit !== undefined) {
      if (dailyTxnLimit < 0) {
        return response.errorResponse(
          res,
          { msg: "Daily transaction limit cannot be negative." },
          "Validation Error",
          400
        );
      }
      settings.dailyTxnLimit = dailyTxnLimit;
    }

    if (withdrawalSurcharge !== undefined) {
      if (withdrawalSurcharge < 0) {
        return response.errorResponse(
          res,
          { msg: "Withdrawal surcharge cannot be negative." },
          "Validation Error",
          400
        );
      }
      settings.withdrawalSurcharge = withdrawalSurcharge;
    }

    // Validate withdrawal limits: min should be less than max
    if (
      settings.minWithdrawalAmount >= settings.maxWithdrawalAmount &&
      settings.minWithdrawalAmount > 0 &&
      settings.maxWithdrawalAmount > 0
    ) {
      return response.errorResponse(
        res,
        {
          msg: "Minimum withdrawal amount must be less than maximum withdrawal amount.",
        },
        "Validation Error",
        400
      );
    }

    // Update donation settings
    if (donationEnabled !== undefined) settings.donationEnabled = donationEnabled;
    if (donationMessage !== undefined) settings.donationMessage = donationMessage;

    // Update marquee settings
    if (marqueeEnabled !== undefined) settings.marqueeEnabled = marqueeEnabled;
    if (marqueeMessage !== undefined) settings.marqueeMessage = marqueeMessage;
    if (marqueeType !== undefined) {
      if (["danger", "success", "warning"].includes(marqueeType)) {
        settings.marqueeType = marqueeType;
      } else {
        return response.errorResponse(
          res,
          { msg: "Invalid marquee type. Must be danger, success, or warning." },
          "Validation Error",
          400
        );
      }
    }

    // Update authentication settings
    // Check if login or register is being disabled
    const wasLoginEnabled = settings.loginEnabled;
    const wasRegisterEnabled = settings.registerEnabled;
    
    if (loginEnabled !== undefined) settings.loginEnabled = loginEnabled;
    if (registerEnabled !== undefined) settings.registerEnabled = registerEnabled;

    // If login or register is being disabled, logout all users (but not admins)
    // Session role: 1 = User, 2 = Admin
    if (
      (loginEnabled === false && wasLoginEnabled === true) ||
      (registerEnabled === false && wasRegisterEnabled === true)
    ) {
      try {
        // Delete all sessions for regular users only (role = 1)
        const result = await Session.deleteMany({ role: 1 });
        console.log(`Logged out all users: ${result.deletedCount} sessions deleted`);
      } catch (err) {
        console.error("Error logging out all users:", err);
        // Don't fail the request if logout fails, just log the error
      }
    }

    // Update UPI details
    if (upi) {
      if (upi.upiId !== undefined) settings.upi.upiId = upi.upiId;
      if (upi.upiHolderName !== undefined)
        settings.upi.upiHolderName = upi.upiHolderName;
    }

    // Update bank details
    if (bank) {
      if (bank.bankName !== undefined) settings.bank.bankName = bank.bankName;
      if (bank.accountNo !== undefined) settings.bank.accountNo = bank.accountNo;
      if (bank.accountHolderName !== undefined)
        settings.bank.accountHolderName = bank.accountHolderName;
      if (bank.ifscCode !== undefined) settings.bank.ifscCode = bank.ifscCode;
    }

    // Update social media links
    if (socialMedia) {
      if (socialMedia.instagram !== undefined)
        settings.socialMedia.instagram = socialMedia.instagram;
      if (socialMedia.facebook !== undefined)
        settings.socialMedia.facebook = socialMedia.facebook;
      if (socialMedia.youtube !== undefined)
        settings.socialMedia.youtube = socialMedia.youtube;
      if (socialMedia.zoomMeeting !== undefined)
        settings.socialMedia.zoomMeeting = socialMedia.zoomMeeting;
    }

    // Save updated settings
    await settings.save();

    clearPublicSettingsCache();

    return response.successResponse(
      res,
      settings,
      "Settings updated successfully."
    );
  } catch (err) {
    console.error("Error in updateCommonSettings:", err);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

module.exports = {
  getCommonSettings,
  updateCommonSettings,
};

