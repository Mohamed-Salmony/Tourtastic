const FlightBooking = require("../models/FlightBooking");
const User = require("../models/User"); // Needed to get user details
const asyncHandler = require("../middleware/asyncHandler");
const fs = require('fs');
const path = require('path');
const { generateSignedUrl } = require('../utils/gcsStorage');

// Load airports data to try to resolve IATA codes when missing
const airportsJsonPath = path.join(__dirname, '../data/airports.json');
let airports = [];
try {
  airports = JSON.parse(fs.readFileSync(airportsJsonPath, 'utf8'));
} catch (err) {
  console.warn('Could not load airports.json for IATA resolution:', err.message);
}

const findAirportIataForLabel = (label) => {
  if (!label) return null;
  const s = String(label).trim().toLowerCase();
  // If it's already a 3-letter IATA
  if (/^[a-z]{3}$/.test(s)) return s.toUpperCase();

  // Try to match exact iata_code
  const byIata = airports.find(a => a.iata_code && a.iata_code.toLowerCase() === s);
  if (byIata) return byIata.iata_code;

  // Try matching by name, municipality or Arabic equivalents
  const byName = airports.find(a => {
    return (
      (a.name && a.name.toLowerCase().includes(s)) ||
      (a.name_arbic && a.name_arbic.toLowerCase().includes(s)) ||
      (a.municipality && a.municipality.toLowerCase().includes(s)) ||
      (a.municipality_arbic && a.municipality_arbic.toLowerCase().includes(s)) ||
      (a.country && a.country.toLowerCase().includes(s)) ||
      (a.country_arbic && a.country_arbic.toLowerCase().includes(s))
    );
  });
  if (byName) return byName.iata_code;

  return null;
};

// Helper function to generate a unique booking ID (Example: BK-1001)
async function generateBookingId() {
  const lastBooking = await FlightBooking.findOne().sort({ createdAt: -1 });
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

  // Attempt to resolve IATA codes if not provided in the payload
  const resolvedFromIata = flightDetails.fromIata || findAirportIataForLabel(from) || null;
  const resolvedToIata = flightDetails.toIata || findAirportIataForLabel(to) || null;

  // Resolve airline code/logo from selectedFlight if not top-level provided
  const resolvedAirlineCode = flightDetails.airlineCode || selectedFlight?.airlineCode || selectedFlight?.airline_code || null;
  const resolvedAirlineLogo = flightDetails.airlineLogo || selectedFlight?.airlineLogo || selectedFlight?.airline_logo_url || null;

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
    // amount will be resolved below from selectedFlight (robustly)
    amount: null,
  };

  // Generate a unique booking ID
  const bookingId = await generateBookingId();

  // Use values from bookingData when creating the DB record
  const { type, destination, bookingDate, details, amount } = bookingData;

  // Normalize selectedFlight/raw flight object to extract core fields required by schema
  const rawFlight = details.flight || selectedFlight || {};

  const extractFlightId = (f) => {
    return (
      f.flightId || f.flightnumber || f.trip_id ||
      (f.legs && f.legs[0] && f.legs[0].segments && f.legs[0].segments[0] && (f.legs[0].segments[0].flightnumber || f.legs[0].segments[0].flightId)) ||
      ''
    );
  };

  const extractAirline = (f) => {
    return (
      f.airline || f.airline_name ||
      (f.legs && f.legs[0] && f.legs[0].segments && f.legs[0].segments[0] && (f.legs[0].segments[0].airline_name || f.legs[0].segments[0].airline)) ||
      ''
    );
  };

  const extractDate = (val) => {
    if (!val) return null;
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d;
    return null;
  };

  const flightIdVal = extractFlightId(rawFlight);
  const airlineVal = extractAirline(rawFlight);
  const departureVal = extractDate(rawFlight.departureTime) || extractDate(rawFlight.legs?.[0]?.from?.date) || extractDate(details.departureDate) || new Date();
  const arrivalVal = extractDate(rawFlight.arrivalTime) || extractDate(rawFlight.legs?.[0]?.to?.date) || new Date(departureVal.getTime() + 2 * 60 * 60 * 1000); // default +2h

  // Normalize price object
  let priceObj = { total: 0, currency: 'USD' };
  if (rawFlight.price && typeof rawFlight.price === 'object') {
    priceObj.total = Number(rawFlight.price.total || rawFlight.price.amount || 0) || 0;
    priceObj.currency = rawFlight.price.currency || rawFlight.price.currency_code || 'USD';
  } else if (typeof rawFlight.price === 'number') {
    priceObj.total = rawFlight.price;
    priceObj.currency = rawFlight.currency || 'USD';
  } else if (selectedFlight && selectedFlight.price && typeof selectedFlight.price === 'object') {
    priceObj.total = Number(selectedFlight.price.total || 0) || 0;
    priceObj.currency = selectedFlight.price.currency || 'USD';
  }

  // set bookingData.amount for bookkeeping
  bookingData.amount = priceObj.total;

  // Create a FlightBooking document (specific collection for flights)
  const booking = await FlightBooking.create({
    bookingId,
    userId: req.user.id,
    customerName: user.name,
    customerEmail: user.email,
    flightDetails: {
      from: details.from,
      to: details.to,
      fromIata: resolvedFromIata,
      toIata: resolvedToIata,
      departureDate: details.departureDate,
  passengers: details.passengers,
  passengerDetails: details.passengerDetails || [],
      selectedFlight: {
        flightId: flightIdVal || '',
        airline: airlineVal || '',
        departureTime: departureVal,
        arrivalTime: arrivalVal,
        price: priceObj,
        class: details.flight?.class || details.flight?.cabin || 'economy',
        airlineCode: resolvedAirlineCode,
        airlineLogo: resolvedAirlineLogo,
        // store raw provider flight object for full UI rendering
        raw: details.flight || selectedFlight || {}
      }
    },
    status: "pending",
    paymentStatus: "pending",
    ticketDetails: {
      additionalDocuments: []
    },
    paymentDetails: {
      status: "pending",
      currency: details.flight?.price?.currency || 'USD',
      transactions: []
    },
    timeline: [{ status: 'created', timestamp: new Date(), description: 'Booking created and added to cart' }]
  });

  res.status(201).json({
    success: true,
    data: booking,
  });
});

