const express = require('express');
const {
  getFlightDestinations,
  getFlightOffers,
  getFlightDates,
  searchFlights,
  getFlightSearchResults
} = require('../controllers/flightController');

const router = express.Router();

// Public routes for flight search
router.get('/destinations', getFlightDestinations);
router.get('/offers', getFlightOffers);
router.get('/dates', getFlightDates);

// Frontend integration routes
router.get('/search/:trips/:adults/:children/:infants', searchFlights);
router.get('/results/:searchId', getFlightSearchResults);

module.exports = router;