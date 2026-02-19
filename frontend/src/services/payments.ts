import { api } from './api';
import { CheckoutRequest, CheckoutResponse } from '../types';

export const paymentService = {
  async createCheckoutSession(data: CheckoutRequest): Promise<CheckoutResponse> {
    const response = await api.post<CheckoutResponse>('/payments/create-checkout-session', data);
    return response.data;
  },
};
