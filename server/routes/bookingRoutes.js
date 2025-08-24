const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticateToken } = require('../middleware/auth');

// Protected routes - require authentication
router.use(authenticateToken);

// Create a new flight booking
router.post('/', bookingController.createFlightBooking);

// Get user's bookings
router.get('/', bookingController.getUserBookings);

// Delete a booking
router.delete('/:bookingId', bookingController.deleteBooking);

// Update payment status
router.patch('/:bookingId/payment', bookingController.updatePaymentStatus);

module.exports = router;
