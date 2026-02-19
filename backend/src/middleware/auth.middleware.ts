import { FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from '../errors.js';

export const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    throw new AppError(401, 'Invalid token', 'UNAUTHORIZED');
  }
};

export const requireAdmin = async (request: FastifyRequest, _reply: FastifyReply) => {
  const user = request.user as any;
  if (user.role !== 'ADMIN') {
    throw new AppError(403, 'Admin access required', 'FORBIDDEN');
  }
};
