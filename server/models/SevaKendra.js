const mongoose = require("mongoose");
const { Schema } = mongoose;

const SevaKendraSchema = new Schema(
  {
    EP_ID: {
      type: String,
      required: true,
      index: true,
    },
    is_active: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const SevaKendra = mongoose.model("seva_kendras", SevaKendraSchema);

module.exports = SevaKendra;
