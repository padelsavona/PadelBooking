import { FastifyInstance } from 'fastify';
import { createCheckoutSession, handleWebhook } from '../services/payment.service.js';
import { authenticate } from '../middleware/auth.middleware.js';

export default async function paymentRoutes(fastify: FastifyInstance) {
  // Create checkout session
  fastify.post('/create-checkout-session', { onRequest: [authenticate] }, async (request) => {
    const user = request.user as { id: string };
    const { bookingId } = request.body as { bookingId: string };

    return createCheckoutSession(bookingId, user.id);
  });

  // Stripe webhook
  fastify.post('/webhook', async (request) => {
    const signature = request.headers['stripe-signature'] as string;
    const rawBody = request.body as Buffer;

    await handleWebhook(rawBody, signature);
    return { received: true };
  });
}
