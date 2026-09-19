const mongoose = require("mongoose");
const { Schema } = mongoose;

const walletSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
      unique: true,
    },
    totalBalance: {
      type: Number,
      required: true,
      index: true,
      default: 0,
      min: 0,
    },
    e_cash: {
      type: Number,
      required: true,
      index: true,
      default: 0,
      min: 0,
    },
    upgrade: {
      type: Number,
      required: true,
      index: true,
      default: 0,
      min: 0,
    },
    help: {
      type: Number,
      index: true,
      default: 0,
      min: 0,
    },
    ddf: {
      type: Number,
      index: true,
      default: 0,
      min: 0,
    },
    e_pool: {
      type: Number,
      index: true,
      default: 0,
      min: 0,
    },
    e_pool_upgrade: {
      type: Number,
      index: true,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

walletSchema.index({ user: 1, e_cash: 1 });

const calculateTotalBalance = (wallet, isRoot = false) => {
  const e_cash = wallet.e_cash || 0;
  const upgrade = wallet.upgrade || 0;
  const help = wallet.help || 0;
  const ddf = wallet.ddf || 0;
  const e_pool = wallet.e_pool || 0;
  const e_pool_upgrade = wallet.e_pool_upgrade || 0;

  return isRoot
    ? e_cash + upgrade + help + ddf + e_pool + e_pool_upgrade
    : e_cash + upgrade + e_pool + e_pool_upgrade;
};

walletSchema.pre("save", async function () {
  const wallet = this;

  if (
    !wallet.isModified("e_cash") &&
    !wallet.isModified("upgrade") &&
    !wallet.isModified("help") &&
    !wallet.isModified("ddf") &&
    !wallet.isModified("e_pool") &&
    !wallet.isModified("e_pool_upgrade")
  ) {
    return;
  }

  const user = await mongoose
    .model("users")
    .findById(wallet.user)
    .select("is_root")
    .lean()
    .exec();

  const isRoot = user?.is_root === true;
  console.log("isRoot in pre-save hook:", isRoot);

  wallet.totalBalance = calculateTotalBalance(wallet, isRoot);

  if (!isRoot) {
    // Clean sensitive fields for non-root users
    wallet.set("help", undefined, { strict: false });
    wallet.set("ddf", undefined, { strict: false });
  }
});

const Wallet = mongoose.model("wallets", walletSchema);
module.exports = Wallet;
