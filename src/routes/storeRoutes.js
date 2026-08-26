const express = require("express");

const router = express.Router();

const {
  createStore,
  followStore,
  unfollowStore,
  getStores,
  getMyStore
} = require("../controllers/storeController");

const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.post("/", protect, upload.single("image"), createStore);
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

router.get(
  "/my-store",
  protect,
  getMyStore
);

router.get("/", getStores);

module.exports = router;