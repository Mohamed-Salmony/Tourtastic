const fs = require('fs');
const path = require('path');
const asyncHandler = require("../middleware/asyncHandler");

// Load airports from JSON file
const jsonPath = path.join(__dirname, '../data/airports.json');
const airports = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// Helper function to format airport data based on language
const formatAirportData = (airport, isArabic = false) => {
  return {
    id: airport.id,
    iata_code: airport.iata_code,
    name: isArabic ? airport.name_arbic : airport.name,
    municipality: isArabic ? airport.municipality_arbic : airport.municipality,
    country: isArabic ? airport.country_arbic : airport.country,
    latitude_deg: airport.latitude_deg,
    longitude_deg: airport.longitude_deg,
    type: airport.type,
    scheduled_service: airport.scheduled_service
  };
};

// @desc    Get all airports
// @route   GET /api/airports
// @access  Public
exports.getAirports = asyncHandler(async (req, res) => {
  const lang = req.query.lang || 'en';
  const isArabic = lang === 'ar';
  
  const formattedAirports = airports.map(airport => formatAirportData(airport, isArabic));
  
  res.status(200).json({
    success: true,
    data: formattedAirports
  });
});

// @desc    Search airports
// @route   GET /api/airports/search?q=...&lang=en|ar
// @access  Public
exports.searchAirports = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  const lang = req.query.lang || 'en';
  
  if (!q) {
    return res.status(400).json({ success: false, message: 'Query required' });
  }

  // Helper function to check if any of the fields contain the search term
  const matchesSearch = (airport, searchTerm) => {
    if (lang === 'ar') {
      return (
        (airport.iata_code && airport.iata_code.toLowerCase() === searchTerm) ||
        (airport.name_arbic && airport.name_arbic.toLowerCase().includes(searchTerm)) ||
        (airport.municipality_arbic && airport.municipality_arbic.toLowerCase().includes(searchTerm)) ||
        (airport.country_arbic && airport.country_arbic.toLowerCase().includes(searchTerm))
      );
    } else {
      return (
        (airport.iata_code && airport.iata_code.toLowerCase() === searchTerm) ||
        (airport.name && airport.name.toLowerCase().includes(searchTerm)) ||
        (airport.municipality && airport.municipality.toLowerCase().includes(searchTerm)) ||
        (airport.country && airport.country.toLowerCase().includes(searchTerm)) ||
        (airport.iso_country && airport.iso_country.toLowerCase().includes(searchTerm))
      );
    }
  };

  // First try exact IATA code match
  let results = airports.filter(a =>
    a.iata_code && a.iata_code.toLowerCase() === q
  );

  // If no exact IATA matches, try partial matches across all fields
  if (results.length === 0) {
    results = airports.filter(a => matchesSearch(a, q));
  }

  // Sort results to prioritize matches in name and IATA code
  results.sort((a, b) => {
    const aIsExactIATA = a.iata_code && a.iata_code.toLowerCase() === q;
    const bIsExactIATA = b.iata_code && b.iata_code.toLowerCase() === q;
    
    if (aIsExactIATA && !bIsExactIATA) return -1;
    if (!aIsExactIATA && bIsExactIATA) return 1;

    const aNameMatch = lang === 'ar' 
      ? (a.name_arbic && a.name_arbic.toLowerCase().includes(q))
      : (a.name && a.name.toLowerCase().includes(q));
    const bNameMatch = lang === 'ar'
      ? (b.name_arbic && b.name_arbic.toLowerCase().includes(q))
      : (b.name && b.name.toLowerCase().includes(q));

    if (aNameMatch && !bNameMatch) return -1;
    if (!aNameMatch && bNameMatch) return 1;

    return 0;
  });

  res.json({ success: true, data: results.slice(0, 20) });
});