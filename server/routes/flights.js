const express = require('express');
const router = express.Router();
const {
  searchFlights,
  getFlightSearchResults,
  validateFare,
  saveBooking,
  getOrderDetails,
  cancelOrder,
  issueOrder
} = require('../controllers/flightController');

// Public routes (no authentication required)
router.get('/search/:trips/:adults/:children/:infants', searchFlights);
router.get('/results/:searchId', getFlightSearchResults);

// Booking routes (no authentication required for now)
router.post('/booking/fare', validateFare);
router.post('/booking/save', saveBooking);
router.post('/order/details', getOrderDetails);
router.post('/order/cancel', cancelOrder);
router.post('/order/issue', issueOrder);

// Legacy routes
router.get('/destinations', (req, res) => {
  res.json({
    success: true,
    message: 'This endpoint has been migrated to Seeru API. Please use the search endpoint.'
  });
});

router.get('/offers', (req, res) => {
  res.json({
    success: true,
    message: 'This endpoint has been migrated to Seeru API. Please use the search endpoint.'
  });
});

router.get('/dates', (req, res) => {
  res.json({
    success: true,
    message: 'This endpoint has been migrated to Seeru API. Please use the search endpoint.'
  });
});

module.exports = router;