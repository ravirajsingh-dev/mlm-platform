const express = require("express");
const router = express.Router();
const multer = require("multer");
const { AdminAuth } = require("../../middleware/auth");
const {
  createSliderBanner,
  getSliderBanners,
  updateSliderBanner,
  deleteSliderBanner,
} = require("./Controllers/SliderController");

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(
    require("path").extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only jpg, jpeg, png, and webp images are allowed!"));
  }
};

// Multer middleware configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
  fileFilter: fileFilter,
});

// @route POST api/admin/slider
// @desc Create a new slider banner
// @access Private (Admin)
router.post("/", AdminAuth, upload.single("image"), createSliderBanner);

// @route GET api/admin/slider
// @desc Get all slider banners
// @access Private (Admin)
router.get("/", AdminAuth, getSliderBanners);

// @route PUT api/admin/slider/:id
// @desc Update slider banner
// @access Private (Admin)
router.put("/:id", AdminAuth, upload.single("image"), updateSliderBanner);

// @route DELETE api/admin/slider/:id
// @desc Delete slider banner
// @access Private (Admin)
router.delete("/:id", AdminAuth, deleteSliderBanner);

module.exports = router;

