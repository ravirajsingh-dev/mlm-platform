const mongoose = require("mongoose");
const { Schema } = mongoose;

const WithdrawalRequestSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    upiId: {
      type: String,
      required: true,
      trim: true,
    },
    upiHolderName: {
      type: String,
      required: true,
      trim: true,
    },
    surchargePercent: {
      type: Number,
      required: true,
      min: 0,
    },
    surchargeAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    netPayableAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
      index: true,
    },
    adminId: {
      type: Schema.Types.ObjectId,
      ref: "admins",
      default: null,
    },
    utrNumber: {
      type: String,
      trim: true,
      default: null,
    },
    adminRemark: {
      type: String,
      trim: true,
      default: null,
    },
    actionAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
WithdrawalRequestSchema.index({ userId: 1, status: 1 });
WithdrawalRequestSchema.index({ status: 1, createdAt: -1 });

const WithdrawalRequest = mongoose.model(
  "withdrawal_requests",
  WithdrawalRequestSchema
);

module.exports = WithdrawalRequest;
