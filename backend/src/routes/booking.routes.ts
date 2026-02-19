import { FastifyInstance } from 'fastify';
import { createBookingSchema, updateBookingSchema, blockTimeSchema } from '../schemas.js';
import {
  createBooking,
  getBookingById,
  getUserBookings,
  cancelBooking,
} from '../services/booking.service.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

export default async function bookingRoutes(fastify: FastifyInstance) {
  // Create booking
  fastify.post('/', { onRequest: [authenticate] }, async (request) => {
    const user = request.user as { id: string };
    const body = createBookingSchema.parse(request.body);

    const booking = await createBooking(
      user.id,
      body.courtId,
      new Date(body.startTime),
      new Date(body.endTime),
      body.notes
    );

    return booking;
  });

  // Block time (admin only)
  fastify.post('/block', { onRequest: [authenticate, requireAdmin] }, async (request) => {
    const user = request.user as { id: string };
    const body = blockTimeSchema.parse(request.body);

    const booking = await createBooking(
      user.id,
      body.courtId,
      new Date(body.startTime),
      new Date(body.endTime),
      body.notes,
      true // isAdminBlock
    );

    return booking;
  });

  // Get user's bookings
  fastify.get('/my-bookings', { onRequest: [authenticate] }, async (request) => {
    const user = request.user as { id: string };
    return getUserBookings(user.id);
  });

  // Get booking by ID
  fastify.get('/:id', { onRequest: [authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    return getBookingById(id);
  });

  // Cancel booking
  fastify.patch('/:id', { onRequest: [authenticate] }, async (request) => {
    const user = request.user as { id: string; role: string };
    const { id } = request.params as { id: string };
    const body = updateBookingSchema.parse(request.body);

    if (body.status === 'CANCELLED') {
      return cancelBooking(id, user.id, user.role === 'ADMIN');
    }

    return getBookingById(id);
  });
}
