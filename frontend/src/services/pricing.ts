import { api } from './api';

export interface PricingQuote {
  courtId: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  hourlyRate: number;
  totalPrice: number;
  tariffType: 'MEMBER' | 'STANDARD';
  tariffLabel: string;
}

export const pricingService = {
  async getQuote(params: { courtId: string; start: string; end: string }): Promise<PricingQuote> {
    const response = await api.get<PricingQuote>('/pricing/quote', {
      params,
    });
    return response.data;
  },
};
