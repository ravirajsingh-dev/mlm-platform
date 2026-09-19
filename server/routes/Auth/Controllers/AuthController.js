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
  comparePasswords,
  generateNumericPassword,
} = require("../../../utils/helper");

const {
  setAuthTokenCookie,
  setAuthRefreshTokenCookie,
} = require("../../../utils/cookieUtils");
const { sendSingleSMS } = require("../../../customClasses/smsServices");
const Wallet = require("../../../models/Wallet");
const CommonSettings = require("../../../models/CommonSettings");

module.exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return response.errorResponse(res, errors.array(), "Validation Error", 400);
  }

  try {
    // Check if login is enabled
    const settings = await CommonSettings.getOrCreateSettings();
    if (!settings.loginEnabled) {
      return response.errorResponse(
        res,
        { msg: "Login is currently disabled. Please contact administrator." },
        "Login is currently disabled.",
        503
      );
    }

    const { EP_ID, password } = req.body;

    if (!EP_ID || !password) {
      return response.errorResponse(
        res,
        { msg: "Email/self Sponsor ID/Phone and Password are required." },
        "Invalid credentials provided.",
        400
      );
    }

    const isEmail = isEmailValid(EP_ID);
    const isSelfSponsorID = isSelfSponsorIDValid(EP_ID);
    const isPhone = isPhoneNumberValid(EP_ID);

    let user;
    if (isSelfSponsorID) {
      user = await User.findOne({
        EP_ID: EP_ID,
      });
    } else {
      return response.errorResponse(
        res,
        { msg: "Invalid Email, self Sponsor ID, or Phone format." },
        "Invalid Credentials.",
        400
      );
    }

    if (!user) {
      return response.errorResponse(
        res,
        { msg: "Invalid Credentials." },
        "Invalid Credentials.",
        401
      );
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

    // Update last_login field
    user.last_login = new Date();
    await user.save();

    // Create sanitized user object without sensitive fields
    const sanitizedUser = user.toObject();
    delete sanitizedUser.password;
    delete sanitizedUser.passCopy;
    sanitizedUser.isTxnPassSet = !!user.txn_password;

    setAuthTokenCookie(res, accessToken);
    setAuthRefreshTokenCookie(res, accessToken);

    return response.successResponse(
      res,
      { accessToken, refreshToken, user: sanitizedUser, sessionID },
      "Login Successful"
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
        { msg: "Invalid user ID" },
        "Invalid user ID",
        400
      );
    }

    // Find the user by ID
    const user = await User.findById(userId)
      .select("-password -passCopy -txnPassCopy")
      .lean();

    user.isTxnPassSet = !!user.txn_password;

    // If user is not found, return error
    if (!user) {
      return response.errorResponse(
        res,
        { msg: "User does not exist" },
        "User does not exist",
        404
      );
    }

    return response.successResponse(res, user, "User details");
  } catch (err) {
    console.error(err.message);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

module.exports.getSponsorUserDetails = async (req, res) => {
  try {
    const sponsorEP = req.params.sponsor_id;

    // Find the user by ID
    const user = await User.findOne({ EP_ID: sponsorEP }).select("name status");

    // If user is not found, return error
    if (!user) {
      return response.errorResponse(
        res,
        // { msg: "User does not exist with this sponsorEP" },
        [
          {
            path: "sponsorEP",
            msg: "User does not exist with this EP_ID",
          },
          {
            path: "EP_ID",
            msg: "User does not exist with this EP_ID",
          },
        ],
        "User does not exist with this EP_ID",
        404
      );
    }

    // Check if the user is active (status !== 2)
    if (user.status === 2) {
      return response.errorResponse(
        res,
        [
          {
            path: "EP_ID",
            msg: "User does not active now.",
          },
        ],
        "User does not active now.",
        404
      );
    }

    const wallet = await Wallet.findOne({ user: user._id }).lean();

    const resData = {
      ...user.toObject(),
      e_cash: wallet?.e_cash || 0,
      e_pool: wallet?.e_pool || 0,
      upgrade: wallet?.upgrade || 0,
      help: wallet?.help || 0,
      ddf: wallet?.ddf || 0,
      e_pool_upgrade: wallet?.e_pool_upgrade || 0,
      wallet: wallet || {},
    };

    return response.successResponse(res, resData, "Sponsor User details");
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
        { msg: "Invalid user ID" },
        "Invalid user ID",
        400
      );
    }

    // Delete all sessions for this user (logout from all devices)
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

    if (!userId) {
      return response.errorResponse(
        res,
        { msg: "Invalid user ID" },
        "Invalid user ID",
        400
      );
    }

    const { oldPassword, password } = req.body;

    const user = await User.findById(userId);

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

    let updatedUser = await User.findByIdAndUpdate(
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

    // Invalidate all sessions for this user after password change
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
    if (!userId) {
      return response.errorResponse(
        res,
        { msg: "Invalid user ID" },
        "Invalid user ID",
        400
      );
    }
    const { txn_password } = req.body;

    const user = await User.findById(userId);

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

    let updatedUser = await User.findByIdAndUpdate(
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

    if (!userId) {
      return response.errorResponse(
        res,
        { msg: "Invalid user ID" },
        "Invalid user ID",
        400
      );
    }

    const { oldTxnPassword, txn_password } = req.body;

    const user = await User.findById(userId);

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

    let updatedUser = await User.findByIdAndUpdate(
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

module.exports.forgotPasswordStep1 = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return response.errorResponse(res, errors.array(), "Validation Error", 400);
  }

  const { EP_ID } = req.body;

  try {
    if (!isSelfSponsorIDValid(EP_ID)) {
      return response.errorResponse(
        res,
        [{ path: "EP_ID", msg: "Invalid EP ID." }],
        "Invalid EP ID.",
        400
      );
    }

    const user = await User.findOne({ EP_ID: EP_ID })
      .select("EP_ID phone")
      .lean();

    if (!user || !user.phone) {
      return response.errorResponse(
        res,
        [{ path: "EP_ID", msg: "No user found with this EP ID." }],
        "Invalid credentials.",
        404
      );
    }

    const phone = user.phone.toString();
    const maskedPhone = phone.slice(-4); // last 4 digits

    console.log("maskedPhone", maskedPhone, phone);

    return response.successResponse(res, { maskedPhone }, "EP ID Verified.");
  } catch (err) {
    console.error("Error in forgotPasswordStep1:", err);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};

module.exports.forgotPasswordStep2 = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return response.errorResponse(res, errors.array(), "Validation Error", 400);
  }

  const { EP_ID, phone } = req.body;

  try {
    const user = await User.findOne({ EP_ID: EP_ID }).select(
      "phone EP_ID name password passCopy"
    );

    if (!user) {
      return response.errorResponse(
        res,
        [{ path: "EP_ID", msg: "Invalid EP ID." }],
        "Invalid credentials.",
        404
      );
    }

    if (user.phone.toString() !== phone.toString()) {
      return response.errorResponse(
        res,
        [{ path: "phone", msg: "Phone number does not match our records." }],
        "Phone verification failed.",
        400
      );
    }

    // Reset password logic — generate a new random password
    const newPasswordPlain = generateNumericPassword();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPasswordPlain, salt);

    console.log("newPasswordPlain", newPasswordPlain);

    user.password = hashedPassword;
    user.passCopy = newPasswordPlain;
    user.passwordChangedAt = new Date(); // Track password change timestamp
    await user.save();

    // Delete all sessions for this user after password reset
    // This ensures all devices are logged out immediately
    await Session.deleteMany({ userID: user._id });

    // Send new password via SMS
    const forgotTemplateID = process.env.SMS_FORGOT_TEMPLATE_ID;
    const message = `Hi! Your request to recover your ID and password was successful. User ID: ${EP_ID} Password: ${newPasswordPlain} Thanks for being a part of – EK PAHAL.`;

    // sendSingleSMS({
    //   phone: phone,
    //   message: message,
    //   templateId: forgotTemplateID,
    // })
    //   .then((response) => {
    //     console.log("✅ Your SMS is sent:", response);
    //   })
    //   .catch((error) => {
    //     console.error("❌ Failed to send SMS:", error.message);
    //   });

    return response.successResponse(
      res,
      {
        msg: "Password reset successfully. Please check your registered contact for the new password.",
      },
      "Password reset successfully. Please check your registered contact for the new password."
    );
  } catch (err) {
    console.error("Error in forgotPasswordStep2:", err);
    return response.errorResponse(res, {}, "Server Error", 500);
  }
};
