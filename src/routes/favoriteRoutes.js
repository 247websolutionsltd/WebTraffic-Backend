const express = require("express");

const router = express.Router();

const {
  toggleFavorite,
  clearFavorites,
} = require("../controllers/favoriteController");

const protect = require("../middleware/authMiddleware");

router.post(
  "/:listingId",
  protect,
  toggleFavorite
);

router.delete("/", protect, clearFavorites);

module.exports = router;