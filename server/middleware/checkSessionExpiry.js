const Session = require("../models/Session");
const response = require("../config/response");

const checkSessionExpiry = async (req, res, next) => {
  try {
    const sessionID = req.header("x-session-id");
    if (!sessionID) {
      return res
        .status(400)
        .json({ error: "x-session-id header is missing test" });
    }

    const session = await Session.findOne({ sessionID });

    if (!session) {
      return response.errorResponse(
        res,
        { msg: "Already logged in on another device." },
        "Invalid Session.",
        401
      );
    }

    if (session && session.refreshTokenExpiresAt < new Date()) {
      session.isActive = false;
      await session.save();
    }

    next();
  } catch (err) {
    console.error("Session expiry check error:", err);
    next(err);
  }
};

module.exports = { checkSessionExpiry };
