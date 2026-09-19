const express = require("express");
const router = express.Router();
const { UserAuth } = require("../../middleware/auth");
const { getLevelsList } = require("./Controllers/UpgradeController");

// @route GET api/user/upgrade/level/list
// @desc Get levels List
// @access Private
router.get("/level/list", [UserAuth], getLevelsList);

module.exports = router;
