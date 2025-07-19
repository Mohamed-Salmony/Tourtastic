const fs = require('fs');
const path = require('path');
const asyncHandler = require("../middleware/asyncHandler");
const parse = require('csv-parse/sync').parse;

// Load airports from CSV file
const csvPath = path.join(__dirname, '../data/airports.csv');
const csvData = fs.readFileSync(csvPath, 'utf8');
const airports = parse(csvData, {
  columns: true,
  skip_empty_lines: true
});

// @desc    Get all airports
// @route   GET /api/airports
// @access  Public
exports.getAirports = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: airports
  });
});

// @desc    Search airports
// @route   GET /api/airports/search?q=...
// @access  Public
exports.searchAirports = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  if (!q) {
    return res.status(400).json({ success: false, message: 'Query required' });
  }
  // Prioritize exact IATA code match, then partial matches
  let results = airports.filter(a =>
    a.iata_code && a.iata_code.toLowerCase() === q
  );
  if (results.length === 0) {
    results = airports.filter(a =>
      (a.iata_code && a.iata_code.toLowerCase().includes(q)) ||
      (a.name && a.name.toLowerCase().includes(q)) ||
      (a.municipality && a.municipality.toLowerCase().includes(q))
    );
  }
  res.json({ success: true, data: results.slice(0, 20) });
}); 