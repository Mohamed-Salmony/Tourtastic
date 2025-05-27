const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema({
  // Custom, human-readable ID (e.g., BK-1001) - Consider generating this in the controller
  bookingId: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  // Denormalized for easy display in admin panel
  customerName: {
    type: String,
    required: true,
  },
  customerEmail: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true, // e.g., "Flight", "Hotel", "Flight + Hotel", "Tour Package"
    // Consider enum if types are fixed
  },
  destination: {
    // Optional, depending on booking type
    type: String,
  },
  bookingDate: {
    // Could be departure date for flights, check-in for hotels etc.
    type: Date,
    required: true,
  },
  details: {
    // Flexible object to store flight details (from user selection, not Seeru booking), hotel info, etc.
    type: Object,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "cancelled"],
    default: "pending",
  },
  // Info added by admin when processing the booking manually
  ticketInfo: {
    filePath: { type: String }, // Path to manually uploaded/generated PDF ticket
    notes: { type: String }, // Admin notes
    sentAt: { type: Date } // Timestamp when ticket was sent
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
BookingSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Middleware to update `updatedAt` field on findOneAndUpdate
// Need to handle this in the controller logic when using findOneAndUpdate

module.exports = mongoose.model("Booking", BookingSchema);
