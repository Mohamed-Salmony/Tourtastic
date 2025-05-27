import api from './api';

export interface CartItem {
  id: string;
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

class CartService {  async getCartItems(): Promise<CartItem[]> {
    const response = await api.get('/cart');
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to load cart items');
    }
    return response.data.data;
  }

  async removeFromCart(itemId: string): Promise<void> {
    await api.delete(`/bookings/cart/${itemId}`);
  }

  async updateQuantity(itemId: string, quantity: number): Promise<void> {
    await api.patch(`/bookings/cart/${itemId}`, { quantity });
  }  async checkout(): Promise<void> {
    const response = await api.post('/cart/checkout');
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to confirm booking');
    }
  }
}

export const cartService = new CartService();
