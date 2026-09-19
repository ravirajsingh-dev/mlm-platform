const { NODE_ENV } = require("../config/config");

// Determine if running in production environment
const isProduction = NODE_ENV === "production";

// Get cookie options based on environment
const getCookieOptions = () => ({
  httpOnly: true, // Prevents JavaScript access (XSS protection)
  secure: isProduction, // HTTPS only in production
  sameSite: isProduction ? "strict" : "lax", // CSRF protection
});

/**
 * Set access token as an HttpOnly cookie
 * @param {Object} res - Express response object
 * @param {string} token - JWT access token
 */
const setAuthTokenCookie = (res, token) => {
  res.cookie("token", token, getCookieOptions());
};

/**
 * Set refresh token as an HttpOnly cookie
 * @param {Object} res - Express response object
 * @param {string} token - JWT refresh token
 */
const setAuthRefreshTokenCookie = (res, token) => {
  res.cookie("refreshToken", token, getCookieOptions());
};

module.exports = { setAuthTokenCookie, setAuthRefreshTokenCookie };
