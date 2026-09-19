const mongoose = require("mongoose");
const { Schema } = mongoose;

const EPinSchema = new Schema(
  {
    EP_ID: {
      type: String,
      required: true,
      index: true,
    },
    EPin_ID: {
      type: String,
      required: true,
      unique: true,
      minlength: 15,
      maxlength: 15,
      index: true,
      immutable: true,
    },
    used_by: {
      type: String,
      index: true,
    },
    is_expired: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const EPin = mongoose.model("e_pins", EPinSchema);

module.exports = EPin;
