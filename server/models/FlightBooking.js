const mongoose = require("mongoose");

const FlightBookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  bookingId: {
    type: String,
    required: true,
    unique: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  customerPhone: String,
  flightDetails: {
    departureCity: {
      type: String,
      required: true
    },
    arrivalCity: {
      type: String,
      required: true
    },
    departureDate: {
      type: Date,
      required: true
    },
    returnDate: {
      type: Date
    },
    airline: {
      type: String,
      required: true
    },
    flightNumber: {
      type: String,
      required: true
    }
  },
  passengers: [{
    name: String,
    age: Number,
    passportNumber: String
  }],
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "processing", "booked", "ticketed", "cancelled"],
    default: "pending"
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "refunded"],
    default: "pending"
  },
  ticketUrl: {
    type: String
  },
  adminData: {
    assignedTo: String,
    notes: String,
    bookingSource: String, // Where the admin actually booked the ticket
    bookingReference: String, // Reference number from the actual booking source
    cost: {
      amount: Number,
      currency: String
    },
    profit: Number
  },
  ticketDetails: {
    ticketNumber: String,
    airline: String,
    pnr: String,
    eTicketPath: String,
    additionalDocuments: [{
      name: String,
      path: String,
      uploadedAt: Date
    }]
  },
  paymentDetails: {
    status: {
      type: String,
      enum: ["pending", "partial", "completed", "refunded"],
      default: "pending"
    },
    amount: Number,
    currency: {
      type: String,
      default: "USD"
    },
    method: String,
    reference: String,
    transactions: [{
      date: Date,
      amount: Number,
      type: String, // payment, refund
      reference: String
    }]
  },
  timeline: [{
    status: String,
    date: Date,
    notes: String,
    updatedBy: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

FlightBookingSchema.pre("save", function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("FlightBooking", FlightBookingSchema);
