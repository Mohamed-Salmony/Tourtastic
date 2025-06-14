const Flight = require("../models/Flight");
const FlightBooking = require("../models/FlightBooking");
const asyncHandler = require("../middleware/asyncHandler");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

// @desc    Simulate a flight search without actual API calls
// @route   GET /api/flights/search/:tripsString/:adults/:children/:infants
// @access  Public
exports.searchFlights = asyncHandler(async (req, res, next) => {
  const { tripsString, adults, children, infants } = req.params;
  const { cabin = 'e', direct = 0 } = req.query;

  // Parse the trips string (format: ORIGIN-DESTINATION-DATE:ORIGIN-DESTINATION-DATE)
  const trips = tripsString.split(':').map(trip => {
    const [from, to, date] = trip.split('-');
    // Format the date if it's in YYYYMMDD format
    let formattedDate = date;
    if (date.length === 8) {
      formattedDate = `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}`;
    }
    // Validate date format
    const parsedDate = new Date(formattedDate);
    if (isNaN(parsedDate.getTime())) {
      throw new Error(`Invalid date format: ${date}. Expected format: YYYY-MM-DD or YYYYMMDD`);
    }
    return { from, to, date: parsedDate };
  });

  // Basic validation
  if (!trips.length || !adults) {
    return res.status(400).json({ success: false, message: "Missing required search parameters" });
  }

  // Validate each trip
  for (const trip of trips) {
    if (!trip.from || !trip.to || !trip.date) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid trip format. Each trip must have origin, destination, and date." 
      });
    }
  }

  // Generate a unique search ID
  const searchId = uuidv4();

  try {
    // Create a single flight search record with multiple segments
    const flightSearch = await Flight.create({
      searchId,
      segments: trips.map(trip => ({
        from: trip.from,
        to: trip.to,
        departureDate: trip.date
      })),
      adults: parseInt(adults),
      children: parseInt(children) || 0,
      infants: parseInt(infants) || 0
    });

    // Return response in Seeru API format
    res.status(200).json({
      search_id: searchId
    });
  } catch (error) {
    console.error('Error creating flight search:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create flight search. Please try again." 
    });
  }
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

  // Only generate results if they don't exist
  if (!flight.searchResults || flight.searchResults.length === 0) {
    const mockResults = generateMockFlightResults(flight);
    flight.searchResults = mockResults;
    await flight.save();
  }

  // Return response in Seeru API format
  res.status(200).json({
    complete: 100,
    result: flight.searchResults,
    last_result: Date.now()
  });
});

