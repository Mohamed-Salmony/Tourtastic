const express = require('express');
const router = express.Router();
const { getAirports, searchAirports } = require('../controllers/airportController');

router.get('/', getAirports);
router.get('/search', searchAirports);

module.exports = router; 