const express = require("express");
const router = express.Router();
const { AdminAuth } = require("../../middleware/auth");
const { check } = require("express-validator");
const {
  fetchAdminDashboardData,
} = require("./Controllers/AdminDashboardController");

// @route GET api/admin/dashboard
// @desc Get Admin dashboard data
// @access Private
router.get("/dashboard", AdminAuth, fetchAdminDashboardData);

module.exports = router;
