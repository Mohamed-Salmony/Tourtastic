const axios = require("axios");
const asyncHandler = require("../middleware/asyncHandler");
require("dotenv").config();

const seeruAxios = axios.create({
  baseURL: `https://${process.env.SEERU_API_ENDPOINT}-api.seeru.travel/v1/flights`,
  headers: {
    "Content-Type": "application/json",
    // Authorization header will be added per request
  },
});

// Function to get a valid JWT token (replace with actual token refresh logic if needed)
// For now, using the static key from .env
const getSeeruAuthToken = () => {
    // In a real app, you would implement token refresh logic using SEERU_REFRESH_KEY
    // For this example, we assume the initial API key is valid long enough or refreshed elsewhere.
    return process.env.SEERU_API_KEY;
}

// @desc    Initiate a flight search via Seeru API
// @route   GET /api/flights/search?from=...&to=...&departureDate=...&returnDate=...&adults=...&children=...&infants=...
// @access  Public (or Private, depending on your app logic)
exports.searchFlights = asyncHandler(async (req, res, next) => {
  const { from, to, departureDate, returnDate, adults = 1, children = 0, infants = 0 } = req.query;

  // Basic validation
  if (!from || !to || !departureDate || !adults) {
    return res.status(400).json({ success: false, message: "Missing required search parameters (from, to, departureDate, adults)" });
  }

  // Construct the trips parameter for Seeru API
  // Format: OriginDestinationInformation=FROM-TO_YYYY-MM-DD,TO-FROM_YYYY-MM-DD (for round trip)
  // Format: OriginDestinationInformation=FROM-TO_YYYY-MM-DD (for one way)
  let tripsParam = `${from}-${to}_${departureDate}`;
  if (returnDate) {
    tripsParam += `,${to}-${from}_${returnDate}`;
  }

  const seeruToken = getSeeruAuthToken();
  if (!seeruToken) {
      return res.status(500).json({ success: false, message: "Seeru API key not configured" });
  }

  try {
    const seeruResponse = await seeruAxios.get(`/search/${tripsParam}/${adults}/${children}/${infants}`, {
        headers: {
            Authorization: `Bearer ${seeruToken}`
        }
    });

    // Proxy the response from Seeru
    res.status(seeruResponse.status).json(seeruResponse.data);

  } catch (error) {
    console.error("Seeru API Search Error:", error.response ? error.response.data : error.message);
    // Proxy the error status and message if available
    const statusCode = error.response ? error.response.status : 500;
    const message = error.response && error.response.data && error.response.data.message
                      ? error.response.data.message
                      : "Failed to search flights via Seeru API";
    res.status(statusCode).json({ success: false, message });
  }
});

// @desc    Retrieve flight search results from Seeru API
// @route   GET /api/flights/results/:search_id
// @access  Public (or Private)
exports.getSearchResults = asyncHandler(async (req, res, next) => {
  const { search_id } = req.params;

  if (!search_id) {
    return res.status(400).json({ success: false, message: "Search ID is required" });
  }

  const seeruToken = getSeeruAuthToken();
    if (!seeruToken) {
        return res.status(500).json({ success: false, message: "Seeru API key not configured" });
    }

  try {
    const seeruResponse = await seeruAxios.get(`/result/${search_id}`, {
        headers: {
            Authorization: `Bearer ${seeruToken}`
        }
    });

    // Proxy the response from Seeru
    res.status(seeruResponse.status).json(seeruResponse.data);

  } catch (error) {
    console.error("Seeru API Result Error:", error.response ? error.response.data : error.message);
    const statusCode = error.response ? error.response.status : 500;
    const message = error.response && error.response.data && error.response.data.message
                      ? error.response.data.message
                      : "Failed to retrieve flight results via Seeru API";
    res.status(statusCode).json({ success: false, message });
  }
});
