const express = require("express");
const {
  searchFlights,
  getSearchResults,
  createFlightBooking,
  getUserFlightBookings,
  getFlightBookingById,
  updateFlightBooking,
  deleteFlightBooking
} = require("../controllers/flightController");

const { protect } = require("../middleware/auth");

const router = express.Router();

// Public routes for searching flights
router.get("/search", searchFlights);
router.get("/results/:search_id", getSearchResults);

// Protected routes for managing bookings
router.use(protect); // Apply protection to all routes below

router.post("/book", createFlightBooking);
router.get("/bookings", getUserFlightBookings);
router.get("/bookings/:id", getFlightBookingById);
router.put("/bookings/:id", updateFlightBooking);
router.delete("/bookings/:id", deleteFlightBooking);

module.exports = router;
