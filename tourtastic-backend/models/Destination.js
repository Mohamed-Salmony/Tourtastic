const mongoose = require("mongoose");

const DestinationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add a destination name"],
    trim: true,
  },
  country: {
    type: String,
    required: [true, "Please add a country"],
    trim: true,
  },
  imageUrl: {
    type: String,
    // Add validation if needed, e.g., using a regex for URL format
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  description: {
    // Optional: Add a description field if needed for destination pages
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware to update `updatedAt` field on save
DestinationSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Destination", DestinationSchema);
