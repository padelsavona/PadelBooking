import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import prisma from '../db.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { AppError } from '../errors.js';

const updateMembershipSchema = z.object({
  email: z.string().email(),
  membershipStatus: z.enum(['MEMBER', 'NON_MEMBER']),
  membershipExpiresAt: z.string().datetime().nullable().optional(),
});

export default async function userRoutes(fastify: FastifyInstance) {
  fastify.get('/', { onRequest: [authenticate, requireAdmin] }, async () => {
    return prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        membershipStatus: true,
        membershipExpiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  });

  fastify.patch('/membership', { onRequest: [authenticate, requireAdmin] }, async (request) => {
    const body = updateMembershipSchema.parse(request.body);

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) {
      throw new AppError(404, 'Utente non trovato', 'USER_NOT_FOUND');
    }

    return prisma.user.update({
      where: { id: user.id },
      data: {
        membershipStatus: body.membershipStatus,
        membershipExpiresAt: body.membershipExpiresAt ? new Date(body.membershipExpiresAt) : null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        membershipStatus: true,
        membershipExpiresAt: true,
      },
    });
  });
}
