const express = require("express");
const {
  searchFlights,
  getSearchResults,
  createFlightBooking,
  getUserFlightBookings,
  getFlightBooking,
  cancelFlightBooking
} = require("../controllers/flightController");

const { protect } = require("../middleware/auth");

const router = express.Router();

// Public routes for searching flights
router.get("/search", searchFlights);
router.get("/results/:search_id", getSearchResults);

// Protected routes for managing bookings
router.post("/book", protect, createFlightBooking);
router.get("/bookings", protect, getUserFlightBookings);
router.get("/bookings/:bookingId", protect, getFlightBooking);
router.put("/bookings/:bookingId/cancel", protect, cancelFlightBooking);

module.exports = router;
