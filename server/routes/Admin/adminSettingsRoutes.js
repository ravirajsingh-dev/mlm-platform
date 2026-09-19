const express = require("express");
const router = express.Router();
const multer = require("multer");
const { AdminAuth } = require("../../middleware/auth");
const {
  getCommonSettings,
  updateCommonSettings,
} = require("./Controllers/AdminSettingsController");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const isPdf =
      file.mimetype === "application/pdf" ||
      require("path").extname(file.originalname).toLowerCase() === ".pdf";
    if (!isPdf) {
      return cb(new Error("Only PDF files are allowed"));
    }
    return cb(null, true);
  },
});

// @route GET api/admin/settings
// @desc Get common settings (auto-creates if not found)
// @access Private (Admin only)
router.get("/settings", AdminAuth, getCommonSettings);

// @route PUT api/admin/settings
// @desc Update common settings
// @access Private (Admin only)
router.put(
  "/settings",
  AdminAuth,
  upload.single("planPdf"),
  updateCommonSettings
);

module.exports = router;

