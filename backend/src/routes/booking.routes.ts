import { FastifyInstance } from 'fastify';
import {
  createBookingSchema,
  updateBookingSchema,
  blockTimeSchema,
  adminCreateBookingSchema,
  adminUpdateBookingSchema,
} from '../schemas.js';
import {
  createBooking,
  getBookingById,
  getUserBookings,
  cancelBooking,
  getAllBookings,
  createBookingForUser,
  updateBookingAsAdmin,
  deleteBookingAsAdmin,
} from '../services/booking.service.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

export default async function bookingRoutes(fastify: FastifyInstance) {
  const normalizeBookingPayload = (payload: unknown) => {
    const body = (payload || {}) as Record<string, string | undefined>;
    return {
      courtId: body.courtId ?? body.court_id,
      startTime: body.startTime ?? body.start_time,
      endTime: body.endTime ?? body.end_time,
      notes: body.notes,
    };
  };

  // Create booking
  fastify.post('/', { onRequest: [authenticate] }, async (request) => {
    const user = request.user as { id: string };
    const body = createBookingSchema.parse(normalizeBookingPayload(request.body));

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
    const body = blockTimeSchema.parse(normalizeBookingPayload(request.body));

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

  // Get bookings (admin sees all, users see their own)
  fastify.get('/', { onRequest: [authenticate] }, async (request) => {
    const user = request.user as { id: string; role: string };
    if (user.role === 'ADMIN') {
      return getAllBookings();
    }
    return getUserBookings(user.id);
  });

  // Create booking for a user (admin only)
  fastify.post('/admin', { onRequest: [authenticate, requireAdmin] }, async (request) => {
    const body = request.body as Record<string, unknown>;
    const normalized = {
      userId: body.userId,
      userEmail: body.userEmail ?? body.user_email,
      courtId: body.courtId ?? body.court_id,
      startTime: body.startTime ?? body.start_time,
      endTime: body.endTime ?? body.end_time,
      notes: body.notes,
      status: body.status,
    };

    const data = adminCreateBookingSchema.parse(normalized);
    return createBookingForUser({
      userId: data.userId,
      userEmail: data.userEmail,
      courtId: data.courtId,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      notes: data.notes,
      status: data.status,
    });
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

  // Update booking (admin only)
  fastify.patch('/:id/admin', { onRequest: [authenticate, requireAdmin] }, async (request) => {
    const { id } = request.params as { id: string };
    const body = request.body as Record<string, unknown>;
    const normalized = {
      courtId: body.courtId ?? body.court_id,
      startTime: body.startTime ?? body.start_time,
      endTime: body.endTime ?? body.end_time,
      notes: body.notes,
      status: body.status,
    };
    const data = adminUpdateBookingSchema.parse(normalized);

    return updateBookingAsAdmin(id, {
      courtId: data.courtId,
      startTime: data.startTime ? new Date(data.startTime) : undefined,
      endTime: data.endTime ? new Date(data.endTime) : undefined,
      notes: data.notes,
      status: data.status,
    });
  });

  // Delete booking (admin only)
  fastify.delete('/:id', { onRequest: [authenticate, requireAdmin] }, async (request) => {
    const { id } = request.params as { id: string };
    return deleteBookingAsAdmin(id);
  });
}
