import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { errorHandler } from './errors.js';
import authRoutes from './routes/auth.routes.js';
import courtRoutes from './routes/court.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import paymentRoutes from './routes/payment.routes.js';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
  requestIdHeader: 'x-request-id',
  requestIdLogLabel: 'traceId',
});

// Register plugins
// the frontend URL(s) can be a comma-separated list –
// for example `https://app.onrender.com,https://app-1.onrender.com`
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

await fastify.register(cors, {
  origin: allowedOrigins,
  credentials: true,
});

await fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'your-secret-key',
});

await fastify.register(rateLimit, {
  max: 100,
  timeWindow: '15 minutes',
});

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

fastify.get('/ready', async () => {
  // Add database check if needed
  return { status: 'ready', timestamp: new Date().toISOString() };
});

// Register routes
await fastify.register(authRoutes, { prefix: '/api/auth' });
await fastify.register(courtRoutes, { prefix: '/api/courts' });
await fastify.register(bookingRoutes, { prefix: '/api/bookings' });
await fastify.register(paymentRoutes, { prefix: '/api/payments' });

// Error handler
fastify.setErrorHandler(errorHandler);

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: HOST });
    console.log(`Server listening on http://${HOST}:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

