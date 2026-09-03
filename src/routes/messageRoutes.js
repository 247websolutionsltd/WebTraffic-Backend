const express = require("express");

const router = express.Router();

const {
  createConversation,
  sendMessage,
  getMessages,
  getBuyerConversations,
  getStoreConversations,
  markMessagesAsRead,
} = require("../controllers/messageController");

const protect = require("../middleware/authMiddleware");

router.post(
  "/conversations",
  protect,
  createConversation
);

router.post(
  "/",
  protect,
  sendMessage
);

router.get(
  "/conversations/:conversationId",
  protect,
  getMessages
);

router.get(
  "/buyer",
  authMiddleware,
  getBuyerConversations
);

// Store inbox
router.get(
  "/store",
  authMiddleware,
  getStoreConversations
);

// Mark messages as read
router.patch(
  "/:conversationId/read",
  authMiddleware,
  markMessagesAsRead
);

module.exports = router;