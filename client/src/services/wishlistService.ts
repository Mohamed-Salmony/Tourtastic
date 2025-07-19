import api from '../config/api';

interface WishlistItem {
  id: string;
  destinationId: string;
  destination?: {
    id: string;
    name: string;
    image: string;
    country: string;
    rating: number;
  };
  createdAt: string;
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
    console.log('Adding to wishlist:', { id, destinationId });
    const response = await api.post(`/users/${id}/wishlist`, {
      destinationId: destinationId
    });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to add to wishlist');
    }
  }

  async removeFromWishlist(id: string, destinationId: string): Promise<void> {
    console.log('Removing from wishlist:', { id, destinationId });
    const response = await api.delete(`/users/${id}/wishlist/${destinationId}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to remove from wishlist');
    }
  }
}

export const wishlistService = new WishlistService();