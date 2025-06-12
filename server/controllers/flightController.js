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

  // Generate flights for each day in the range
  const startDate = new Date(flight.departureDate);
  const endDate = new Date(flight.returnDate || flight.departureDate);
  
  // Generate 2-3 flights per day
  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const flightsPerDay = Math.floor(Math.random() * 2) + 2; // 2-3 flights per day
    
    for (let i = 0; i < flightsPerDay; i++) {
      const airline = airlines[Math.floor(Math.random() * airlines.length)];
      const basePrice = Math.floor(Math.random() * 1000) + 500; // Random price between 500-1500
      
      // Generate random departure time between 6 AM and 10 PM
      const departureHour = Math.floor(Math.random() * 16) + 6; // 6-22
      const departureMinute = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45
      
      const departureTime = new Date(date);
      departureTime.setHours(departureHour, departureMinute, 0, 0);
      
      // Calculate arrival time (2-12 hours later)
      const flightDuration = Math.floor(Math.random() * 10) + 2; // 2-12 hours
      const arrivalTime = new Date(departureTime);
      arrivalTime.setHours(arrivalTime.getHours() + flightDuration);
      
      results.push({
        flightId: `FL-${Math.floor(Math.random() * 10000)}`,
        airline,
        departureAirport: flight.from,
        arrivalAirport: flight.to,
        departureTime: departureTime.toISOString(),
        arrivalTime: arrivalTime.toISOString(),
        duration: `${flightDuration}h ${Math.floor(Math.random() * 60)}m`,
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
  }

  return results;
}

// @desc    Create a new flight booking
// @route   POST /api/flights
// @access  Private
exports.createFlightBooking = asyncHandler(async (req, res, next) => {
  const {
    flightDetails,
    passengers,
    amount
  } = req.body;

  // Generate a unique booking ID
  const bookingId = `FL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const booking = await FlightBooking.create({
    userId: req.user.id,
    bookingId,
    customerName: req.user.name,
    customerEmail: req.user.email,
    flightDetails,
    passengers,
    amount,
    status: 'pending',
    paymentStatus: 'pending'
  });

  res.status(201).json({
    success: true,
    data: booking
  });
});

// @desc    Get all flight bookings for the logged-in user
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

// @desc    Get single flight booking
// @route   GET /api/flights/bookings/:id
// @access  Private
exports.getFlightBookingById = asyncHandler(async (req, res, next) => {
  const booking = await FlightBooking.findOne({
    _id: req.params.id,
    userId: req.user.id
  });

  if (!booking) {
    return res.status(404).json({
      success: false,
      error: 'Booking not found'
    });
  }

  res.status(200).json({
    success: true,
    data: booking
  });
});

// @desc    Update flight booking
// @route   PUT /api/flights/bookings/:id
// @access  Private
exports.updateFlightBooking = asyncHandler(async (req, res, next) => {
  let booking = await FlightBooking.findOne({
    _id: req.params.id,
    userId: req.user.id
  });

  if (!booking) {
    return res.status(404).json({
      success: false,
      error: 'Booking not found'
    });
  }

  // Only allow updating certain fields
  const allowedUpdates = ['passengers', 'flightDetails'];
  const updates = Object.keys(req.body)
    .filter(key => allowedUpdates.includes(key))
    .reduce((obj, key) => {
      obj[key] = req.body[key];
      return obj;
    }, {});

  booking = await FlightBooking.findByIdAndUpdate(
    req.params.id,
    updates,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    data: booking
  });
});

// @desc    Delete flight booking
// @route   DELETE /api/flights/bookings/:id
// @access  Private
exports.deleteFlightBooking = asyncHandler(async (req, res, next) => {
  const booking = await FlightBooking.findOne({
    _id: req.params.id,
    userId: req.user.id
  });

  if (!booking) {
    return res.status(404).json({
      success: false,
      error: 'Booking not found'
    });
  }

  // Only allow deletion if booking is pending
  if (booking.status !== 'pending') {
    return res.status(400).json({
      success: false,
      error: 'Can only delete pending bookings'
    });
  }

  await booking.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});
