import { api } from '../config/api';

export interface FlightSegment {
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
  flightSegments: FlightSegment[];
  passengers: PassengerCount;
  cabin?: 'e' | 'p' | 'b' | 'f'; // e: Economy, p: PremiumEconomy, b: Business, f: First
  direct?: boolean;
}

export interface FlightSearchResponse {
  search_id: string;
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

export interface FlightSegment {
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
}

export interface Flight {
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
  legs: FlightLeg[];
  trip_id: string;
  search_id: string;
  src: string;
  id: string;
  total_pax_no_inf: number;
  search_query: {
    trips: Array<{
      from: string;
      to: string;
      date: string;
    }>;
    adt: number;
    chd: number;
    inf: number;
    options: {
      direct: boolean;
      cabin: string;
      multiCity: boolean;
    };
  };
  currency: string;
  can_hold: boolean;
  can_void: boolean;
  can_refund: boolean;
  can_exchange: boolean;
  etd: string;
}

export interface FlightSearchResults {
  complete: number;
  result: Flight[];
  last_result: number;
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

export const getSearchResults = async (searchId: string, after?: number): Promise<FlightSearchResults> => {
  const response = await api.get(`/flights/results/${searchId}`, {
    params: after ? { after } : undefined
  });
  return response.data;
};



