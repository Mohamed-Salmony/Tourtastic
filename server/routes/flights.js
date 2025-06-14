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
router.get("/search/:tripsString/:adults/:children/:infants", searchFlights);
router.get("/results/:search_id", getSearchResults);

// Protected routes for flight bookings
router.use(protect);
router.route("/bookings")
  .get(getUserFlightBookings)
  .post(createFlightBooking);

router.route("/bookings/:bookingId")
  .get(getFlightBookingById)
  .put(updateFlightBooking)
  .delete(deleteFlightBooking);

module.exports = router;
