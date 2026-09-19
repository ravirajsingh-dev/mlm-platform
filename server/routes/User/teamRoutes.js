const express = require("express");
const router = express.Router();
const { UserAuth } = require("../../middleware/auth");
const {
  getUserDownlineTree,
  getUserDirectDownline,
  getMyTeamList,
  // getMyLevelWiseTeamList,
  getLevelSummary,
  getLevelUsers,
  getMyLegList,
} = require("./Controllers/TeamController");

// @route GET api/users/downline/direct
// @desc Get the downline tree of a user
// @access Private
router.get("/direct", [UserAuth], getUserDirectDownline);

// @route GET api/users/downline/:user_id/direct
// @desc Get the direct downline (immediate children) of a user
// @access Private
router.get("/:user_id/structure", [UserAuth], getUserDownlineTree);

// @route GET api/users/downline/:user_id/direct
// @desc Get the direct downline (immediate children) of a user
// @access Private
router.get("/:user_id/my-team", [UserAuth], getMyTeamList);

// @route GET api/users/downline/:user_id/position
// @desc Get the Leg downline of a user
// @access Private
router.get("/leg/:user_id/:position", [UserAuth], getMyLegList);

// @route GET api/users/downline/:user_id/my-level-wise-team
// @desc Get the level wise team of a user
// @access Private
router.get("/level-summary/:user_id", [UserAuth], getLevelSummary);

// Get users by level (with pagination)
router.get("/level-users/:user_id/:level", [UserAuth], getLevelUsers);

module.exports = router;
