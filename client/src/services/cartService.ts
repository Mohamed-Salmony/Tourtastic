import api from './api';

export interface CartItem {
  bookingId: string;
  type: string;
  name: string;
  image: string;
  details: string;
  price: number;
  quantity: number;
}

export interface PaymentDetails {
  cardholderName: string;
  cardNumber: string;
  expiryDate: string;
  cvc: string;
}

class CartService {
  async getCartItems(): Promise<CartItem[]> {
    const response = await api.get('/cart');
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to load cart items');
    }
    return response.data.data;
  }

  async removeFromCart(itemId: string): Promise<void> {
    if (!itemId) {
      throw new Error('Item ID is required');
    }
    const response = await api.delete(`/cart/${itemId}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to remove item');
    }
  }

  async updateQuantity(itemId: string, quantity: number): Promise<void> {
    if (!itemId) {
      throw new Error('Item ID is required');
    }
    const response = await api.patch(`/cart/${itemId}`, { quantity });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update quantity');
    }
  }

  async checkout(): Promise<void> {
    const response = await api.post('/cart/checkout');
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to confirm booking');
    }
  }
}

export const cartService = new CartService();
