const express = require("express");

const {
  createListing,
  getListings,
  getListing,
} = require("../controllers/listingController");

const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/", getListings);

router.get("/:id", getListing);

router.post("/", protect, upload.array("images", 6), createListing);

module.exports = router;