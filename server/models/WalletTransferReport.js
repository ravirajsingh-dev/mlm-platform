const mongoose = require("mongoose");
const { Schema } = mongoose;

const WalletTransferReportSchema = new Schema(
  {
    transferredBy: {
      type: String,
      required: true,
      index: true,
    },

    transferredTo: {
      type: String,
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      index: true,
    },
    type: {
      type: String,
      index: true,
      default: "CR",
    },
    status: {
      type: String,
      required: true,
      default: "Transferred",
    },
    walletType: {
      type: String,
      enum: ["e_cash", "e_pool", "upgrade", "help", "ddf", "e_pool_upgrade"],
      default: "e_cash",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const WalletTransferReport = mongoose.model(
  "wallet_transfer_reports",
  WalletTransferReportSchema
);

module.exports = WalletTransferReport;
