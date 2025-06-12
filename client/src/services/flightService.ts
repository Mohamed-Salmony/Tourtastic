import { api } from '../config/api';

export interface FlightSearchParams {
  from: string;
  to: string;
  departureDate: string;
  returnDate?: string;
  adults?: number;
  children?: number;
  infants?: number;
}

export interface FlightSearchResponse {
  success: boolean;
  message: string;
  data: {
    searchId: string;
    status: string;
  };
}

export interface Flight {
  flightId: string;
  airline: string;
  departureAirport: string;
  arrivalAirport: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: {
    adult: number;
    child: number;
    infant: number;
    total: number;
  };
  availableSeats: number;
  class: 'Economy' | 'Business';
  layovers: Array<{
    airport: string;
    duration: string;
  }>;
}

export interface FlightSearchResults {
  success: boolean;
  data: {
    flights: Flight[];
  };
}

export const searchFlights = async (params: FlightSearchParams): Promise<FlightSearchResponse> => {
  const response = await api.get('/flights/search', { params });
  return response.data;
};

export const getSearchResults = async (searchId: string): Promise<FlightSearchResults> => {
  const response = await api.get(`/flights/results/${searchId}`);
  return response.data;
};



