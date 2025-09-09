import api from '../config/api';

interface WishlistItem {
  _id: string;
  name: { [key: string]: string };
  country: { [key: string]: string };
  image: string;
  rating: number;
  popular: boolean;
}

class WishlistService {
  async getWishlist(id: string): Promise<WishlistItem[]> {
    const response = await api.get(`/users/${id}/wishlist`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to load wishlist');
    }
    return response.data.data;
  }

  async addToWishlist(id: string, destinationId: string): Promise<void> {
    try {
      const response = await api.post(`/users/${id}/wishlist`, {
        destinationId: destinationId
      });
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to add to wishlist');
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response?: { data?: { error?: string } } };
        if (apiError.response?.data?.error) {
          throw new Error(apiError.response.data.error);
        }
      }
      throw error;
    }
  }

  async removeFromWishlist(id: string, destinationId: string): Promise<void> {
    const response = await api.delete(`/users/${id}/wishlist/${destinationId}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to remove from wishlist');
    }
  }
}

export const wishlistService = new WishlistService();