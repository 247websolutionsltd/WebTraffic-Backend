const express = require("express");

const router = express.Router();

const {
  createStore,
  followStore,
  unfollowStore,
  getStores
} = require("../controllers/storeController");

const protect = require("../middleware/authMiddleware");

router.post("/", protect, createStore);
router.post(
  "/:storeId/follow",
  protect,
  followStore
);
router.delete(
  "/:storeId/follow",
  protect,
  unfollowStore
);

router.get("/", getStores);

module.exports = router;