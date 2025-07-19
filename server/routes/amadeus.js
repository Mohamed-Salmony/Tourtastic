const express = require('express');
const { getFlightDestinations } = require('../controllers/amadeusController');

const router = express.Router();

// Public routes
router.get('/flight-destinations', getFlightDestinations);

module.exports = router;