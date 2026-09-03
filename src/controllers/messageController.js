const Conversation = require("../models/Conversation");
const Listing = require("../models/Listing");
const Message = require("../models/Message");
const Store = require("../models/Store");

const createConversation = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { listingId } = req.body;

    if (!listingId) {
      return res.status(400).json({
        message: "Listing ID is required",
      });
    }

    const listing = await Listing.findById(listingId);

    if (!listing) {
      return res.status(404).json({
        message: "Listing not found",
      });
    }

    const storeId = listing.store;

    if (!storeId) {
      return res.status(400).json({
        message: "This listing does not belong to a store",
      });
    }

    const existingConversation = await Conversation.findOne({
      buyer: buyerId,
      store: storeId,
      listing: listingId,
    });

    if (existingConversation) {
      return res.status(200).json({
        success: true,
        conversation: existingConversation,
      });
    }

    const conversation = await Conversation.create({
      buyer: buyerId,
      store: storeId,
      listing: listingId,
    });

    return res.status(201).json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error("CREATE CONVERSATION ERROR:", error);

    return res.status(500).json({
      message: "Failed to create conversation",
    });
  }
};



const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;

    const {
      conversationId,
      text,
    } = req.body;

    if (!conversationId || !text?.trim()) {
      return res.status(400).json({
        message: "Conversation and message are required",
      });
    }

    const conversation =
      await Conversation.findById(
        conversationId
      );

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    // Make sure sender belongs to conversation
    const isParticipant =
      conversation.buyer.toString() ===
        senderId.toString() ||
      conversation.sender.toString() ===
        senderId.toString();

    if (!isParticipant) {
      return res.status(403).json({
        message: "You are not part of this conversation",
      });
    }
    console.log(text)
    const message = await Message.create({
      conversation: conversationId,
      sender: senderId,
      text: text.trim(),
    });

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.lastMessageAt =
      message.createdAt;

    await conversation.save();

    const populatedMessage =
      await Message.findById(message._id)
        .populate(
          "sender",
          "firstName lastName profileImage"
        );

    return res.status(201).json({
      message: populatedMessage,
    });

  } catch (error) {
    console.error(
      "SEND MESSAGE ERROR:",
      error
    );

    return res.status(500).json({
      message: "Failed to send message",
    });
  }
};

const getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    const conversation =
      await Conversation.findById(
        conversationId
      );

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    const isParticipant =
      conversation.buyer.toString() ===
        userId.toString() ||
      conversation.seller.toString() ===
        userId.toString();

    if (!isParticipant) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const messages =
      await Message.find({
        conversation: conversationId,
      })
        .populate(
          "sender",
          "firstName lastName profileImage"
        )
        .sort({
          createdAt: 1,
        });

    return res.status(200).json({
      messages,
    });

  } catch (error) {
    console.error(
      "GET MESSAGES ERROR:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch messages",
    });
  }
};

const getMyConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await Conversation.find({
      buyer: userId,
    })
      .populate("buyer", "firstName lastName profileImage")
      .populate("store")
      .populate("listing", "title price images")
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error("GET CONVERSATIONS ERROR:", error);

    return res.status(500).json({
      message: "Failed to get conversations",
    });
  }
};


const getBuyerConversations = async (req, res) => {
  try {
    const buyerId = req.user.id;

    const conversations = await Conversation.find({
      buyer: buyerId,
    })
      .populate("buyer", "firstName lastName profileImage")
      .populate("store", "name logo")
      .populate("listing", "title price images")
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error("GET BUYER CONVERSATIONS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get buyer conversations",
    });
  }
};

const getStoreConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find the store owned by the logged-in user
    const store = await Store.findOne({
      owner: userId,
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "You don't have a store",
      });
    }

    // Find all conversations sent to this store
    const conversations = await Conversation.find({
      store: store._id,
    })
      .populate("buyer", "firstName lastName profileImage")
      .populate("store", "name logo")
      .populate("listing", "title price images")
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      store,
      conversations,
    });
  } catch (error) {
    console.error("GET STORE CONVERSATIONS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get store conversations",
    });
  }
};

const markMessagesAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const isBuyer =
      conversation.buyer.toString() === userId.toString();

    let isStoreOwner = false;

    if (!isBuyer) {
      const store = await Store.findOne({
        _id: conversation.store,
        owner: userId,
      });

      if (store) {
        isStoreOwner = true;
      }
    }

    if (!isBuyer && !isStoreOwner) {
      return res.status(403).json({
        success: false,
        message: "You are not part of this conversation",
      });
    }

    // Only mark messages sent by the OTHER person as read
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: userId },
        read: false,
      },
      {
        $set: {
          read: true,
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Messages marked as read",
    });
  } catch (error) {
    console.error("MARK MESSAGES READ ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark messages as read",
    });
  }
};

module.exports = {
  createConversation,
  sendMessage,
  getMessages,
  getMyConversations,
  getBuyerConversations,
  getStoreConversations,
  markMessagesAsRead
};