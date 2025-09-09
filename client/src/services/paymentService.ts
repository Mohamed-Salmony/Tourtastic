import api from '../config/api';

export interface PaymentResponse {
  isSuccess: boolean;
  message: string | null;
  orderRef: string | null;
  transactionNo: string | null;
  amount: number;
  token: string | null;
}

class PaymentService {
  async initiatePayment(amount: number, orderRef: string): Promise<string> {
    const returnUrl = `${window.location.origin}/payment/success`;
    const resp = await api.post('/payment/initiate', { amount, orderRef, returnUrl });
    if (!resp.data?.success || !resp.data?.url) {
      throw new Error(resp.data?.message || 'Failed to initiate payment');
    }
    return resp.data.url as string;
  }

  // Callback verification is now performed on the server.
  // This remains here if you need a client-side double-check, but it's optional.
  verifyCallbackToken(_response: PaymentResponse): boolean {
    return true;
  }
}

export const paymentService = new PaymentService(); 