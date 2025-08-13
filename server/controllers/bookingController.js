const Booking = require("../models/Booking");
const User = require("../models/User"); // Needed to get user details
const asyncHandler = require("../middleware/asyncHandler");

// Helper function to generate a unique booking ID (Example: BK-1001)
async function generateBookingId() {
  const lastBooking = await Booking.findOne().sort({ createdAt: -1 });
  let nextIdNumber = 1001;
  if (lastBooking && lastBooking.bookingId) {
    const lastIdNumber = parseInt(lastBooking.bookingId.split("-")[1]);
    if (!isNaN(lastIdNumber)) {
      nextIdNumber = lastIdNumber + 1;
    }
  }
  return `BK-${nextIdNumber}`;
}

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private (User must be logged in)
exports.createBooking = asyncHandler(async (req, res, next) => {
  // Get user from protect middleware
  const user = await User.findById(req.user.id);

  if (!user) {
    // Should not happen if protect middleware works, but good practice
    return res.status(401).json({ success: false, message: "User not found" });
  }

  const { flightDetails } = req.body;

  // Basic validation for flight bookings
  if (!flightDetails || !flightDetails.selectedFlight) {
    return res.status(400).json({ success: false, message: "Missing required flight booking details" });
  }

  // Extract flight details
  const {
    from,
    to,
    departureDate,
    passengers,
    selectedFlight
  } = flightDetails;

  // Format the booking details
  const bookingData = {
    type: 'Flight',
    destination: `${from} to ${to}`,
    bookingDate: new Date(departureDate),
    details: {
      from,
      to,
      departureDate,
      passengers,
      flight: selectedFlight
    },
    amount: selectedFlight.price.total,
  };

  // Generate a unique booking ID
  const bookingId = await generateBookingId();

  const booking = await Booking.create({
    bookingId,
    userId: req.user.id,
    customerName: user.name, // Denormalize user name
    customerEmail: user.email, // Denormalize user email
    type,
    destination, // Optional based on type
    bookingDate,
    details, // Contains flight/hotel specifics from user selection
    amount,
    status: "pending", // Initial status
  });

  res.status(201).json({
    success: true,
    data: booking,
  });
});

// @desc    Get bookings for the logged-in user
// @route   GET /api/bookings/my
// @access  Private
exports.getMyBookings = asyncHandler(async (req, res, next) => {
  const bookings = await Booking.find({ userId: req.user.id }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: bookings.length,
    data: bookings,
  });
});

// Note: Admin booking management (get all, get by ID, update, delete) will be in adminController
