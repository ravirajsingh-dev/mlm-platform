const express = require("express");
const router = express.Router();

// ============================================
// ADMIN ROUTES
// ============================================
router.use("/api/auth/admin", require("./AdminAuth/authAdmin"));
router.use("/api/admin", require("./Admin/adminDashboard"));
router.use("/api/admin/users", require("./Admin/adminUsers"));
router.use("/api/admin/help-link", require("./Admin/adminHelpLinks"));
router.use("/api/admin/e-pins", require("./Admin/adminEPinRoutes"));
router.use(
  "/api/admin/first-pay-user",
  require("./Admin/adminFirstPayUserRoutes")
);
router.use("/api/admin/seva-kendra", require("./Admin/sevaKendraRoutes"));
router.use("/api/admin", require("./Admin/adminSettingsRoutes"));
router.use("/api/admin/wallet", require("./Admin/adminWalletRoutes"));
router.use("/api/admin/withdrawal", require("./Admin/adminWithdrawalRoutes"));
router.use("/api/admin/slider", require("./admin/slider"));
router.use("/api/admin/gallery", require("./admin/gallery"));
router.use("/api/admin/donation", require("./Admin/donationRoutes"));

// ============================================
// SUB-ADMIN ROUTES
// ============================================
// (No sub-admin routes currently)

// ============================================
// USER ROUTES
// ============================================
router.use("/api/auth/users", require("./Auth/register"));
router.use("/api/auth", require("./Auth/authUser"));
router.use("/api/users", require("./User/users"));
router.use("/api/user/help-link", require("./User/helpLinks"));
router.use("/api/user/upgrade", require("./User/upgradeRoutes"));
router.use("/api/wallet", require("./User/walletRoutes"));
router.use("/api/withdrawal", require("./User/withdrawalRoutes"));
router.use("/api/users/dashboard", require("./User/dashboard"));
router.use("/api/users/downline", require("./User/teamRoutes"));
router.use("/api/user/e-pins", require("./User/ePinRoutes"));

// ============================================
// COMMON ROUTES
// ============================================
router.use("/api/common", require("./Admin/commonRoutes"));

module.exports = router;

