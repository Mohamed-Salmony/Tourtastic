const express = require("express");
const {
  createBooking,
  getMyBookings,
} = require("../controllers/bookingController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// All routes below are protected
router.use(protect);

router.route("/").post(createBooking);
router.route("/my").get(getMyBookings);

// Note: Admin routes for managing all bookings (GET /, GET /:id, PUT /:id, DELETE /:id)
// will be under /api/admin/bookings

module.exports = router;
