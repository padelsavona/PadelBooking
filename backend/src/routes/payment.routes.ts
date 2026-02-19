import { FastifyInstance } from 'fastify';
import { createCheckoutSession, handleWebhook } from '../services/payment.service.js';
import { authenticate } from '../middleware/auth.middleware.js';

export default async function paymentRoutes(fastify: FastifyInstance) {
  // Create checkout session
  fastify.post('/create-checkout-session', { onRequest: [authenticate] }, async (request, reply) => {
    const user = request.user as any;
    const { bookingId } = request.body as { bookingId: string };

    return createCheckoutSession(bookingId, user.id);
  });

  // Stripe webhook
  fastify.post('/webhook', async (request, reply) => {
    const signature = request.headers['stripe-signature'] as string;
    const rawBody = request.body as any;

    await handleWebhook(rawBody, signature);
    return { received: true };
  });
}
