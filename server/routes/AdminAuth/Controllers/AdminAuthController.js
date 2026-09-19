const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../../../models/User");
const Session = require("../../../models/Session");

const { JWT_REFRESH_SECRET } = require("../../../config/config");
const response = require("../../../config/response");
const { generateTokens } = require("../../../utils/authUtils");

const {
  isSelfSponsorIDValid,
  isEmailValid,
  isPhoneNumberValid,
  isAdminIDValid,
  comparePasswords,
} = require("../../../utils/helper");

const {
  setAuthTokenCookie,
  setAuthRefreshTokenCookie,
} = require("../../../utils/cookieUtils");
const Admin = require("../../../models/Admin");

module.exports.adminLogin = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return response.errorResponse(res, errors.array(), "Validation Error", 400);
  }

  try {
    const { admin_id, password } = req.body;

    if (!admin_id || !password) {
      return response.errorResponse(
        res,
        { msg: "Admin ID and Password are required." },
        "Invalid credentials provided.",
        400
      );
    }

    // Admin authentication must use admin_id only - validation already done in middleware
    // Use admin from request if available (set by validation middleware), otherwise query
    let user = req.admin;

    if (!user) {
      // Fallback: query admin by admin_id (case-insensitive)
      user = await Admin.findOne({
        admin_id: { $regex: new RegExp("^" + admin_id + "$", "i") },
      });

      if (!user) {
        return response.errorResponse(
          res,
          { msg: "Invalid Credentials." },
          "Invalid Credentials.",
          401
        );
      }
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return response.errorResponse(
        res,
        [
          {
            path: "password",
            msg: "Incorrect password. Please double-check your credentials and try again.",
          },
        ],
        "Incorrect Credentials.",
        400
      );
    }

    const { accessToken, refreshToken, sessionID } = await generateTokens(user);

    // Remove the password field from the user object
    delete user.password;
    delete user.passCopy;

    // Update last_login field
    user.last_login = new Date();

    await user.save();

    setAuthTokenCookie(res, accessToken);
    setAuthRefreshTokenCookie(res, accessToken);

    return response.successResponse(
      res,
      { accessToken, refreshToken, user, sessionID },
      "Admin Login Successful"
    );
  } catch (err) {
    console.error(err);
    return response.errorResponse(res, {}, "Server Error.", 500);
  }
};

module.exports.checkAuth = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return response.errorResponse(
        res,
        { msg: "Invalid admin ID" },
        "Invalid admin ID",
        400
      );
    }

    // Find the admin by ID
    const admin = await Admin.findById(userId)
      .select("-password -passCopy")
      .lean();

    // If admin is not found, return error
    if (!admin) {
      return response.errorResponse(
        res,
        { msg: "User does not exist" },
        "User does not exist",
        404
      );
    }

    return response.successResponse(res, admin, "Admin details");
  } catch (err) {
    console.error(err.message);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

module.exports.logout = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return response.errorResponse(
      res,
      { msg: "Refresh token is required." },
      "Invalid Request.",
      400
    );
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

    await Session.findOneAndDelete({
      userID: decoded.id,
      refreshToken,
    });

    return response.successResponse(res, {}, "Logged out successfully.");
  } catch (err) {
    console.error(err);
    return response.errorResponse(res, {}, "Invalid token.", 403);
  }
};

