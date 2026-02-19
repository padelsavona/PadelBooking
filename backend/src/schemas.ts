import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const createBookingSchema = z.object({
  courtId: z.string().uuid(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  notes: z.string().optional(),
});

export const updateBookingSchema = z.object({
  status: z.enum(['CANCELLED']),
});

export const createCourtSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  pricePerHour: z.number().positive(),
});

export const updateCourtSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  pricePerHour: z.number().positive().optional(),
  isActive: z.boolean().optional(),
});

export const blockTimeSchema = z.object({
  courtId: z.string().uuid(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  notes: z.string().optional(),
});
