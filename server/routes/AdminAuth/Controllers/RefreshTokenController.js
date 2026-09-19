const jwt = require("jsonwebtoken");

const Session = require("../../../models/Session");

const response = require("../../../config/response");
const { JWT_REFRESH_SECRET } = require("../../../config/config");
const { generateTokens } = require("../../../utils/authUtils");
const {
  setAuthTokenCookie,
  setAuthRefreshTokenCookie,
} = require("../../../utils/cookieUtils");
const Admin = require("../../../models/Admin");

const adminRefreshToken = async (req, res) => {
  const { refreshToken: receivedRefreshToken } = req.body;

  if (!receivedRefreshToken) {
    return response.errorResponse(
      res,
      { msg: "Refresh token is required." },
      "Invalid Request.",
      400
    );
  }

  try {
    const decoded = jwt.verify(receivedRefreshToken, JWT_REFRESH_SECRET);

    const session = await Session.findOne({
      userID: decoded.id,
      refreshToken: receivedRefreshToken,
      role: decoded.role,
    });
    if (!session || !session.isActive) {
      return response.errorResponse(
        res,
        [
          {
            msg: "Invalid token or session ID. Please log in again.",
          },
        ],
        "Invalid token.",
        401
      );
    }

    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      return response.errorResponse(
        res,
        { msg: "Admin not found." },
        "Invalid token.",
        401
      );
    }

    // Verify refresh token validity against password change timestamp
    // If password was changed after refresh token was issued, token is invalid
    if (admin.passwordChangedAt) {
      const refreshTokenIssuedAt = decoded.iat * 1000; // Convert to milliseconds
      const passwordChangedAt = new Date(admin.passwordChangedAt).getTime();
      
      if (refreshTokenIssuedAt < passwordChangedAt) {
        // Refresh token was issued before password change - invalidate session
        await Session.findByIdAndUpdate(session._id, { isActive: false });
        return response.errorResponse(
          res,
          { msg: "Your password has been changed. Please log in again." },
          "Invalid token.",
          401
        );
      }
    }

    const { accessToken, refreshToken, sessionID } = await generateTokens(
      admin
    );

    setAuthTokenCookie(res, accessToken);
    setAuthRefreshTokenCookie(res, refreshToken);

    return response.successResponse(
      res,
      { accessToken, refreshToken, sessionID, admin },
      "Token refreshed successfully."
    );
  } catch (err) {
    console.error("Error during token refresh:", err);
    return response.errorResponse(res, {}, "Invalid token.", 403);
  }
};

module.exports = adminRefreshToken;
