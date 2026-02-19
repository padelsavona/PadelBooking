import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { Court, Booking } from '../types';

export const useCourts = () => {
  return useQuery({
    queryKey: ['courts'],
    queryFn: async () => {
      const { data } = await api.get<Court[]>('/courts');
      return data;
    },
  });
};

export const useCourtBookings = (courtId: string, startDate?: Date, endDate?: Date) => {
  return useQuery({
    queryKey: ['court-bookings', courtId, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());

      const { data } = await api.get<Booking[]>(`/courts/${courtId}/bookings?${params}`);
      return data;
    },
    enabled: !!courtId,
  });
};

export const useMyBookings = () => {
  return useQuery({
    queryKey: ['my-bookings'],
    queryFn: async () => {
      const { data } = await api.get<Booking[]>('/bookings/my-bookings');
      return data;
    },
  });
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (booking: {
      courtId: string;
      startTime: string;
      endTime: string;
      notes?: string;
    }) => {
      const { data } = await api.post<Booking>('/bookings', booking);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['court-bookings'] });
    },
  });
};

export const useCancelBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { data } = await api.patch<Booking>(`/bookings/${bookingId}`, {
        status: 'CANCELLED',
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['court-bookings'] });
    },
  });
};

export const useCreateCheckout = () => {
  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { data } = await api.post<{ sessionUrl: string }>('/payments/create-checkout-session', {
        bookingId,
      });
      return data;
    },
  });
};

export const useBlockTime = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (block: {
      courtId: string;
      startTime: string;
      endTime: string;
      notes?: string;
    }) => {
      const { data } = await api.post<Booking>('/bookings/block', block);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['court-bookings'] });
    },
  });
};
