const express = require("express");

const router = express.Router();

const upload = require("../middleware/uploadMiddleware");

const {
  updateProfileImage,
  getUserById
} = require("../controllers/userController");

const protect = require("../middleware/authMiddleware");

router.post(
  "/profile-image",
  protect,
  upload.single("profileImage"),
  updateProfileImage
);

router.get("/:id", getUserById);

module.exports = router;