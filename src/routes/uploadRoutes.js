const express = require("express");

const upload = require("../middleware/uploadMiddleware");
const protect = require("../middleware/authMiddleware");

const {
  uploadImage,
} = require("../controllers/uploadController");

const router = express.Router();

router.post(
  "/image",
  protect,
  upload.single("image"),
  uploadImage
);

module.exports = router;