module.exports.logoutAll = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return response.errorResponse(
        res,
        { msg: "Invalid admin ID" },
        "Invalid admin ID",
        400
      );
    }

    // Delete all sessions for this admin (logout from all devices)
    await Session.deleteMany({ userID: userId });

    return response.successResponse(
      res,
      {},
      "Logged out from all devices successfully."
    );
  } catch (err) {
    console.error(err);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

module.exports.changePassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return response.errorResponse(res, errors.array(), "Validation Error", 400);
  }
  try {
    const userId = req.user.id;

    const { oldPassword, password } = req.body;

    const user = await Admin.findById(userId);

    if (!user) {
      return response.errorResponse(
        res,
        { msg: "Invalid user ID" },
        "Invalid user ID",
        400
      );
    }

    const validPassword = await comparePasswords(oldPassword, user.password);

    if (!validPassword) {
      return response.errorResponse(
        res,
        [
          {
            path: "oldPassword",
            msg: "Incorrect password. Please double-check your credentials and try again.",
          },
        ],
        "Incorrect Credentials.",
        400
      );
    }

    const salt = await bcrypt.genSalt(10);
    const newPassword = await bcrypt.hash(password, salt);

    let updatedUser = await Admin.findByIdAndUpdate(
      { _id: userId },
      {
        password: newPassword,
        passCopy: password,
        passwordChangedAt: new Date(), // Track password change timestamp
      },
      { returnDocument: "after" }
    ).lean();

    if (!updatedUser) {
      return response.errorResponse(
        res,
        { msg: "Unable to find the user" },
        "Unable to find the user",
        401
      );
    }

    // Invalidate all sessions for this admin after password change
    // This ensures all devices are logged out immediately
    await Session.deleteMany({ userID: userId });

    return response.successResponse(res, {}, "Password change successfully.");
  } catch (err) {
    console.error(err);
    return response.errorResponse(res, {}, "Server Error", 403);
  }
};

module.exports.setTxnPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return response.errorResponse(res, errors.array());
  }

  try {
    const userId = req.user.id;

    const { txn_password } = req.body;

    const user = await Admin.findById(userId);

    if (!user) {
      return response.errorResponse(
        res,
        { msg: "Invalid user ID" },
        "Invalid user ID",
        400
      );
    }

    const salt = await bcrypt.genSalt(10);
    const txnPasswordHash = await bcrypt.hash(txn_password, salt);

    let updatedUser = await Admin.findByIdAndUpdate(
      { _id: user._id },
      {
        txn_password: txnPasswordHash,
        txnPassCopy: txn_password,
      },
      { returnDocument: "after" }
    ).lean();

    if (!updatedUser) {
      return response.errorResponse(
        res,
        { msg: "Unable to find the user" },
        "Unable to find the user",
        401
      );
    }

    return response.successResponse(
      res,
      {},
      "Set Transaction Password successfully."
    );
  } catch (err) {
    console.error(err);
    return response.errorResponse(res, {}, "Server Error", 403);
  }
};

module.exports.changeTnxPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return response.errorResponse(res, errors.array(), "Validation Error", 400);
  }
  try {
    const userId = req.user.id;

    const { oldTxnPassword, txn_password } = req.body;

    const user = await Admin.findById(userId);

    if (!user) {
      return response.errorResponse(
        res,
        { msg: "Invalid user ID" },
        "Invalid user ID",
        400
      );
    }

    const validPassword = await comparePasswords(
      oldTxnPassword,
      user.txn_password
    );

    if (!validPassword) {
      return response.errorResponse(
        res,
        [
          {
            path: "oldTxnPassword",
            msg: "Incorrect Tnx password. Please double-check your credentials and try again.",
          },
        ],
        "Incorrect Tnx Password.",
        400
      );
    }

    const salt = await bcrypt.genSalt(10);
    const newTnxPasswordHash = await bcrypt.hash(txn_password, salt);

    let updatedUser = await Admin.findByIdAndUpdate(
      { _id: userId },
      {
        txn_password: newTnxPasswordHash,
        txnPassCopy: txn_password,
      },
      { returnDocument: "after" }
    ).lean();

    if (!updatedUser) {
      return response.errorResponse(
        res,
        { msg: "Unable to find the user" },
        "Unable to find the user",
        401
      );
    }

    return response.successResponse(
      res,
      {},
      "TxnPassword change successfully."
    );
  } catch (err) {
    console.error(err);
    return response.errorResponse(res, {}, "Server Error", 403);
  }
};
