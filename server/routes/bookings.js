const express = require("express");
const {
  createBooking,
  getMyBookings,
  getTicketUrl,
} = require("../controllers/bookingController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// All routes below are protected
router.use(protect);

router.route("/").post(createBooking);
router.route("/my").get(getMyBookings);

// Return a usable URL for an uploaded ticket (public or signed)
router.route('/:id/ticket-url').get(getTicketUrl);

const { deleteBooking, updateBooking } = require('../controllers/bookingController');
// Allow users to delete or update their own bookings
router.route('/:id').delete(protect, deleteBooking).patch(protect, updateBooking);

// Note: Admin routes for managing all bookings (GET /, GET /:id, PUT /:id, DELETE /:id)
// will be under /api/admin/bookings

module.exports = router;
