const express = require("express");
const {
  searchFlights,
  getSearchResults,
} = require("../controllers/flightController");

// Optional: Add protect middleware if flight search should be restricted to logged-in users
// const { protect } = require("../middleware/auth");

const router = express.Router();

// Example: Making search public, but could add protect middleware
router.get("/search", searchFlights);
router.get("/results/:search_id", getSearchResults);

module.exports = router;
