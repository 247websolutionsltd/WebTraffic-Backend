const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },

    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

conversationSchema.index(
  {
    buyer: 1,
    store: 1,
    listing: 1,
  },
  {
    unique: true,
  }
);


// Get the latest message for a conversation
conversationSchema.virtual("lastMessage", {
  ref: "Message",
  localField: "_id",
  foreignField: "conversation",
  justOne: true,

  options: {
    sort: {
      createdAt: -1,
    },
  },
});


// Make virtuals appear in JSON responses
conversationSchema.set("toJSON", {
  virtuals: true,
});

conversationSchema.set("toObject", {
  virtuals: true,
});

module.exports = mongoose.model(
  "Conversation",
  conversationSchema
);