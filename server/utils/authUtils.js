const jwt = require("jsonwebtoken");
const {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRATION,
  JWT_REFRESH_EXPIRATION,
} = require("../config/config");

const Session = require("../models/Session");
const crypto = require("crypto");

const generateAccessToken = (user) => {
  return jwt.sign(user, JWT_ACCESS_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRATION || "15m",
  });
};

const generateRefreshToken = (user) => {
  return jwt.sign(user, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRATION || "1d",
  });
};

const generateTokens = async (user) => {
  const userPlainObj = {
    id: user?._id,
    uuid: user?.uuid,
    role: user?.role,
    // Include passwordChangedAt timestamp in token for validation
    passwordChangedAt: user?.passwordChangedAt ? new Date(user.passwordChangedAt).getTime() : null,
  };

  const accessToken = generateAccessToken(userPlainObj);
  const refreshToken = generateRefreshToken(userPlainObj);
  const sessionID = crypto.randomBytes(16).toString("hex");

  const sessionData = {
    userID: user?.id,
    role: user?.role,
    sessionID,
    accessToken,
    refreshToken,
  };

  try {
    // Allow multiple concurrent sessions - do NOT delete existing sessions
    // Each login creates a new independent session
    const session = await new Session(sessionData).save();

    return { accessToken, refreshToken, sessionID };
  } catch (error) {
    console.error("Error saving session:", error);
    throw error;
  }
};

module.exports = { generateAccessToken, generateRefreshToken, generateTokens };
