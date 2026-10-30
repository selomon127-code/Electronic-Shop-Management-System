// backend/middleware/upload.js
const multer = require("multer");

// ✅ Store file in memory as a buffer (so we can stream it to Cloudinary in the route)
const storage = multer.memoryStorage();

// ✅ Security: Only allow image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (JPG, PNG, WEBP) are allowed!"), false);
  }
};

// ✅ Initialize Multer with 5MB limit
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
  fileFilter: fileFilter,
});

module.exports = upload;
