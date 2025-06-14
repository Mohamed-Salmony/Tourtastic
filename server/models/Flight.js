const mongoose = require("mongoose");

const FlightSegmentSchema = new mongoose.Schema({
  from: {
    type: String,
    required: true
  },
  to: {
    type: String,
    required: true
  },
  departureDate: {
    type: Date,
    required: true
  }
});

const FlightSchema = new mongoose.Schema({
  searchId: {
    type: String,
    required: true,
    unique: true
  },
  segments: [FlightSegmentSchema],
  adults: {
    type: Number,
    required: true,
    min: 1
  },
  children: {
    type: Number,
    default: 0
  },
  infants: {
    type: Number,
    default: 0
  },
  searchResults: {
    type: Array,
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600 // Automatically delete after 1 hour
  }
});

module.exports = mongoose.model("Flight", FlightSchema);
