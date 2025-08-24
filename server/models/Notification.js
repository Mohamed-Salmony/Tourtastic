const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  title: {
    en: {
      type: String,
      required: true
    },
    ar: {
      type: String,
      required: true
    }
  },
  message: {
    en: {
      type: String,
      required: true
    },
    ar: {
      type: String,
      required: true
    }
  },
  type: {
    type: String,
    enum: ["welcome", "booking", "payment", "profile", "cart", "system"],
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Notification", NotificationSchema); 