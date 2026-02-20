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

export const adminCreateBookingSchema = z
  .object({
    userId: z.string().uuid().optional(),
    userEmail: z.string().email().optional(),
    courtId: z.string().uuid(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    notes: z.string().optional(),
    status: z.enum(['PENDING', 'CONFIRMED', 'BLOCKED']).optional(),
  })
  .refine((value) => Boolean(value.userId || value.userEmail), {
    message: 'Devi specificare userId oppure userEmail',
    path: ['userEmail'],
  });

export const adminUpdateBookingSchema = z.object({
  courtId: z.string().uuid().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  notes: z.string().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'BLOCKED']).optional(),
});

export const createCourtSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  pricePerHour: z.number().positive(),
  memberPricePerHour: z.number().positive().optional(),
});

export const updateCourtSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  pricePerHour: z.number().positive().optional(),
  memberPricePerHour: z.number().positive().optional(),
  isActive: z.boolean().optional(),
});

export const blockTimeSchema = z.object({
  courtId: z.string().uuid(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  notes: z.string().optional(),
});
