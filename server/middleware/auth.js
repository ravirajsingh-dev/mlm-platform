const jwt = require("jsonwebtoken");
const { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET } = require("../config/config");
const Admin = require("../models/Admin");
const User = require("../models/User");
const Session = require("../models/Session");
const { generateTokens } = require("../utils/authUtils");

const verifyToken = async (req, res, next, role = null) => {
  const token = req.header("x-auth-token");
  const refreshToken = req.header("x-auth-refresh-token");
  const sessionID = req.header("x-session-id");

  if (!token || !refreshToken || !sessionID) {
    return res.status(401).json({
      msg: "No token or session ID provided. Authorization denied.",
      tokenStatus: 0,
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    req.user = decoded;
  } catch (err) {
    if (err.name !== "TokenExpiredError") {
      return res.status(401).json({ msg: "Invalid token", tokenStatus: 0 });
    }
  }

  try {
    // If access token is expired, decode refresh token to get user ID for session lookup
    let userIdForSession = null;
    if (!decoded) {
      try {
        const tempDecoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
        userIdForSession = tempDecoded.id;
      } catch (err) {
        // Will be handled later in refresh token verification
      }
    } else {
      userIdForSession = decoded.id;
    }

    const session = await Session.findOne({
      userID: userIdForSession,
      sessionID,
      refreshToken,
    });

    if (!session) {
      return res.status(401).json({
        msg: "Session not found or already logged in on another device.",
        tokenStatus: 0,
      });
    }

    if (!session.isActive) {
      return res.status(401).json({
        msg: "Invalid session. Authorization failed. Please log in again.",
        tokenStatus: 0,
      });
    }

    let user;
    // If token is expired, we need to decode refresh token first to get user ID
    if (!decoded) {
      try {
        const decodedRefreshToken = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
        if (decodedRefreshToken.role === 2) {
          user = await Admin.findById(decodedRefreshToken.id);
        } else {
          user = await User.findById(decodedRefreshToken.id);
        }
      } catch (refreshErr) {
        return res.status(401).json({
          msg: "Invalid refresh token. Please log in again.",
          tokenStatus: 0,
        });
      }
    } else if (decoded.role === 2) {
      user = await Admin.findById(decoded.id);
    } else {
      user = await User.findById(decoded.id);
    }

    if (!user) {
      return res.status(401).json({
        msg: "User not found. Authorization failed.",
        tokenStatus: 0,
      });
    }

    if (user.status === 2  ) {
      return res.status(403).json({
        msg: "User is not allowed to login. Contact Support.",
        tokenStatus: 0,
      });
    }

    // Verify token validity against password change timestamp
    // If password was changed after token was issued, token is invalid
    if (decoded && user.passwordChangedAt) {
      const tokenIssuedAt = decoded.iat * 1000; // Convert to milliseconds
      const passwordChangedAt = new Date(user.passwordChangedAt).getTime();
      
      if (tokenIssuedAt < passwordChangedAt) {
        // Token was issued before password change - invalidate session
        await Session.findByIdAndUpdate(session._id, { isActive: false });
        return res.status(401).json({
          msg: "Your password has been changed. Please log in again.",
          tokenStatus: 0,
        });
      }
    }

    if (decoded) {
      if (user.uuid !== decoded.uuid) {
        return res.status(401).json({ msg: "Invalid uuid", tokenStatus: 0 });
      }

      if (user.role === 2) {
        req.userObj = user;
        return next();
      }

      // Role check for user routes
      if (role !== null && user.role !== role) {
        return res.status(403).json({
          msg: "Insufficient permissions.",
          tokenStatus: 0,
        });
      }

      req.userObj = user;
      return next();
    }

    // If token is expired, verify the refresh token
    try {
      const decodedRefreshToken = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

      if (
        decodedRefreshToken.id !== user._id.toString() ||
        decodedRefreshToken.uuid !== user.uuid
      ) {
        return res
          .status(401)
          .json({ msg: "Invalid refresh token", tokenStatus: 0 });
      }

      // Verify refresh token validity against password change timestamp
      if (user.passwordChangedAt) {
        const refreshTokenIssuedAt = decodedRefreshToken.iat * 1000; // Convert to milliseconds
        const passwordChangedAt = new Date(user.passwordChangedAt).getTime();
        
        if (refreshTokenIssuedAt < passwordChangedAt) {
          // Refresh token was issued before password change - invalidate session
          await Session.findByIdAndUpdate(session._id, { isActive: false });
          return res.status(401).json({
            msg: "Your password has been changed. Please log in again.",
            tokenStatus: 0,
          });
        }
      }

      const newTokens = await generateTokens(user);
      res.setHeader("x-auth-token", newTokens.accessToken);
      res.setHeader("x-auth-refresh-token", newTokens.refreshToken);
      res.setHeader("x-session-id", newTokens.sessionID);

      req.user = jwt.verify(newTokens.accessToken, JWT_ACCESS_SECRET);
      req.userObj = user;
      return next();
    } catch (refreshError) {
      console.error("Refresh token verification error:", refreshError);
      return res.status(401).json({
        msg: "Refresh token is invalid or expired. Please log in again.",
        tokenStatus: 0,
      });
    }
  } catch (err) {
    console.error("Token verification error:", err);
    res.status(500).json({ msg: "Server Error", tokenStatus: 0 });
  }
};

const AdminAuth = (req, res, next) => verifyToken(req, res, next, 2);
const UserAuth = (req, res, next) => verifyToken(req, res, next, 1);
const Common = (req, res, next) => verifyToken(req, res, next);

module.exports = {
  AdminAuth,
  UserAuth,
  Common,
};
