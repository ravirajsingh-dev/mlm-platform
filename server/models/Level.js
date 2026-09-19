const mongoose = require("mongoose");

const bitsForUpgradeSchema = new mongoose.Schema({
  bits_type: {
    type: String,
    enum: ["Passive", "Direct", "Upgrade", "Help"],
  },
  payment_for_level: {
    type: Number,
  },
  link_type: {
    type: Number,
  },
  bits: {
    type: Number,
  },
});

const earningsForUpgradeSchema = new mongoose.Schema({
  total_earnings: {
    type: Number,
  },
  deals_count: {
    type: Number,
  },
  deal_bits: {
    type: Number,
  },
  bits_type: {
    type: String,
  },
  link_type: {
    type: Number,
  },
  payment_for_level: {
    type: Number,
  },
});

const LevelSchema = new mongoose.Schema(
  {
    level: {
      type: Number,
      required: true,
      default: 0,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
    },
    required_team: {
      type: Number,
    },
    required_EP_bits: {
      type: Number,
    },
    upgrade_bits: {
      type: Number,
    },
    bits_for_upgrade: {
      type: [bitsForUpgradeSchema],
    },
    earnings_on_upgrade: {
      type: earningsForUpgradeSchema,
    },
  },
  {
    timestamps: true,
  }
);

const Level = mongoose.model("config_levels", LevelSchema);

module.exports = Level;
