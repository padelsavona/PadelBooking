import { api } from './api';
import { Booking, BookingCreate } from '../types';

export const bookingService = {
  async getBookings(): Promise<Booking[]> {
    const response = await api.get<Booking[]>('/bookings');
    return response.data;
  },

  async createBooking(data: BookingCreate): Promise<Booking> {
    const response = await api.post<Booking>('/bookings', data);
    return response.data;
  },

  async cancelBooking(id: number): Promise<void> {
    await api.delete(`/bookings/${id}`);
  },
};
