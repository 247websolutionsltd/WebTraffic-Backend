const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      select: false,
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    profileImage: {
      type: String,
      default: "",
    },

    phone: {
      type: String,
      default: "",
    },

    address: {
      street: {
        type: String,
        default: "",
      },

      city: {
        type: String,
        default: "",
      },

      state: {
        type: String,
        default: "",
      },

      country: {
        type: String,
        default: "",
      },

      postalCode: {
        type: String,
        default: "",
      },
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);