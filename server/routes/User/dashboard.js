const express = require("express");
const router = express.Router();
const { UserAuth } = require("../../middleware/auth");

const { getDashboardStats } = require("./Controllers/DashboardController");

// @route GET api/dashboard/stats
// @desc Get dashboard statistics
// @access Private
router.get("/stats/:user_id", [UserAuth], getDashboardStats);

module.exports = router;
