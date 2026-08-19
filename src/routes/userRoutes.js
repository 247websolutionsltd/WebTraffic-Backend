const express = require("express");

const router = express.Router();

const upload = require("../middleware/uploadMiddleware");

const {
  updateProfileImage,
} = require("../controllers/userController");

const protect = require("../middleware/authMiddleware");

router.post(
  "/profile-image",
  protect,
  upload.single("profileImage"),
  updateProfileImage
);

module.exports = router;