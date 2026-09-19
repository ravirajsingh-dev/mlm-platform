const mongoose = require("mongoose");
const { Schema } = mongoose;

const CommonSettingsSchema = new Schema(
  {
    // General Information
    name: {
      type: String,
      required: true,
      trim: true,
    },
    contactUs: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    planPdfUrl: {
      type: String,
      trim: true,
      default: "",
    },
    planPdfKey: {
      type: String,
      trim: true,
      default: "",
    },
    planPdfSize: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Social Media Links
    socialMedia: {
      instagram: {
        type: String,
        trim: true,
        default: "",
      },
      facebook: {
        type: String,
        trim: true,
        default: "",
      },
      youtube: {
        type: String,
        trim: true,
        default: "",
      },
      zoomMeeting: {
        type: String,
        trim: true,
        default: "",
      },
    },

    // Withdrawal Settings
    withdrawalEnabled: {
      type: Boolean,
      default: true,
    },
    minWithdrawalAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    maxWithdrawalAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    dailyTxnLimit: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    withdrawalSurcharge: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    // Donation Settings
    donationEnabled: {
      type: Boolean,
      default: true,
    },
    donationMessage: {
      type: String,
      trim: true,
      default: "",
    },

    // Marquee Settings
    marqueeEnabled: {
      type: Boolean,
      default: false,
    },
    marqueeMessage: {
      type: String,
      trim: true,
      default: "",
    },
    marqueeType: {
      type: String,
      enum: ["danger", "success", "warning"],
      default: "warning",
    },

    // Authentication Settings
    loginEnabled: {
      type: Boolean,
      default: true,
    },
    registerEnabled: {
      type: Boolean,
      default: true,
    },

    // UPI Details
    upi: {
      upiId: {
        type: String,
        trim: true,
        default: "",
      },
      upiHolderName: {
        type: String,
        trim: true,
        default: "",
      },
    },

    // Bank Details
    bank: {
      bankName: {
        type: String,
        trim: true,
        default: "",
      },
      accountNo: {
        type: String,
        trim: true,
        default: "",
      },
      accountHolderName: {
        type: String,
        trim: true,
        default: "",
      },
      ifscCode: {
        type: String,
        trim: true,
        default: "",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Static method to get or create settings (ensures only one document exists)
CommonSettingsSchema.statics.getOrCreateSettings = async function () {
  try {
    // Try to find existing settings
    let settings = await this.findOne();

    // If no settings exist, create default one
    if (!settings) {
      settings = await this.create({
        name: "EK PAHAL",
        contactUs: "9999999999",
        email: "support@example.com",
        address: "",
        planPdfUrl: "",
        planPdfKey: "",
        planPdfSize: 0,
        socialMedia: {
          instagram: "",
          facebook: "",
          youtube: "",
          zoomMeeting: "",
        },
        withdrawalEnabled: false,
        minWithdrawalAmount: 1000,
        maxWithdrawalAmount: 15000,
        dailyTxnLimit: 3,
        withdrawalSurcharge: 10,
        donationEnabled: false,
        donationMessage: "",
        marqueeEnabled: false,
        marqueeMessage: "",
        marqueeType: "warning",
        loginEnabled: true,
        registerEnabled: true,
        upi: {
          upiId: "",
          upiHolderName: "",
        },
        bank: {
          bankName: "",
          accountNo: "",
          accountHolderName: "",
          ifscCode: "",
        },
      });
    }

    return settings;
  } catch (error) {
    console.error("Error in getOrCreateSettings:", error);
    throw error;
  }
};

const CommonSettings = mongoose.model("common_settings", CommonSettingsSchema);

module.exports = CommonSettings;
