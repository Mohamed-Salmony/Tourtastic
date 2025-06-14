import { api } from '@/config/api';

export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export const findNearestAirport = async (latitude: number, longitude: number): Promise<Airport> => {
  try {
    // Get all airports from the backend
    const response = await api.get('/airports');
    const airports: Airport[] = response.data.data;

    // Find the nearest airport
    let nearestAirport = airports[0];
    let shortestDistance = calculateDistance(
      latitude,
      longitude,
      airports[0].latitude,
      airports[0].longitude
    );

    for (const airport of airports) {
      const distance = calculateDistance(
        latitude,
        longitude,
        airport.latitude,
        airport.longitude
      );

      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestAirport = airport;
      }
    }

    return nearestAirport;
  } catch (error) {
    console.error('Error finding nearest airport:', error);
    // Return a default airport if the API call fails
    return {
      code: 'JFK',
      name: 'John F. Kennedy International Airport',
      city: 'New York',
      country: 'United States',
      latitude: 40.6413,
      longitude: -73.7781
    };
  }
}; 