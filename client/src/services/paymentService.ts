import api from './api';
import crypto from 'crypto-js';

const ECASH_PAYMENT_GATEWAY_URL = 'https://checkout.ecash-pay.com';
const TERMINAL_KEY = 'RJ757K';
const MERCHANT_KEY = 'SLZC0W';
const MERCHANT_SECRET = '8Z1VLNPK27QOX0619WFMDADY6J48NJYIQTT3BGGYCDYJ7JUA2HOKKXFT1UNBT35R';

export interface PaymentResponse {
  isSuccess: boolean;
  message: string | null;
  orderRef: string | null;
  transactionNo: string | null;
  amount: number;
  token: string | null;
}

class PaymentService {
  private generateVerificationCode(amount: number, orderRef: string): string {
    const hashString = `${MERCHANT_KEY}${MERCHANT_SECRET}${amount}${orderRef}`;
    return crypto.MD5(hashString).toString().toUpperCase();
  }

  private generateCallbackToken(transactionNo: string, amount: number, orderRef: string): string {
    const hashString = `${MERCHANT_KEY}${MERCHANT_SECRET}${transactionNo}${amount}${orderRef}`;
    return crypto.MD5(hashString).toString().toUpperCase();
  }

  async initiatePayment(amount: number, orderRef: string): Promise<string> {
    const verificationCode = this.generateVerificationCode(amount, orderRef);
    const redirectUrl = encodeURIComponent(`${window.location.origin}/payment/success`);
    const callbackUrl = encodeURIComponent(`${window.location.origin}/api/payment/callback`);

    const paymentUrl = `${ECASH_PAYMENT_GATEWAY_URL}/Checkout/CardCheckout?tk=${TERMINAL_KEY}&mid=${MERCHANT_KEY}&vc=${verificationCode}&c=SYP&a=${amount}&lang=EN&or=${orderRef}&ru=${redirectUrl}&cu=${callbackUrl}`;
    
    return paymentUrl;
  }

  verifyCallbackToken(response: PaymentResponse): boolean {
    if (!response.token || !response.transactionNo || !response.amount || !response.orderRef) {
      return false;
    }

    const expectedToken = this.generateCallbackToken(
      response.transactionNo,
      response.amount,
      response.orderRef
    );

    return response.token === expectedToken;
  }
}

export const paymentService = new PaymentService(); 