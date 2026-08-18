const express = require("express");

const {
  createListing,
  getListings,
  getListing,
} = require("../controllers/listingController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getListings);

router.get("/:id", getListing);

router.post("/", protect, createListing);

module.exports = router;