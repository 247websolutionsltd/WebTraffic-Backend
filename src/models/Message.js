const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      default: null,
    },

    text: {
      type: String,
      trim: true,
      required: true,
    },

    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({
  conversation: 1,
  createdAt: 1,
});

module.exports = mongoose.model(
  "Message",
  messageSchema
);