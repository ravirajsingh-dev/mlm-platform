const express = require("express");
const router = express.Router();

const {
  getUsersList,
  getAdminDetails,
  getDashboardDetails,
  EPIDDetails,
  getSevaKendrasList,
  getPublicCommonSettings,
} = require("./Controllers/CommonController");
const {
  getPublicSliderBanners,
} = require("../admin/Controllers/SliderController");
const {
  getPublicGalleryImages,
} = require("../admin/Controllers/GalleryController");
const {
  getActiveDonationButtons,
  getDonationSettings,
  generateDonationQRCode,
  submitDonationRequest,
} = require("./Controllers/DonationController");
const { check } = require("express-validator");
const { isEmailValid } = require("../../utils/helper");
const { AdminAuth, UserAuth } = require("../../middleware/auth");

// @route GET api/common/users-list
// @desc Get Users list
// @access Private
router.get("/users-list", [AdminAuth], getUsersList);

///////////////////////// User Side /////////////////////////////////////////////////////////////////

// @route GET /api/common/admin/details
// @desc Get admin info
// @access Public
router.get("/admin/details", [], getAdminDetails);

// @route GET /api/common/admin/details
// @desc Get admin info
// @access Public
router.get("/user/:e2e_id", [], EPIDDetails);

// @route GET /api/common/seva-kendra
// @desc Get seva kendar
// @access Public
router.get("/seva-kendra", getSevaKendrasList);

// @route GET /api/common/dashboard-stash
// @desc Get Dashboard info
// @access Public
router.get("/dashboard-stash/:user_id", [UserAuth], getDashboardDetails);

// @route GET /api/common/settings
// @desc Get public common settings (marquee settings only)
// @access Public
router.get("/settings", [], getPublicCommonSettings);

// @route GET /api/common/slider-banners
// @desc Get active slider banners
// @access Public
router.get("/slider-banners", getPublicSliderBanners);

// @route GET /api/common/gallery
// @desc Get active gallery images
// @access Public
router.get("/gallery", getPublicGalleryImages);

// @route GET /api/common/donation/buttons
// @desc Get active donation buttons
// @access Public
router.get("/donation/buttons", getActiveDonationButtons);

// @route GET /api/common/donation/settings
// @desc Get donation settings
// @access Public
router.get("/donation/settings", getDonationSettings);

// @route POST /api/common/donation/generate-qr
// @desc Generate QR code for donation amount
// @access Public
router.post(
  "/donation/generate-qr",
  [
    check("amount", "Amount is required")
      .isNumeric()
      .withMessage("Amount must be a number")
      .custom((value) => {
        if (value <= 0) {
          throw new Error("Amount must be greater than 0");
        }
        return true;
      }),
  ],
  generateDonationQRCode
);

// @route POST /api/common/donation/request
// @desc Submit donation request
// @access Public
router.post(
  "/donation/request",
  [
    check("donorName", "Donor name is required")
      .trim()
      .notEmpty()
      .withMessage("Donor name cannot be empty")
      .isLength({ min: 2, max: 150 })
      .withMessage("Donor name must be between 2 and 150 characters"),
    check("phone", "Phone number is required")
      .trim()
      .notEmpty()
      .withMessage("Phone number cannot be empty")
      .isMobilePhone("any", { strictMode: false })
      .withMessage("Invalid phone number format"),
    check("email", "Email is required")
      .trim()
      .notEmpty()
      .withMessage("Email cannot be empty")
      .custom((value) => {
        if (!isEmailValid(value)) {
          throw new Error("Invalid email format");
        }
        return true;
      }),
    check("amount", "Amount is required")
      .isNumeric()
      .withMessage("Amount must be a number")
      .custom((value) => {
        if (value <= 0) {
          throw new Error("Amount must be greater than 0");
        }
        return true;
      }),
    check("utrNumber", "UTR number is required")
      .trim()
      .notEmpty()
      .withMessage("UTR number cannot be empty"),
    check("paymentMode", "Payment mode is required")
      .isIn(["UPI", "BANK"])
      .withMessage("Payment mode must be either UPI or BANK"),
  ],
  submitDonationRequest
);

module.exports = router;