/**
 * Convert booking ticket paths to signed URLs
 */
async function convertBookingUrls(booking) {
  if (!booking) return booking;
  
  const book = booking.toObject ? booking.toObject() : { ...booking };
  
  // Check multiple possible locations for ticket path
  const ticketPath = 
    (book.ticketDetails && book.ticketDetails.eTicketPath) || 
    book.ticketUrl || 
    book.ticketPdfUrl || 
    (book.ticketInfo && book.ticketInfo.filePath) || 
    (book.ticketDetails && book.ticketDetails.additionalDocuments && 
     book.ticketDetails.additionalDocuments[0] && 
     book.ticketDetails.additionalDocuments[0].path);
  
  if (ticketPath && ticketPath.startsWith('supabase://')) {
    try {
      const signedUrl = await generateSignedUrl(ticketPath, 86400); // 24 hours
      
      // Update all possible locations
      if (book.ticketDetails && book.ticketDetails.eTicketPath) {
        book.ticketDetails.eTicketPath = signedUrl;
      }
      if (book.ticketUrl) book.ticketUrl = signedUrl;
      if (book.ticketPdfUrl) book.ticketPdfUrl = signedUrl;
      if (book.ticketInfo && book.ticketInfo.filePath) {
        book.ticketInfo.filePath = signedUrl;
      }
      if (book.ticketDetails && book.ticketDetails.additionalDocuments && 
          book.ticketDetails.additionalDocuments[0]) {
        book.ticketDetails.additionalDocuments[0].path = signedUrl;
      }
    } catch (err) {
      console.error('Failed to generate signed URL for booking ticket:', err);
    }
  }
  
  return book;
}

// @desc    Get bookings for the logged-in user
// @route   GET /api/bookings/my
// @access  Private
exports.getMyBookings = asyncHandler(async (req, res, next) => {
  const bookings = await FlightBooking.find({ userId: req.user.id }).sort({ createdAt: -1 });

  // Convert all ticket paths to signed URLs
  const bookingsWithUrls = await Promise.all(
    bookings.map(b => convertBookingUrls(b))
  );

  res.status(200).json({
    success: true,
    count: bookingsWithUrls.length,
    data: bookingsWithUrls,
  });
});

