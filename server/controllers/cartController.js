const asyncHandler = require("../middleware/asyncHandler");
const Booking = require("../models/Booking");
const FlightBooking = require("../models/FlightBooking");

// @desc    Get cart items for the logged-in user
// @route   GET /api/cart
// @access  Private
exports.getCartItems = asyncHandler(async (req, res) => {
  // Get regular bookings
  const bookings = await Booking.find({
    userId: req.user.id,
    status: "pending"
  }).sort({ createdAt: -1 });

  // Get flight bookings
  const flightBookings = await FlightBooking.find({
    userId: req.user.id,
    status: "pending"
  }).sort({ createdAt: -1 });

  // Combine and format all items
  const cartItems = [
    ...bookings.map(formatRegularBooking),
    ...flightBookings.map(formatFlightBooking)
  ];
  // Transform bookings to cart item format
  const formattedItems = cartItems.map(item => {
    const formattedItem = {
      id: item.bookingId,
      type: (item.type || '').toLowerCase(),
      name: item.name || '',
      image: item.image || getBookingImage(item.type),
      details: item.details || '',
      price: typeof item.price === 'number' ? item.price : 0,
      quantity: item.quantity || 1
    };
    return formattedItem;
  });

  res.status(200).json({
    success: true,
    data: formattedItems
  });
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/:id
// @access  Private
exports.removeFromCart = asyncHandler(async (req, res) => {
  // Try to find in regular bookings first
  let booking = await Booking.findOne({
    bookingId: req.params.id,
    userId: req.user.id
  });

  if (!booking) {
    // If not found in regular bookings, try flight bookings
    booking = await FlightBooking.findOne({
      bookingId: req.params.id,
      userId: req.user.id
    });
  }

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: "Booking not found"
    });
  }

  await booking.deleteOne(); // Using deleteOne instead of remove as it's more modern

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Update cart item quantity
// @route   PATCH /api/cart/:id
// @access  Private
exports.updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    return res.status(400).json({
      success: false,
      message: "Invalid quantity"
    });
  }
  // Try to find in regular bookings first
  let booking = await Booking.findOne({
    bookingId: req.params.id,
    userId: req.user.id
  });

  if (!booking) {
    // If not found in regular bookings, try flight bookings
    booking = await FlightBooking.findOne({
      bookingId: req.params.id,
      userId: req.user.id
    });
  }

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: "Booking not found"
    });
  }

  // Update quantity
  if (booking.details) {
    booking.details.quantity = quantity;
  } else {
    booking.details = { quantity };
  }
  
  await booking.save();

  res.status(200).json({
    success: true,
    data: booking
  });
});

// @desc    Checkout cart items
// @route   POST /api/bookings/cart/checkout
// @access  Private
exports.checkout = asyncHandler(async (req, res) => {
  try {
    // Get both regular bookings and flight bookings
    const [regularBookings, flightBookings] = await Promise.all([
      Booking.find({
        userId: req.user.id,
        status: "pending"
      }),
      FlightBooking.find({
        userId: req.user.id,
        status: "pending"
      })
    ]);

    const totalItems = regularBookings.length + flightBookings.length;

    if (totalItems === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty"
      });
    }

    // Update status for all items
    await Promise.all([
      ...regularBookings.map(async (item) => {
        item.status = "confirmed";
        await item.save();
      }),
      ...flightBookings.map(async (item) => {
        item.status = "confirmed";
        await item.save();
      })
    ]);

    res.status(200).json({
      success: true,
      message: "Checkout completed successfully"
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to confirm booking"
    });
  }
});

// Helper functions to format booking data for cart display
function formatRegularBooking(booking) {
  return {
    id: booking.bookingId,
    type: booking.type.toLowerCase(),
    name: getBookingName(booking),
    image: getBookingImage(booking.type),
    details: getBookingDetails(booking),
    price: booking.amount,
    quantity: booking.details.quantity || 1,
    bookingType: 'regular'
  };
}

function formatFlightBooking(booking) {
  const departureDate = booking.flightDetails?.departureDate 
    ? new Date(booking.flightDetails.departureDate).toLocaleDateString()
    : 'Date not set';
    
  let price = 0;
  if (booking.flightDetails?.selectedFlight?.price?.total) {
    price = Number(booking.flightDetails.selectedFlight.price.total);
  }

  return {
    id: booking.bookingId,
    type: 'flight',
    name: `Flight: ${booking.flightDetails?.from || ''} to ${booking.flightDetails?.to || ''}`,
    image: getBookingImage('flight'),
    details: `Departure: ${departureDate}`,
    price: price,
    quantity: 1,
    bookingType: 'flight'
  };
}

function getBookingName(booking) {
  switch (booking.type) {
    case "Hotel":
      return `${booking.details.hotelName}`;
    case "Tour Package":
      return `${booking.destination} Tour`;
    default:
      return booking.type;
  }
}

function getBookingDetails(booking) {
  switch (booking.type) {
    case "Hotel":
      return `${booking.details.nights} nights - ${new Date(booking.bookingDate).toLocaleDateString()}`;
    case "Tour Package":
      return `${booking.details.duration} - ${new Date(booking.bookingDate).toLocaleDateString()}`;
    default:
      return new Date(booking.bookingDate).toLocaleDateString();
  }
}

function getBookingImage(type) {
  switch (type.toLowerCase()) {
    case "flight":
      return "https://cdn-icons-png.flaticon.com/512/3125/3125713.png";
    case "hotel":
      return "https://cdn-icons-png.flaticon.com/512/2933/2933772.png";
    case "tour package":
      return "https://cdn-icons-png.flaticon.com/512/3774/3774073.png";
    default:
      return "https://cdn-icons-png.flaticon.com/512/2933/2933772.png";
  }
}
