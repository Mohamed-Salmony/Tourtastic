const express = require('express');
const router = express.Router();
const { getAirports } = require('../controllers/airportController');

router.get('/', getAirports);

module.exports = router; 