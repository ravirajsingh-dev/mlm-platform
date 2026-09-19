const mongoose = require("mongoose");
const { Schema } = mongoose;
const { defaultLevels } = require("../utils/levelUtils");

const FirstPayUserSchema = new Schema(
  {
    levels: {
      type: [
        {
          label: { type: String, required: true },
          value: { type: Number, required: true },
          assignedUser: {
            type: Schema.Types.ObjectId,
            ref: "users",
            default: null,
          },
        },
      ],
      default: defaultLevels,
    },
  },
  {
    timestamps: true,
  }
);

const FirstPayUser = mongoose.model("first_pay_users", FirstPayUserSchema);

module.exports = FirstPayUser;
