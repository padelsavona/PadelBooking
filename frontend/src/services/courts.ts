import { api } from './api';
import { Court, CourtAvailability } from '../types';

type CourtApi = Partial<Court> & {
  id: number | string;
  isActive?: boolean;
  pricePerHour?: number;
  memberPricePerHour?: number;
};

type BookingApi = {
  start_time?: string;
  end_time?: string;
  startTime?: string;
  endTime?: string;
};

const normalizeCourt = (court: CourtApi): Court => ({
  id: court.id,
  name: court.name || 'Campo',
  description: court.description,
  is_active: court.is_active ?? court.isActive ?? true,
  hourly_rate: court.hourly_rate ?? court.pricePerHour ?? 0,
  member_hourly_rate: court.member_hourly_rate ?? court.memberPricePerHour,
  created_at: court.created_at || new Date().toISOString(),
});

export const courtService = {
  async getCourts(activeOnly = true): Promise<Court[]> {
    try {
      const response = await api.get<CourtApi[]>('/courts/', {
        params: { active_only: activeOnly },
      });
      return response.data.map(normalizeCourt);
    } catch {
      const response = await api.get<CourtApi[]>('/courts');
      const courts = response.data.map(normalizeCourt);
      return activeOnly ? courts.filter((court) => court.is_active) : courts;
    }
  },

  async getCourt(id: number | string): Promise<Court> {
    const response = await api.get<CourtApi>(`/courts/${id}`);
    return normalizeCourt(response.data);
  },

  async getAvailability(courtId: number | string, date: string): Promise<CourtAvailability> {
    try {
      const response = await api.get<CourtAvailability>(`/courts/${courtId}/availability`, {
        params: { date },
      });
      return response.data;
    } catch {
      const dayStart = new Date(`${date}T00:00:00`);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const response = await api.get<BookingApi[]>(`/courts/${courtId}/bookings`, {
        params: {
          startDate: dayStart.toISOString(),
          endDate: dayEnd.toISOString(),
        },
      });

      const bookings = response.data;
      const occupied_hours: string[] = [];
      const free_hours: string[] = [];

      for (let hour = 0; hour < 24; hour++) {
        const slotStart = new Date(dayStart);
        slotStart.setHours(hour, 0, 0, 0);
        const slotEnd = new Date(slotStart);
        slotEnd.setHours(slotEnd.getHours() + 1);
        const slotLabel = `${String(hour).padStart(2, '0')}:00-${String((hour + 1) % 24).padStart(2, '0')}:00`;

        const isOccupied = bookings.some((booking) => {
          const bookingStartRaw = booking.start_time ?? booking.startTime;
          const bookingEndRaw = booking.end_time ?? booking.endTime;
          if (!bookingStartRaw || !bookingEndRaw) {
            return false;
          }

          const bookingStart = new Date(bookingStartRaw);
          const bookingEnd = new Date(bookingEndRaw);
          return bookingStart < slotEnd && bookingEnd > slotStart;
        });

        if (isOccupied) {
          occupied_hours.push(slotLabel);
        } else {
          free_hours.push(slotLabel);
        }
      }

      return {
        court_id: courtId,
        date,
        occupied_hours,
        free_hours,
      };
    }
  },

  async updateCourt(
    id: number | string,
    data: Partial<Pick<Court, 'name' | 'description' | 'hourly_rate' | 'member_hourly_rate' | 'is_active'>>
  ): Promise<Court> {
    const payload = {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.hourly_rate !== undefined ? { hourly_rate: data.hourly_rate, pricePerHour: data.hourly_rate } : {}),
      ...(data.member_hourly_rate !== undefined
        ? { member_hourly_rate: data.member_hourly_rate, memberPricePerHour: data.member_hourly_rate }
        : {}),
      ...(data.is_active !== undefined ? { is_active: data.is_active, isActive: data.is_active } : {}),
    };

    const response = await api.patch<CourtApi>(`/courts/${id}`, payload);
    return normalizeCourt(response.data);
  },

  async createCourt(data: Pick<Court, 'name' | 'description' | 'hourly_rate' | 'member_hourly_rate'>): Promise<Court> {
    const response = await api.post<CourtApi>('/courts', {
      name: data.name,
      description: data.description,
      pricePerHour: data.hourly_rate,
      memberPricePerHour: data.member_hourly_rate,
    });
    return normalizeCourt(response.data);
  },

  async deleteCourt(id: number | string): Promise<void> {
    await api.delete(`/courts/${id}`);
  },
};
