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
  "/:conversationId/messages",
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
  protect,
  getBuyerConversations
);

// Store inbox
router.get(
  "/store",
  protect,
  getStoreConversations
);

// Mark messages as read
router.patch(
  "/:conversationId/read",
  protect,
  markMessagesAsRead
);

module.exports = router;