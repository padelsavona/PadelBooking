import { api } from './api';
import { AdminBlockRequest, Booking, BookingCreate } from '../types';

type BookingApi = {
  id: number | string;
  court_id?: number | string;
  courtId?: number | string;
  start_time?: string;
  end_time?: string;
  startTime?: string;
  endTime?: string;
  total_price?: number;
  totalPrice?: number;
  status?: string;
  notes?: string;
  court?: { id: number | string; name?: string };
  user?: { id: string; name?: string; email?: string };
};

const normalizeBooking = (raw: BookingApi) => ({
  ...raw,
  id: raw.id,
  courtId: raw.courtId ?? raw.court_id ?? raw.court?.id,
  court_id: raw.court_id ?? raw.courtId ?? raw.court?.id,
  start_time: raw.start_time ?? raw.startTime ?? '',
  end_time: raw.end_time ?? raw.endTime ?? '',
  startTime: raw.startTime ?? raw.start_time,
  endTime: raw.endTime ?? raw.end_time,
  total_price: Number(raw.total_price ?? raw.totalPrice ?? 0),
  totalPrice: Number(raw.totalPrice ?? raw.total_price ?? 0),
  status: String(raw.status ?? ''),
  notes: raw.notes,
});

export const bookingService = {
  async getBookings(): Promise<Booking[]> {
    const response = await api.get<BookingApi[]>('/bookings');
    return response.data.map(normalizeBooking) as Booking[];
  },

  async createBooking(data: BookingCreate): Promise<Booking> {
    const response = await api.post<Booking>('/bookings', {
      courtId: String(data.court_id),
      startTime: data.start_time,
      endTime: data.end_time,
      notes: data.notes,
    });
    return normalizeBooking(response.data as unknown as BookingApi) as Booking;
  },

  async cancelBooking(id: number | string): Promise<void> {
    await api.patch(`/bookings/${id}`, { status: 'CANCELLED' });
  },

  async blockTimeslot(data: AdminBlockRequest): Promise<Booking> {
    const response = await api.post<Booking>('/bookings/block', {
      courtId: String(data.court_id),
      startTime: data.start_time,
      endTime: data.end_time,
      notes: data.notes,
    });
    return normalizeBooking(response.data as unknown as BookingApi) as Booking;
  },

  async createBookingAsAdmin(data: {
    userEmail: string;
    courtId: number | string;
    startTime: string;
    endTime: string;
    notes?: string;
    status?: 'PENDING' | 'CONFIRMED' | 'BLOCKED';
  }): Promise<Booking> {
    const response = await api.post<Booking>('/bookings/admin', {
      userEmail: data.userEmail,
      courtId: String(data.courtId),
      startTime: data.startTime,
      endTime: data.endTime,
      notes: data.notes,
      status: data.status,
    });
    return normalizeBooking(response.data as unknown as BookingApi) as Booking;
  },

  async updateBookingAsAdmin(
    id: number | string,
    data: {
      courtId?: number | string;
      startTime?: string;
      endTime?: string;
      notes?: string;
      status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'BLOCKED';
    }
  ): Promise<Booking> {
    const response = await api.patch<Booking>(`/bookings/${id}/admin`, {
      ...(data.courtId !== undefined ? { courtId: String(data.courtId) } : {}),
      ...(data.startTime !== undefined ? { startTime: data.startTime } : {}),
      ...(data.endTime !== undefined ? { endTime: data.endTime } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
    });
    return normalizeBooking(response.data as unknown as BookingApi) as Booking;
  },

  async deleteBookingAsAdmin(id: number | string): Promise<void> {
    await api.delete(`/bookings/${id}`);
  },

  async listBookings() {
    const res = await api.get('/bookings');
    return (res.data as BookingApi[]).map(normalizeBooking);
  },
};
