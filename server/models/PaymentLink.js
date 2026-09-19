const mongoose = require("mongoose");
const { Schema } = mongoose;

const PaymentLinkSchema = new Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      index: true,
    },
    payment_type: {
      type: String,
      enum: [
        "Direct",
        "Passive",
        "Upgrade",
        "Help",
        "E_Pool_Upgrade",
        "E_Pool",
      ],
      required: true,
    },
    payment_for_level: {
      type: Number,
      required: true,
      index: true,
    },
    sender_status: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
      required: true,
      index: true,
    },
    receiver_status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
      required: true,
      index: true,
    },
    status: {
      type: String,
      required: false,
      enum: ["pending", "completed"],
      default: "pending",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

PaymentLinkSchema.pre("save", async function () {
  if (this.sender && this.receiver && this.sender.equals(this.receiver)) {
    throw new Error("Sender and receiver cannot be the same.");
  }
});

// Compound indexes for sender/receiver list + status + recency (Atlas tier–friendly)
PaymentLinkSchema.index({
  sender: 1,
  payment_type: 1,
  sender_status: 1,
  updatedAt: -1,
});
PaymentLinkSchema.index({
  receiver: 1,
  payment_type: 1,
  receiver_status: 1,
  updatedAt: -1,
});

const PaymentLink = mongoose.model("payment_links", PaymentLinkSchema);
module.exports = PaymentLink;
