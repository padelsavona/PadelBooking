import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getPricingQuote } from '../services/pricing.service.js';

const pricingQuoteSchema = z.object({
  courtId: z.string().uuid(),
  start: z.string().datetime(),
  end: z.string().datetime(),
});

export default async function pricingRoutes(fastify: FastifyInstance) {
  fastify.get('/quote', async (request) => {
    const query = pricingQuoteSchema.parse(request.query);

    let userId: string | undefined;
    try {
      await request.jwtVerify();
      const user = request.user as { id?: string };
      userId = user.id;
    } catch {
      userId = undefined;
    }

    return getPricingQuote({
      courtId: query.courtId,
      startTime: new Date(query.start),
      endTime: new Date(query.end),
      userId,
    });
  });
}
