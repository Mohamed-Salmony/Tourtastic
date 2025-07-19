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
// @route   GET /api/flights/destinations
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

// @desc    Search for flight offers
// @route   GET /api/flights/offers
// @access  Public
exports.getFlightOffers = asyncHandler(async (req, res) => {
  const { 
    originLocationCode, 
    destinationLocationCode, 
    departureDate, 
    returnDate, 
    adults = 1, 
    children = 0, 
    infants = 0,
    travelClass = 'ECONOMY',
    nonStop = false
  } = req.query;
  
  if (!originLocationCode || !destinationLocationCode || !departureDate) {
    return res.status(400).json({
      success: false,
      message: 'Origin, destination, and departure date are required'
    });
  }
  
  try {
    const amadeusApi = await getAmadeusApiInstance();
    const params = {
      originLocationCode,
      destinationLocationCode,
      departureDate,
      adults,
      children,
      infants,
      travelClass,
      nonStop
    };
    
    // Add return date if provided (for round trip)
    if (returnDate) {
      params.returnDate = returnDate;
    }
    
    const response = await amadeusApi.get(
      '/v2/shopping/flight-offers',
      { params }
    );
    
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Amadeus API error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.errors?.[0]?.detail || 'Error searching flight offers',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get flight dates with prices
// @route   GET /api/flights/dates
// @access  Public
exports.getFlightDates = asyncHandler(async (req, res) => {
  const { origin, destination, departureDate, oneWay = false } = req.query;
  
  if (!origin || !destination || !departureDate) {
    return res.status(400).json({
      success: false,
      message: 'Origin, destination, and departure date are required'
    });
  }
  
  try {
    const amadeusApi = await getAmadeusApiInstance();
    const response = await amadeusApi.get(
      '/v1/shopping/flight-dates',
      { params: { origin, destination, departureDate, oneWay } }
    );
    
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Amadeus API error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.errors?.[0]?.detail || 'Error searching flight dates',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Search for flights (Frontend integration)
// @route   GET /api/flights/search/:trips/:adults/:children/:infants
// @access  Public
exports.searchFlights = asyncHandler(async (req, res) => {
  const { trips, adults, children, infants } = req.params;
  const { cabin = 'ECONOMY', direct = '0' } = req.query;
  
  // Parse trips format: ORIGIN-DESTINATION-DATE:ORIGIN2-DESTINATION2-DATE2
  const tripSegments = trips.split(':').map(trip => {
    const [origin, destination, date] = trip.split('-');
    // Convert YYYYMMDD to YYYY-MM-DD
    const formattedDate = `${date.slice(0,4)}-${date.slice(4,6)}-${date.slice(6,8)}`;
    return { origin, destination, date: formattedDate };
  });
  
  if (tripSegments.length === 0 || !tripSegments[0].origin) {
    return res.status(400).json({
      success: false,
      message: 'Invalid trip format'
    });
  }
  
  try {
    const amadeusApi = await getAmadeusApiInstance();
    
    // Map cabin codes
    const cabinMap = {
      'e': 'ECONOMY',
      'p': 'PREMIUM_ECONOMY', 
      'b': 'BUSINESS',
      'f': 'FIRST'
    };
    
    let allFlights = [];
    const searchId = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Handle multi-city search by making separate API calls for each segment
    for (let i = 0; i < tripSegments.length; i++) {
      const segment = tripSegments[i];
      
      const params = {
        originLocationCode: segment.origin,
        destinationLocationCode: segment.destination,
        departureDate: segment.date,
        adults: parseInt(adults) || 1,
        children: parseInt(children) || 0,
        infants: parseInt(infants) || 0,
        travelClass: cabinMap[cabin] || 'ECONOMY',
        nonStop: direct === '1'
      };
      
      try {
        const response = await amadeusApi.get('/v2/shopping/flight-offers', { params });
        
        // Transform and add segment index to each flight
        const segmentFlights = transformAmadeusToFrontendFormat(response.data.data, `${searchId}_segment_${i}`, {
          trips: [segment], // Pass only current segment
          adt: parseInt(adults),
          chd: parseInt(children),
          inf: parseInt(infants),
          options: {
            direct: direct === '1',
            cabin: cabin,
            multiCity: tripSegments.length > 1,
            segmentIndex: i // Add segment index
          }
        });
        
        // Add segment information to each flight
        segmentFlights.forEach(flight => {
          flight.segment_index = i;
          flight.segment_info = {
            from: segment.origin,
            to: segment.destination,
            date: segment.date,
            index: i
          };
        });
        
        allFlights = allFlights.concat(segmentFlights);
      } catch (segmentError) {
        console.error(`Error searching segment ${i}:`, segmentError.response?.data || segmentError.message);
        // Continue with other segments even if one fails
      }
    }
    
    // Store search results temporarily (in production, use Redis or database)
    global.flightSearchResults = global.flightSearchResults || {};
    global.flightSearchResults[searchId] = {
      complete: 100,
      result: allFlights,
      last_result: allFlights.length,
      segments: tripSegments.length
    };
    
    res.status(200).json({
      search_id: searchId
    });
    
  } catch (error) {
    console.error('Amadeus flight search error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.errors?.[0]?.detail || 'Error searching flights',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get search results
// @route   GET /api/flights/results/:searchId
// @access  Public
exports.getFlightSearchResults = asyncHandler(async (req, res) => {
  const { searchId } = req.params;
  const { after } = req.query;
  
  // Retrieve stored results
  const results = global.flightSearchResults?.[searchId];
  
  if (!results) {
    return res.status(404).json({
      success: false,
      message: 'Search results not found or expired'
    });
  }
  
  // Handle pagination if needed
  let filteredResults = results.result;
  if (after) {
    const afterIndex = parseInt(after);
    filteredResults = results.result.slice(afterIndex);
  }
  
  res.status(200).json({
    complete: results.complete,
    result: filteredResults,
    last_result: results.last_result
  });
});

// Helper function to transform Amadeus response to frontend format
// Helper function to get airline name from IATA code
function getAirlineName(iataCode) {
  const airlineMap = {
    'MS': 'EgyptAir',
    'EK': 'Emirates',
    'TK': 'Turkish Airlines', 
    'QR': 'Qatar Airways',
    'SV': 'Saudi Arabian Airlines',
    'KU': 'Kuwait Airways',
    'GF': 'Gulf Air',
    'UX': 'Air Europa',
    'QR': 'Qatar Airways',
    'RJ': 'Royal Jordanian',
    'WY': 'Oman Air',
    'SV': 'Saudia',
    'EK': 'Emirates',
    'ET': 'Ethiopian Airlines',
    'TK': 'Turkish Airlines',
    'A3': 'Aegean Airlines',
    'XY': 'Flynas', 
    'VF': 'Ajet',
    'ME': 'Middle East Airlines',
    'EY': 'Etihad Airways',
    'NE': 'Nile Air',
    'NP': 'Nemsa Airlines',
    'AH': 'Air Algerie',
    'X1': 'Hahn Air',
    'JL': 'Japan Airlines',
    'FZ': 'FlyDubai',
    'PK': 'Pakistan Airlines',
    'AI': 'Air India',
    'PC': 'Pegasus Airlines',
    'AZ': 'ITA Airways',
    'XQ': 'SunExpress',
    'KQ': 'Kenya Airways',
    '3U': 'Sichuan Airlines',
    'MH': 'Malaysia Airlines'

  };
  return airlineMap[iataCode] || iataCode;
}

// Helper function to parse duration from ISO 8601 format
function parseDuration(isoDuration) {
  if (!isoDuration) return { hours: 0, minutes: 0, total: 0 };
  
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return { hours: 0, minutes: 0, total: 0 };
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const total = hours * 60 + minutes;
  
  return { hours, minutes, total };
}

// Helper function to format duration for display
function formatDuration(isoDuration) {
  const { hours, minutes } = parseDuration(isoDuration);
  return `${hours}h ${minutes}m`;
}

// Enhanced transformation function
function transformAmadeusToFrontendFormat(amadeusFlights, searchId, searchQuery) {
  return amadeusFlights.map((flight, index) => {
    const firstItinerary = flight.itineraries[0];
    const firstSegment = firstItinerary.segments[0];
    const lastSegment = firstItinerary.segments[firstItinerary.segments.length - 1];
    
    // Get cabin class from travelerPricings or use default
    const cabinClass = flight.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin || 'ECONOMY';
    
    // Calculate total duration
    const totalDuration = parseDuration(firstItinerary.duration);
    
    // Get stops information
    const stops = firstItinerary.segments.length > 1 
      ? firstItinerary.segments.slice(0, -1).map(segment => ({
          airport: segment.arrival.iataCode,
          city: segment.arrival.iataCode, // You might want to map this to actual city names
          duration: segment.arrival.at // Layover time would need to be calculated
        }))
      : [];
    
    // Get baggage information
    const baggageInfo = flight.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.includedCheckedBags;
    const baggageDesc = baggageInfo ? 
      `${baggageInfo.quantity || 1} x ${baggageInfo.weight || 23}${baggageInfo.weightUnit || 'KG'}` : 
      '1 x 23KG';
    
    return {
      price: parseFloat(flight.price.total),
      tax: parseFloat(flight.price.total) - parseFloat(flight.price.base),
      refundable_info: flight.pricingOptions?.refundableFare ? 'Refundable' : 'Non-refundable',
      fare_key: flight.id,
      fare_brand: flight.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.brandedFare || 'Standard',
      price_breakdowns: {
        ADT: {
          total: parseFloat(flight.price.total),
          price: parseFloat(flight.price.base),
          label: 'Adult',
          tax: parseFloat(flight.price.total) - parseFloat(flight.price.base)
        },
        CHD: { total: 0, price: 0, label: 'Child', tax: 0 },
        INF: { total: 0, price: 0, label: 'Infant', tax: 0 }
      },
      legs: [{
        leg_id: `leg_${index}`,
        duration: totalDuration.total, // Duration in minutes
        duration_formatted: formatDuration(firstItinerary.duration),
        stops_count: stops.length,
        stops_info: stops,
        bags: {
          ADT: {
            cabin: { desc: flight.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.includedCheckedBags?.quantity || '1 piece' },
            checked: { desc: baggageDesc }
          },
          CHD: {
            cabin: { desc: '1 piece' },
            checked: { desc: baggageDesc }
          },
          INF: {
            cabin: { desc: '1 piece' },
            checked: { desc: '0 piece' }
          }
        },
        segments: firstItinerary.segments.map((segment, segIndex) => {
          const segmentDuration = parseDuration(segment.duration);
          return {
            cabin: cabinClass,
            cabin_name: cabinClass,
            farebase: flight.travelerPricings?.[0]?.fareDetailsBySegment?.[segIndex]?.fareBasis || '',
            seats: '9',
            class: cabinClass.charAt(0),
            from: {
              date: segment.departure.at,
              airport: segment.departure.iataCode,
              city: segment.departure.iataCode,
              country: '',
              country_iso: '',
              terminal: segment.departure.terminal || '',
              airport_name: segment.departure.iataCode
            },
            to: {
              date: segment.arrival.at,
              airport: segment.arrival.iataCode,
              city: segment.arrival.iataCode,
              country: '',
              country_iso: '',
              terminal: segment.arrival.terminal || '',
              airport_name: segment.arrival.iataCode
            },
            equipment: segment.aircraft?.code || '',
            equipment_name: segment.aircraft?.code || '',
            flightnumber: `${segment.carrierCode}${segment.number}`,
            iata: segment.carrierCode,
            airline_name: getAirlineName(segment.carrierCode),
            airline_code: segment.carrierCode,
            duration: segmentDuration.total,
            duration_formatted: formatDuration(segment.duration)
          };
        }),
        from: {
          date: firstSegment.departure.at,
          airport: firstSegment.departure.iataCode,
          city: firstSegment.departure.iataCode,
          country: '',
          country_iso: '',
          terminal: firstSegment.departure.terminal || '',
          airport_name: firstSegment.departure.iataCode
        },
        to: {
          date: lastSegment.arrival.at,
          airport: lastSegment.arrival.iataCode,
          city: lastSegment.arrival.iataCode,
          country: '',
          country_iso: '',
          terminal: lastSegment.arrival.terminal || '',
          airport_name: lastSegment.arrival.iataCode
        },
        cabin: cabinClass,
        seats: 9,
        iata: firstItinerary.segments.map(s => s.carrierCode),
        stops: stops.map(stop => stop.airport),
        stop_over: stops,
        cabin_name: cabinClass,
        airline_name: getAirlineName(firstSegment.carrierCode),
        main_airline_code: firstSegment.carrierCode
      }],
      trip_id: `trip_${searchId}_${index}`,
      search_id: searchId,
      src: 'amadeus',
      id: flight.id,
      total_pax_no_inf: searchQuery.adt + searchQuery.chd,
      search_query: searchQuery,
      currency: flight.price.currency,
      can_hold: flight.pricingOptions?.holdable || false,
      can_void: false,
      can_refund: flight.pricingOptions?.refundableFare || false,
      can_exchange: false,
      etd: firstSegment.departure.at,
      // Additional fields for better frontend display
      airline_name: getAirlineName(firstSegment.carrierCode),
      airline_code: firstSegment.carrierCode,
      total_duration: totalDuration.total,
      total_duration_formatted: formatDuration(firstItinerary.duration),
      stops_count: stops.length,
      baggage_allowance: baggageDesc
    };
  });
}