// Helper function to generate mock flight results
function generateMockFlightResults(flight) {
  const airlines = ["Emirates", "Qatar Airways", "Turkish Airlines", "Egypt Air", "Saudi Airlines"];
  const results = [];

  // Generate flights for each segment
  flight.segments.forEach(segment => {
    const flightsPerSegment = Math.floor(Math.random() * 2) + 2; // 2-3 flights per segment
    
    for (let i = 0; i < flightsPerSegment; i++) {
      const airline = airlines[Math.floor(Math.random() * airlines.length)];
      const basePrice = Math.floor(Math.random() * 1000) + 500; // Random price between 500-1500
      
      // Generate random departure time between 6 AM and 10 PM
      const departureHour = Math.floor(Math.random() * 16) + 6; // 6-22
      const departureMinute = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45
      
      const departureTime = new Date(segment.departureDate);
      departureTime.setHours(departureHour, departureMinute, 0, 0);
      
      // Calculate arrival time (2-12 hours later)
      const flightDuration = Math.floor(Math.random() * 10) + 2; // 2-12 hours
      const arrivalTime = new Date(departureTime);
      arrivalTime.setHours(arrivalTime.getHours() + flightDuration);

      const tripId = `TRIP-${Math.floor(Math.random() * 10000)}`;
      
      results.push({
        price: basePrice,
        tax: Math.floor(basePrice * 0.1),
        refundable_info: "Refundable",
        fare_key: `FARE-${Math.floor(Math.random() * 10000)}`,
        fare_brand: "Standard",
        price_breakdowns: {
          ADT: {
            total: basePrice,
            price: basePrice,
            label: "Adult",
            tax: Math.floor(basePrice * 0.1)
          },
          CHD: {
            total: Math.floor(basePrice * 0.75),
            price: Math.floor(basePrice * 0.75),
            label: "Child",
            tax: Math.floor(basePrice * 0.075)
          },
          INF: {
            total: Math.floor(basePrice * 0.1),
            price: Math.floor(basePrice * 0.1),
            label: "Infant",
            tax: Math.floor(basePrice * 0.01)
          }
        },
        legs: [{
          leg_id: `LEG-${Math.floor(Math.random() * 10000)}`,
          duration: flightDuration * 60,
          bags: {
            ADT: { cabin: { desc: "7kg" }, checked: { desc: "23kg" } },
            CHD: { cabin: { desc: "7kg" }, checked: { desc: "23kg" } },
            INF: { cabin: { desc: "5kg" }, checked: { desc: "10kg" } }
          },
          segments: [{
            cabin: "Economy",
            cabin_name: "Economy",
            farebase: "Y",
            seats: "9",
            class: "Y",
            from: {
              date: departureTime.toISOString(),
              airport: segment.from,
              city: segment.from,
              country: "Country",
              country_iso: "CO",
              terminal: "T1",
              airport_name: `${segment.from} Airport`
            },
            to: {
              date: arrivalTime.toISOString(),
              airport: segment.to,
              city: segment.to,
              country: "Country",
              country_iso: "CO",
              terminal: "T1",
              airport_name: `${segment.to} Airport`
            },
            equipment: "B737",
            equipment_name: "Boeing 737",
            flightnumber: `${airline.substring(0, 2)}${Math.floor(Math.random() * 1000)}`,
            iata: airline.substring(0, 2),
            airline_name: airline,
            duration: flightDuration * 60
          }],
          from: {
            date: departureTime.toISOString(),
            airport: segment.from,
            city: segment.from,
            country: "Country",
            country_iso: "CO",
            terminal: "T1",
            airport_name: `${segment.from} Airport`
          },
          to: {
            date: arrivalTime.toISOString(),
            airport: segment.to,
            city: segment.to,
            country: "Country",
            country_iso: "CO",
            terminal: "T1",
            airport_name: `${segment.to} Airport`
          }
        }],
        trip_id: tripId,
        search_id: flight.searchId,
        src: "mock",
        id: `FLIGHT-${Math.floor(Math.random() * 10000)}`,
        total_pax_no_inf: flight.adults + flight.children,
        search_query: {
          trips: flight.segments.map(s => ({
            from: s.from,
            to: s.to,
            date: s.departureDate.toISOString().split('T')[0]
          })),
          adt: flight.adults,
          chd: flight.children,
          inf: flight.infants,
          options: {
            direct: false,
            cabin: "e",
            multiCity: flight.segments.length > 1
          }
        },
        currency: "USD",
        can_hold: true,
        can_void: true,
        can_refund: true,
        can_exchange: true,
        etd: departureTime.toISOString()
      });
    }
  });

  return results;
}

