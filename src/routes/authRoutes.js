const express = require("express");

const {
  register,
  login,
  googleLogin,
  getUser,
  deleteAccount,
} = require("../controllers/authController");

const router = express.Router();
const protect = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);
router.get("/user", protect, getUser);
router.delete("/account", protect, deleteAccount);

module.exports = router;