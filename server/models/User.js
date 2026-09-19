const mongoose = require("mongoose");
const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    name: {
      type: String,
      maxlength: 150,
      required: true,
    },
    email: {
      type: String,
      maxlength: 100,
    },
    ccode: {
      type: String,
      minlength: 1,
      maxlength: 5,
      required: true,
      default: "91",
    },
    phone: {
      type: String,
      maxlength: 10,
      minlength: 10,
      required: true,
      index: true,
    },
    sponsorEP: {
      type: String,
      maxlength: 15,
      required: true,
      index: true,
      immutable: true,
    },
    EP_ID: {
      type: String,
      unique: true,
      maxlength: 15,
      index: true,
      immutable: true,
    },
    uplineEP: {
      type: String,
      maxlength: 15,
      index: true,
    },
    position: {
      type: String,
      required: true,
      enum: ["left", "right"],
      index: true,
    },
    city: {
      type: String,
      maxlength: 50,
      required: true,
      index: true,
    },
    state: {
      type: String,
      maxlength: 50,
      required: true,
      index: true,
    },
    country: {
      type: String,
      maxlength: 2,
      minlength: 2,
      required: true,
      index: true,
    },
    uuid: {
      type: String,
      max: 64,
    },
    password: {
      type: String,
      required: true,
      minlength: 4,
    },
    passCopy: {
      type: String,
      required: true,
      minlength: 4,
    },
    txn_password: {
      type: String,
      minlength: 4,
    },
    txnPassCopy: {
      type: String,
      minlength: 4,
    },
    status: {
      type: Number,
      default: 3, // 1 = Active, 2 = Inactive, 3 = New, 4 = Temporary blocked
    },
    last_login: {
      type: Date,
    },
    reactivatedAt: {
      type: Date,
      default: null,
    },
    passwordChangedAt: {
      type: Date,
      default: null,
    },
    avatar: {
      type: String,
    },
    role: {
      type: Number, // 1 = User, 2 = Admin
      required: true,
      default: 1,
      immutable: true,
    },
    terms_accepted: {
      type: Boolean,
      default: false,
    },
    left_leg: {
      type: Schema.Types.ObjectId,
      ref: "users",
      default: null,
      index: true,
    },
    right_leg: {
      type: Schema.Types.ObjectId,
      ref: "users",
      default: null,
      index: true,
    },
    user_level: {
      type: Number,
      default: 0,
      index: true,
    },
    upcoming_level: {
      type: String,
    },
    pay_method_added: {
      type: Boolean,
      default: false,
    },
    is_direct_paid: {
      type: Boolean,
      default: false,
    },
    is_passive_paid: {
      type: Boolean,
      default: false,
    },
    is_help_paid: {
      type: Boolean,
      default: false,
    },
    i_added_to_left: {
      type: Boolean,
      default: false,
    },
    i_added_to_right: {
      type: Boolean,
      default: false,
    },
    total_direct_users: {
      type: Number,
      default: 0,
    },
    total_left_users: {
      type: Number,
      default: 0,
    },
    total_right_users: {
      type: Number,
      default: 0,
    },
    ratio_completed: {
      type: Number,
      default: 0,
    },
    revewal_pending: {
      type: Boolean,
      default: false,
    },
    last_renewal: {
      type: Date,
      default: Date.now,
    },
    is_root: {
      type: Boolean,
      default: false,
      index: true,
    },
    has_entered_e_pool: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ status: 1, createdAt: -1 });

const User = mongoose.model("users", UserSchema);

module.exports = User;