// @desc    Create a new flight booking
// @route   POST /api/flights
// @access  Private
exports.createFlightBooking = asyncHandler(async (req, res, next) => {
  const { flightDetails } = req.body;

  // Generate a unique booking ID
  const bookingId = `FL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const booking = await FlightBooking.create({
    userId: req.user.id,
    bookingId,
    customerName: req.user.name,
    customerEmail: req.user.email,
    flightDetails: {
      from: flightDetails.from,
      to: flightDetails.to,
      departureDate: flightDetails.departureDate,
      passengers: flightDetails.passengers,
      selectedFlight: flightDetails.selectedFlight
    },
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
// @route   PUT /api/flights/bookings/:bookingId
// @access  Private
exports.updateFlightBooking = asyncHandler(async (req, res, next) => {
  console.log('Update request body:', req.body);
  console.log('Update request params:', req.params);

  let booking = await FlightBooking.findOne({
    bookingId: req.params.bookingId,
    userId: req.user.id
  });

  if (!booking) {
    console.log('Booking not found:', req.params.bookingId);
    return res.status(404).json({
      success: false,
      error: 'Booking not found'
    });
  }

  console.log('Found booking:', {
    id: booking._id,
    bookingId: booking.bookingId,
    status: booking.status,
    passengers: booking.passengers,
    flightDetails: booking.flightDetails
  });

  // Only allow updates if booking is pending
  if (booking.status !== 'pending') {
    console.log('Booking not pending:', booking.status);
    return res.status(400).json({
      success: false,
      error: 'Can only update pending bookings'
    });
  }

  // Only allow updating passengers and cabin class
  const { passengers, cabinClass } = req.body;

  if (passengers) {
    console.log('Updating passengers:', passengers);
    // Validate passenger counts
    if (passengers.adults < 1) {
      console.log('Invalid adults count:', passengers.adults);
      return res.status(400).json({
        success: false,
        error: 'At least one adult passenger is required'
      });
    }

    if (passengers.children < 0 || passengers.infants < 0) {
      console.log('Invalid passenger counts:', passengers);
      return res.status(400).json({
        success: false,
        error: 'Passenger counts cannot be negative'
      });
    }

    // Convert passengers object to array format
    const passengerArray = [];
    for (let i = 0; i < passengers.adults; i++) {
      passengerArray.push({ age: 18 }); // Default adult age
    }
    for (let i = 0; i < passengers.children; i++) {
      passengerArray.push({ age: 12 }); // Default child age
    }
    for (let i = 0; i < passengers.infants; i++) {
      passengerArray.push({ age: 2 }); // Default infant age
    }

    console.log('Converted passenger array:', passengerArray);
    booking.passengers = passengerArray;
  }

  if (cabinClass) {
    console.log('Updating cabin class:', cabinClass);
    // Validate cabin class
    const validClasses = ['economy', 'premium_economy', 'business', 'first'];
    if (!validClasses.includes(cabinClass)) {
      console.log('Invalid cabin class:', cabinClass);
      return res.status(400).json({
        success: false,
        error: 'Invalid cabin class'
      });
    }

    // Store cabin class in flightDetails
    if (!booking.flightDetails) {
      booking.flightDetails = {};
    }
    booking.flightDetails.cabinClass = cabinClass;
  }

  // Recalculate total price based on current values
  const basePrice = booking.amount || 0;
  const currentPassengers = booking.passengers || [];
  const totalPassengers = currentPassengers.length;
  
  const cabinMultiplier = {
    economy: 1,
    premium_economy: 1.5,
    business: 2,
    first: 3
  };

  const currentClass = booking.flightDetails?.cabinClass || 'economy';
  const newClass = cabinClass || currentClass;
  
  // Calculate new price
  const pricePerPassenger = basePrice / totalPassengers;
  const newTotalPassengers = passengers ? 
    (passengers.adults + (passengers.children || 0) + (passengers.infants || 0)) : 
    totalPassengers;
  
  const newPrice = pricePerPassenger * newTotalPassengers * 
    (cabinMultiplier[newClass] / cabinMultiplier[currentClass]);

  booking.amount = Math.round(newPrice * 100) / 100; // Round to 2 decimal places

  console.log('Updated booking:', {
    passengers: booking.passengers,
    cabinClass: booking.flightDetails?.cabinClass,
    amount: booking.amount
  });

  await booking.save();

  res.status(200).json({
    success: true,
    data: booking
  });
});

// @desc    Delete flight booking
// @route   DELETE /api/flights/bookings/:bookingId
// @access  Private
exports.deleteFlightBooking = asyncHandler(async (req, res, next) => {
  const booking = await FlightBooking.findOne({
    bookingId: req.params.bookingId,
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

  await booking.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});
