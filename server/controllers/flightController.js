const Flight = require("../models/Flight");
const FlightBooking = require("../models/FlightBooking");
const asyncHandler = require("../middleware/asyncHandler");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

// @desc    Simulate a flight search without actual API calls
// @route   GET /api/flights/search?from=...&to=...&departureDate=...&returnDate=...&adults=...&children=...&infants=...
// @access  Public
exports.searchFlights = asyncHandler(async (req, res, next) => {
  const { from, to, departureDate, returnDate, adults = 1, children = 0, infants = 0 } = req.query;

  // Basic validation
  if (!from || !to || !departureDate || !adults) {
    return res.status(400).json({ success: false, message: "Missing required search parameters (from, to, departureDate, adults)" });
  }

  // Generate a unique search ID
  const searchId = uuidv4();

  // Create a flight search record
  const flightSearch = await Flight.create({
    searchId,
    from,
    to,
    departureDate,
    returnDate,
    adults: parseInt(adults),
    children: parseInt(children),
    infants: parseInt(infants),
    searchResults: [] // Will be populated with mock data in getSearchResults
  });

  res.status(200).json({
    success: true,
    message: "Flight search initiated",
    data: {
      searchId,
      status: "pending"
    }
  });
});

// @desc    Get flight search results
// @route   GET /api/flights/results/:search_id
// @access  Public
exports.getSearchResults = asyncHandler(async (req, res, next) => {
  const { search_id } = req.params;

  if (!search_id) {
    return res.status(400).json({ success: false, message: "Search ID is required" });
  }

  const flight = await Flight.findOne({ searchId: search_id });
  if (!flight) {
    return res.status(404).json({ success: false, message: "Search not found" });
  }

  // Generate mock flight results based on the search parameters
  const mockResults = generateMockFlightResults(flight);
  
  // Update the flight record with mock results
  flight.searchResults = mockResults;
  await flight.save();

  res.status(200).json({
    success: true,
    data: {
      flights: mockResults
    }
  });
});

// Helper function to generate mock flight results
function generateMockFlightResults(flight) {
  const airlines = ["Emirates", "Qatar Airways", "Turkish Airlines", "Egypt Air", "Saudi Airlines"];
  const results = [];

  // Generate 3-5 random flight options
  const numResults = Math.floor(Math.random() * 3) + 3;
  
  for (let i = 0; i < numResults; i++) {
    const airline = airlines[Math.floor(Math.random() * airlines.length)];
    const basePrice = Math.floor(Math.random() * 1000) + 500; // Random price between 500-1500
    
    results.push({
      flightId: `FL-${Math.floor(Math.random() * 10000)}`,
      airline,
      departureAirport: flight.from,
      arrivalAirport: flight.to,
      departureTime: new Date(flight.departureDate).toISOString(),
      arrivalTime: new Date(new Date(flight.departureDate).getTime() + Math.random() * 86400000).toISOString(), // Random arrival within 24h
      duration: `${Math.floor(Math.random() * 8) + 2}h ${Math.floor(Math.random() * 60)}m`,
      price: {
        adult: basePrice,
        child: Math.floor(basePrice * 0.75),
        infant: Math.floor(basePrice * 0.1),
        total: basePrice * flight.adults + 
               (basePrice * 0.75) * flight.children + 
               (basePrice * 0.1) * flight.infants
      },
      availableSeats: Math.floor(Math.random() * 50) + 10,
      class: ["Economy", "Business"][Math.floor(Math.random() * 2)],
      layovers: Math.random() > 0.5 ? [{
        airport: ["DXB", "DOH", "IST"][Math.floor(Math.random() * 3)],
        duration: `${Math.floor(Math.random() * 3) + 1}h`
      }] : []
    });
  }

  return results;
}

// @desc    Create a new flight booking request
// @route   POST /api/flights/book
// @access  Private
exports.createFlightBooking = asyncHandler(async (req, res, next) => {
  const {
    flightDetails,
    customerPhone
  } = req.body;

  if (!flightDetails || !flightDetails.selectedFlight) {
    return res.status(400).json({ success: false, message: "Selected flight details are required" });
  }

  // Generate a booking ID (FB for Flight Booking)
  const bookingId = `FB-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`;

  const booking = await FlightBooking.create({
    bookingId,
    userId: req.user.id,
    customerName: req.user.name,
    customerEmail: req.user.email,
    customerPhone,
    flightDetails,
    status: "pending",
    timeline: [{
      status: "pending",
      date: new Date(),
      notes: "Booking request submitted",
      updatedBy: req.user.name
    }]
  });

  // Here you might want to send notifications to admins about new booking

  res.status(201).json({
    success: true,
    message: "Flight booking request submitted successfully",
    data: booking
  });
});

// @desc    Get user's flight bookings
// @route   GET /api/flights/bookings
// @access  Private
exports.getUserFlightBookings = asyncHandler(async (req, res, next) => {
  const bookings = await FlightBooking.find({ userId: req.user.id })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: bookings.length,
    data: bookings
  });
});

// @desc    Get a specific flight booking
// @route   GET /api/flights/bookings/:bookingId
// @access  Private
exports.getFlightBooking = asyncHandler(async (req, res, next) => {
  const booking = await FlightBooking.findOne({ 
    bookingId: req.params.bookingId,
    userId: req.user.id
  });

  if (!booking) {
    return res.status(404).json({ success: false, message: "Booking not found" });
  }

  res.status(200).json({
    success: true,
    data: booking
  });
});

// @desc    Cancel a flight booking
// @route   PUT /api/flights/bookings/:bookingId/cancel
// @access  Private
exports.cancelFlightBooking = asyncHandler(async (req, res, next) => {
  const booking = await FlightBooking.findOne({ 
    bookingId: req.params.bookingId,
    userId: req.user.id
  });

  if (!booking) {
    return res.status(404).json({ success: false, message: "Booking not found" });
  }

  // Only allow cancellation of pending bookings
  if (booking.status !== "pending") {
    return res.status(400).json({ 
      success: false, 
      message: "Only pending bookings can be cancelled" 
    });
  }

  booking.status = "cancelled";
  booking.timeline.push({
    status: "cancelled",
    date: new Date(),
    notes: "Cancelled by user",
    updatedBy: req.user.name
  });

  await booking.save();

  res.status(200).json({
    success: true,
    message: "Booking cancelled successfully",
    data: booking
  });
});
