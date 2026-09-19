const multer = require("multer");
const path = require("path");
const fs = require("fs");

function configureMulter(options) {
  const destination = options.destination || "../public"; // Default destination folder

  // Multer disk storage configuration
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = path.join(
        __dirname,
        destination,
        getFileTypeFolder(file)
      );

      // Create the directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname));
    },
  });

  // Function to check file type
  function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif|mp4|mov|avi/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb("Error: Images or Videos only!");
    }
  }

  // Function to get folder based on file type
  function getFileTypeFolder(file) {
    if (file.mimetype.includes("image")) {
      return "images";
    } else if (file.mimetype.includes("video")) {
      return "videos";
    }
    return "";
  }

  // Multer middleware initialization for both images and videos
  const upload = multer({
    storage: storage,
    limits: options.limits || { fileSize: 1000000 }, // Set default file size limit if not provided
    fileFilter:
      options.fileFilter ||
      function (req, file, cb) {
        checkFileType(file, cb);
      },
  });

  // Separate upload functions for images and videos
  const uploadImage = upload.single(options.imageFieldName || "imageFile"); // Set default field name if not provided
  const uploadVideo = upload.single(options.videoFieldName || "videoFile"); // Set default field name if not provided

  return { uploadImage, uploadVideo };
}

module.exports = configureMulter;
