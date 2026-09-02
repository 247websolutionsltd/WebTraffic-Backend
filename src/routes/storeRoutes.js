const express = require("express");

const router = express.Router();

const {
  createStore,
  followStore,
  unfollowStore,
  getStores,
  getMyStore,
  getStoreById,
} = require("../controllers/storeController");
const {getStoreConversations} = require("../controllers/messageController");

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

router.get("/conversations", getStoreConversations);

router.get("/:id", getStoreById);

router.get("/my-store", protect, getMyStore);

router.get("/", getStores);

module.exports = router;