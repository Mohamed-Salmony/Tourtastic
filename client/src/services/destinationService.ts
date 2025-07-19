import api  from '../config/api';

export interface Destination {
  _id: string;
  name: string;
  country: string;
  description: string;
  rating: number;
  image: string;
  topAttractions: string[];
  localCuisine: string[];
  shopping: string[];
  bestTimeToVisit: string;
  quickInfo: {
    airport: string;
    timeZone: string;
  };
  // Remove airportCode since it doesn't exist in the database model
  popular: boolean;
  createdAt: string;
}

export const getAllDestinations = async (): Promise<Destination[]> => {
  const response = await api.get('/destinations');
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to load destinations');
  }
  return response.data.data;
};

export const getDestination = async (id: string): Promise<Destination> => {
  const response = await api.get(`/destinations/${id}`);
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to load destination');
  }
  return response.data.data;
};

export const updateDestinationPopular = async (id: string, popular: boolean): Promise<Destination> => {
  const response = await api.patch(`/destinations/${id}/popular`, { popular });
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to update destination');
  }
  return response.data.data;
};