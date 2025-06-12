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
  description: {
    type: String,
    required: [true, "Please add a description"],
  },
  rating: {
    type: Number,
    required: [true, "Please add a rating"],
    min: 0,
    max: 5,
  },
  image: {
    type: String,
    required: [true, "Please add an image URL"],
  },
  topAttractions: [{
    type: String,
  }],
  localCuisine: [{
    type: String,
  }],
  shopping: [{
    type: String,
  }],
  bestTimeToVisit: {
    type: String,
    required: [true, "Please add best time to visit"],
  },
  quickInfo: {
    airport: {
      type: String,
      required: [true, "Please add airport code"],
    },
    timeZone: {
      type: String,
      required: [true, "Please add time zone"],
    },
  },
  popular: {
    type: Boolean,
    default: false,
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
