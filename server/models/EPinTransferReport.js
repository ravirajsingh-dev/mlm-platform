const mongoose = require("mongoose");
const { Schema } = mongoose;

const EPinTransferReportSchema = new Schema(
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

    quantity: {
      type: Number,
      required: true,
      index: true,
    },

    status: {
      type: String,
      required: true,
      default: "Transferred",
    },
    type: {
      type: String,
      required: true,
      default: "Transferred",
    },
  },
  {
    timestamps: true,
  }
);

const EPinTransferReport = mongoose.model(
  "epins_transfer_report",
  EPinTransferReportSchema
);

module.exports = EPinTransferReport;
