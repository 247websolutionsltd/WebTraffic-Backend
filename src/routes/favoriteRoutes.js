const express = require("express");

const router = express.Router();

const {
  toggleFavorite,
} = require("../controllers/favoriteController");

const protect = require("../middleware/authMiddleware");

router.post(
  "/:listingId",
  protect,
  toggleFavorite
);

module.exports = router;