// @desc    Delete a user's own booking
// @route   DELETE /api/bookings/:id
// @access  Private (user must own the booking)
exports.deleteBooking = asyncHandler(async (req, res, next) => {
  const booking = await FlightBooking.findById(req.params.id);
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  // Only allow deletion if the booking belongs to the requesting user
  if (booking.userId.toString() !== req.user.id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this booking' });
  }

  await booking.deleteOne();

  res.status(200).json({ success: true, data: {} });
});

// @desc    Update a user's booking (partial updates allowed, e.g., passengerDetails)
// @route   PATCH /api/bookings/:id
// @access  Private (user must own the booking)
exports.updateBooking = asyncHandler(async (req, res, next) => {
  const booking = await FlightBooking.findById(req.params.id);
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  if (booking.userId.toString() !== req.user.id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized to update this booking' });
  }

  // Only allow specific fields to be updated for safety
  const allowed = ['flightDetails.passengerDetails', 'customerName', 'customerEmail', 'customerPhone'];

  // Merge allowed fields from req.body
  if (req.body.flightDetails && Array.isArray(req.body.flightDetails.passengerDetails)) {
    booking.flightDetails.passengerDetails = req.body.flightDetails.passengerDetails.map(p => ({
      firstName: p.firstName || '',
      lastName: p.lastName || '',
      dob: p.dob ? new Date(p.dob) : null,
      passportNumber: p.passportNumber || '',
      passportIssueDate: p.passportIssueDate ? new Date(p.passportIssueDate) : null,
      passportExpiryDate: p.passportExpiryDate ? new Date(p.passportExpiryDate) : null,
      phone: p.phone || '',
      email: p.email || '',
      type: p.type || 'adult'
    }));
  }

  if (req.body.customerName) booking.customerName = req.body.customerName;
  if (req.body.customerEmail) booking.customerEmail = req.body.customerEmail;
  if (req.body.customerPhone) booking.customerPhone = req.body.customerPhone;

  await booking.save();

  res.status(200).json({ success: true, data: booking });
});

// @desc    Return a usable URL (public or signed) for a booking ticket
// @route   GET /api/bookings/:id/ticket-url
// @access  Private
exports.getTicketUrl = asyncHandler(async (req, res, next) => {
  const booking = await FlightBooking.findById(req.params.id);
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  // Look for common fields where tickets are stored
  const raw = (booking.ticketDetails && booking.ticketDetails.eTicketPath) || booking.ticketUrl || booking.ticketPdfUrl || (booking.ticketInfo && booking.ticketInfo.filePath) || (booking.ticketDetails && booking.ticketDetails.additionalDocuments && booking.ticketDetails.additionalDocuments[0] && booking.ticketDetails.additionalDocuments[0].path) || null;

  if (!raw) {
    return res.status(404).json({ success: false, message: 'No ticket file recorded for this booking' });
  }

  // If it's already a full URL, return it directly
  if (/^https?:\/\//i.test(raw)) {
    return res.status(200).json({ success: true, url: raw });
  }

  // If it's a Supabase path, generate signed URL
  if (raw.startsWith('supabase://')) {
    try {
      const signedUrl = await generateSignedUrl(raw, 86400); // 24 hours
      return res.status(200).json({ success: true, url: signedUrl });
    } catch (err) {
      console.error('Failed to generate signed URL for ticket:', err);
      return res.status(500).json({ success: false, message: 'Failed to generate ticket URL' });
    }
  }

  // If it's a local uploads path (served under /uploads), build absolute URL
  if (raw.startsWith('uploads') || raw.startsWith('/uploads')) {
    const pathPart = raw.startsWith('/') ? raw : `/${raw}`;
    const url = `${req.protocol}://${req.get('host')}${pathPart}`;
    return res.status(200).json({ success: true, url });
  }

  // Fallback: return as-is
  return res.status(200).json({ success: true, url: raw });
});

// Note: Admin booking management (get all, get by ID, update, delete) will be in adminController
