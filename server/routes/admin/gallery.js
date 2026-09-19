const express = require("express");
const router = express.Router();
const multer = require("multer");
const { AdminAuth } = require("../../middleware/auth");
const {
  createGalleryImage,
  getGalleryImages,
  updateGalleryImage,
  deleteGalleryImage,
} = require("./Controllers/GalleryController");

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

// @route POST api/admin/gallery
// @desc Upload a new gallery image
// @access Private (Admin)
router.post("/", AdminAuth, upload.single("image"), createGalleryImage);

// @route GET api/admin/gallery
// @desc Get all gallery images (with optional category filter)
// @access Private (Admin)
router.get("/", AdminAuth, getGalleryImages);

// @route PUT api/admin/gallery/:id
// @desc Update gallery image
// @access Private (Admin)
router.put("/:id", AdminAuth, updateGalleryImage);

// @route DELETE api/admin/gallery/:id
// @desc Delete gallery image
// @access Private (Admin)
router.delete("/:id", AdminAuth, deleteGalleryImage);

module.exports = router;

