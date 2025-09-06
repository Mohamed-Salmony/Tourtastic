import api  from '../config/api';

interface LocalizedString {
  en: string;
  ar: string;
}

interface LocalizedArray {
  en: string;
  ar: string;
}

export interface Destination {
  _id: string;
  name: LocalizedString;
  country: LocalizedString;
  description: LocalizedString;
  rating: number;
  image: string;
  topAttractions: LocalizedArray[];
  localCuisine: LocalizedArray[];
  shopping: LocalizedArray[];
  bestTimeToVisit: LocalizedString;
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

export const updateDestination = async (id: string, data: Partial<Destination>): Promise<Destination> => {
  // Admin update endpoint - server expects this under /api/admin/destinations/:id
  // Support FormData (for file upload)
  let response;
  if (data instanceof FormData) {
  response = await api.put(`/admin/destinations/${id}`, data);
  } else {
    response = await api.put(`/admin/destinations/${id}`, data);
  }
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to update destination');
  }
  return response.data.data;
};

export const createDestination = async (data: FormData): Promise<Destination> => {
  const response = await api.post('/admin/destinations', data);
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to create destination');
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

export const deleteDestination = async (id: string): Promise<void> => {
  const response = await api.delete(`/admin/destinations/${id}`);
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to delete destination');
  }
  return;
};