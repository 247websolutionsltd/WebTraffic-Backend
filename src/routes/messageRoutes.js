const express = require("express");

const router = express.Router();

const {
  createConversation,
  sendMessage,
  getMessages,
  getMyConversations
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
  "/conversations",
  protect,
  getMyConversations
);

module.exports = router;