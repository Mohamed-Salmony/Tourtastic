const axios = require('axios');
const asyncHandler = require('../middleware/asyncHandler');

// Base URL for Amadeus API
const baseURL = `https://${process.env.AMADEUS_API_ENDPOINT}`;

// Token storage and expiration tracking
let amadeusToken = null;
let tokenExpiration = null;

// Helper function to get a valid Amadeus token
const getAmadeusToken = async () => {
  // Check if we have a valid token
  if (amadeusToken && tokenExpiration && new Date() < tokenExpiration) {
    return amadeusToken;
  }
  
  // Request a new token
  try {
    const response = await axios.post(
      `${baseURL}/v1/security/oauth2/token`,
      `grant_type=client_credentials&client_id=${process.env.AMADEUS_API_KEY}&client_secret=${process.env.AMADEUS_API_SECRET}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    // Set the token and calculate expiration
    amadeusToken = response.data.access_token;
    // Set expiration 5 minutes before actual expiry to be safe
    tokenExpiration = new Date(new Date().getTime() + (response.data.expires_in - 300) * 1000);
    
    return amadeusToken;
  } catch (error) {
    console.error('Amadeus token error:', error.response?.data || error.message);
    throw new Error('Failed to obtain Amadeus API token');
  }
};

// Helper function to get a configured axios instance with the latest token
const getAmadeusApiInstance = async () => {
  const token = await getAmadeusToken();
  
  return axios.create({
    baseURL,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

// @desc    Search for flight destinations
// @route   GET /api/amadeus/flight-destinations
// @access  Public
exports.getFlightDestinations = asyncHandler(async (req, res) => {
  const { origin, maxPrice } = req.query;
  
  if (!origin) {
    return res.status(400).json({
      success: false,
      message: 'Origin is required'
    });
  }
  
  try {
    const amadeusApi = await getAmadeusApiInstance();
    const response = await amadeusApi.get(
      '/v1/shopping/flight-destinations',
      { params: { origin, maxPrice } }
    );
    
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Amadeus API error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.errors?.[0]?.detail || 'Error searching flight destinations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});