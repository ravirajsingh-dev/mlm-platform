const mongoose = require("mongoose");
const { Schema } = mongoose;

const walletTransactionSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  wallet: {
    type: Schema.Types.ObjectId,
    ref: "wallets",
    required: true,
    index: true,
  },
  walletType: {
    type: String,
    enum: ["e_cash", "upgrade", "help", "ddf", "e_pool", "e_pool_upgrade"],
    required: true,
  },
  type: {
    type: String,
    enum: ["credit", "debit"],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: [1, "Amount must be greater than 0"],
  },
  balanceAfterTransaction: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
    immutable: true,
  },
});

// Compound indexes for better query performance
walletTransactionSchema.index({ user: 1, createdAt: -1 });
walletTransactionSchema.index({ user: 1, type: 1, createdAt: -1 });
walletTransactionSchema.index({ walletType: 1, type: 1, createdAt: -1 });
walletTransactionSchema.index({ createdAt: -1, walletType: 1 });
walletTransactionSchema.index({ type: 1, createdAt: -1 });

const WalletTransaction = mongoose.model(
  "wallet_transactions",
  walletTransactionSchema
);
module.exports = WalletTransaction;
