import { FastifyInstance } from 'fastify';
import { createCourtSchema, updateCourtSchema } from '../schemas.js';
import {
  getAllCourts,
  getCourtById,
  createCourt,
  updateCourt,
  deleteCourt,
} from '../services/court.service.js';
import { getCourtBookings } from '../services/booking.service.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

export default async function courtRoutes(fastify: FastifyInstance) {
  // Get all courts (public)
  fastify.get('/', async () => {
    return getAllCourts();
  });

  // Get court by ID (public)
  fastify.get('/:id', async (request) => {
    const { id } = request.params as { id: string };
    return getCourtById(id);
  });

  // Get court bookings (public)
  fastify.get('/:id/bookings', async (request) => {
    const { id } = request.params as { id: string };
    const { startDate, endDate } = request.query as { startDate?: string; endDate?: string };

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return getCourtBookings(id, start, end);
  });

  // Create court (admin only)
  fastify.post('/', { onRequest: [authenticate, requireAdmin] }, async (request) => {
    const body = createCourtSchema.parse(request.body);
    return createCourt(body);
  });

  // Update court (admin only)
  fastify.patch('/:id', { onRequest: [authenticate, requireAdmin] }, async (request) => {
    const { id } = request.params as { id: string };
    const body = updateCourtSchema.parse(request.body);
    return updateCourt(id, body);
  });

  // Delete court (admin only)
  fastify.delete('/:id', { onRequest: [authenticate, requireAdmin] }, async (request) => {
    const { id } = request.params as { id: string };
    return deleteCourt(id);
  });
}
