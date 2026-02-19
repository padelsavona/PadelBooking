import { api } from './api';
import { AdminBlockRequest, Booking, BookingCreate } from '../types';

type BookingApi = {
  id: number | string;
  court_id?: number | string;
  courtId?: number | string;
  court?: { id: number | string; name?: string };
};

const normalizeBooking = (raw: BookingApi) => ({
  ...raw,
  courtId: raw.courtId ?? raw.court_id ?? raw.court?.id,
});

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

  async blockTimeslot(data: AdminBlockRequest): Promise<Booking> {
    const response = await api.post<Booking>('/bookings/block', data);
    return response.data;
  },

  async listBookings() {
    const res = await api.get('/bookings');
    return (res.data as BookingApi[]).map(normalizeBooking);
  },
};
