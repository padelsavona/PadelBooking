import { FastifyRequest } from 'fastify';
import { AppError } from '../errors.js';

export const authenticate = async (request: FastifyRequest) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    throw new AppError(401, 'Invalid token', 'UNAUTHORIZED');
  }
};

export const requireAdmin = async (request: FastifyRequest) => {
  const user = request.user as { role?: string };
  if (user.role !== 'ADMIN') {
    throw new AppError(403, 'Admin access required', 'FORBIDDEN');
  }
};
