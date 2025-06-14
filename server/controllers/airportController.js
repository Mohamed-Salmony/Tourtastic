const asyncHandler = require("../middleware/asyncHandler");

// List of major airports with their coordinates
const airports = [
  // Syrian Airports
  {
    code: 'DAM',
    name: 'Damascus International Airport',
    city: 'Damascus',
    country: 'Syria',
    latitude: 33.4106,
    longitude: 36.5144
  },
  {
    code: 'ALP',
    name: 'Aleppo International Airport',
    city: 'Aleppo',
    country: 'Syria',
    latitude: 36.1807,
    longitude: 37.2244
  },
  {
    code: 'LTK',
    name: 'Bassel Al-Assad International Airport',
    city: 'Latakia',
    country: 'Syria',
    latitude: 35.4011,
    longitude: 35.9487
  },
  {
    code: 'KAC',
    name: 'Kamishly Airport',
    city: 'Qamishli',
    country: 'Syria',
    latitude: 37.0206,
    longitude: 41.1914
  },
  {
    code: 'DEZ',
    name: 'Deir ez-Zor Airport',
    city: 'Deir ez-Zor',
    country: 'Syria',
    latitude: 35.2854,
    longitude: 40.1759
  },
  {
    code: 'PMS',
    name: 'Palmyra Airport',
    city: 'Palmyra',
    country: 'Syria',
    latitude: 34.5574,
    longitude: 38.3169
  },
  // Egyptian Airports
  {
    code: 'ATZ',
    name: 'Assiut International Airport',
    city: 'Assiut',
    country: 'Egypt',
    latitude: 27.0465,
    longitude: 31.0119
  },
  // US Airports
  {
    code: 'JFK',
    name: 'John F. Kennedy International Airport',
    city: 'New York',
    country: 'United States',
    latitude: 40.6413,
    longitude: -73.7781
  },
  {
    code: 'LAX',
    name: 'Los Angeles International Airport',
    city: 'Los Angeles',
    country: 'United States',
    latitude: 33.9416,
    longitude: -118.4085
  },
  {
    code: 'ORD',
    name: "Chicago O'Hare International Airport",
    city: 'Chicago',
    country: 'United States',
    latitude: 41.9742,
    longitude: -87.9073
  },
  {
    code: 'DFW',
    name: 'Dallas/Fort Worth International Airport',
    city: 'Dallas',
    country: 'United States',
    latitude: 32.8998,
    longitude: -97.0403
  },
  {
    code: 'DEN',
    name: 'Denver International Airport',
    city: 'Denver',
    country: 'United States',
    latitude: 39.8561,
    longitude: -104.6737
  },
  {
    code: 'SFO',
    name: 'San Francisco International Airport',
    city: 'San Francisco',
    country: 'United States',
    latitude: 37.6213,
    longitude: -122.3790
  },
  {
    code: 'SEA',
    name: 'Seattle-Tacoma International Airport',
    city: 'Seattle',
    country: 'United States',
    latitude: 47.4502,
    longitude: -122.3088
  },
  {
    code: 'MIA',
    name: 'Miami International Airport',
    city: 'Miami',
    country: 'United States',
    latitude: 25.7959,
    longitude: -80.2870
  },
  {
    code: 'BOS',
    name: 'Boston Logan International Airport',
    city: 'Boston',
    country: 'United States',
    latitude: 42.3656,
    longitude: -71.0096
  },
  {
    code: 'ATL',
    name: 'Hartsfield-Jackson Atlanta International Airport',
    city: 'Atlanta',
    country: 'United States',
    latitude: 33.6407,
    longitude: -84.4277
  }
];

// @desc    Get all airports
// @route   GET /api/airports
// @access  Public
exports.getAirports = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: airports
  });
}); 