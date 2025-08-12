import api  from '../config/api';

export interface FlightSearchInputSegment {
  from: string;
  to: string;
  date: string;
}

export interface PassengerCount {
  adults: number;
  children: number;
  infants: number;
}

export interface FlightSearchParams {
  flightSegments: FlightSearchInputSegment[];
  passengers: PassengerCount;
  cabin?: 'e' | 'p' | 'b' | 'f'; // e: Economy, p: PremiumEconomy, b: Business, f: First
  direct?: boolean;
}

export interface FlightSearchResponse {
  search_id: string;
}

// Fixed FlightSearchResults interface to match backend response
export interface FlightSearchResults {
  complete: number; // Progress percentage (0-100)
  result: Flight[]; // Array of flights
  last_result: number; // Last result index for pagination
}

export interface Airport {
  date: string;
  airport: string;
  city: string;
  country: string;
  country_iso: string;
  terminal: string;
  airport_name: string;
}

export interface BaggageInfo {
  cabin: {
    desc: string;
  };
  checked: {
    desc: string;
  };
}

export interface PriceBreakdown {
  total: number;
  price: number;
  label: string;
  tax: number;
}

export interface FlightSegment {
  [x: string]: Key;
  cabin: string;
  cabin_name: string;
  farebase: string;
  seats: string;
  class: string;
  from: Airport;
  to: Airport;
  equipment: string;
  equipment_name: string;
  flightnumber: string;
  iata: string;
  airline_name: string;
  duration: number;
  // Enhanced fields
  airline_code?: string;
  duration_formatted?: string;
}

export interface FlightLeg {
  leg_id: string;
  duration: number;
  bags: {
    ADT: BaggageInfo;
    CHD: BaggageInfo;
    INF: BaggageInfo;
  };
  segments: FlightSegment[];
  from: Airport;
  to: Airport;
  cabin: string;
  seats: number;
  iata: string[];
  stops: string[];
  stop_over: string[];
  cabin_name: string;
  // Enhanced fields
  duration_formatted?: string;
  stops_count?: number;
  stops_info?: Array<{
    airport: string;
    city: string;
    duration?: string;
  }>;
  airline_name?: string;
  main_airline_code?: string;
}

// Fixed Flight interface with all required properties
export interface Flight {
  // Required properties that were missing
  trip_id: string;
  search_query: {
    adt: number;
    chd: number;
    inf: number;
    options: {
      cabin: string;
      direct?: boolean;
      multiCity?: boolean;
    };
  };
  currency: string;
  
  // Existing properties
  price: number;
  tax: number;
  refundable_info: string;
  fare_key: string;
  fare_brand: string;
  price_breakdowns: {
    ADT: PriceBreakdown;
    CHD: PriceBreakdown;
    INF: PriceBreakdown;
  };

  // Add these new fields
  total_price?: number; // Pre-calculated total from backend
  cabin_class?: string; // Flight-level cabin class
  carry_on_baggage?: string;
  checked_baggage?: string;
  airline_logo_url?: string;
  departure_time_formatted?: string;
  arrival_time_formatted?: string;
  layover_details?: Array<{
    airport: string;
    city: string;
    duration: string;
    terminal?: string;
  }>;
  
  // Enhanced fields
  airline_name?: string;
  airline_code?: string;
  total_duration?: number;
  total_duration_formatted?: string;
  stops_count?: number;
  baggage_allowance?: string;
  segment_index?: number;
  
  // Add missing booking-related properties
  can_refund?: boolean;
  can_hold?: boolean;
  can_void?: boolean;
  can_exchange?: boolean;
  
  // Enhanced leg information
  legs: FlightLeg[];
}

export const searchFlights = async (params: FlightSearchParams): Promise<FlightSearchResponse> => {
  // Format trips string according to Seeru API format: ORIGIN-DESTINATION-DATE
  const tripsString = params.flightSegments
    .map(segment => {
      // Ensure the date is in YYYY-MM-DD format
      const formattedDate = segment.date.replace(/-/g, '');
      return `${segment.from}-${segment.to}-${formattedDate}`;
    })
    .join(':');

  try {
    const response = await api.get(`/flights/search/${tripsString}/${params.passengers.adults}/${params.passengers.children}/${params.passengers.infants}`, {
      params: {
        cabin: params.cabin || 'e',
        direct: params.direct ? 1 : 0
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching flights:', error);
    throw error;
  }
};

// Add simple cache for search results
const searchCache = new Map<string, { data: FlightSearchResults; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getSearchResults = async (searchId: string, after?: number): Promise<FlightSearchResults> => {
  const cacheKey = `${searchId}-${after || 0}`;
  const cached = searchCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  try {
    const response = await api.get(`/flights/results/${searchId}`, {
      params: after ? { after } : undefined
    });
    
    // Validate response structure
    if (!response.data || typeof response.data.complete !== 'number') {
      throw new Error('Invalid response structure from flight search API');
    }
    
    searchCache.set(cacheKey, { data: response.data, timestamp: Date.now() });
    return response.data;
  } catch (error) {
    console.error('Error fetching search results:', error);
    throw error;
  }
};



