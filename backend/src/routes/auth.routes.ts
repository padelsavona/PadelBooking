import { FastifyInstance } from 'fastify';
import { registerSchema, loginSchema } from '../schemas.js';
import { createUser, findUserByEmail, comparePasswords, findUserById } from '../services/auth.service.js';
import { AppError } from '../errors.js';
import { authenticate } from '../middleware/auth.middleware.js';

export default async function authRoutes(fastify: FastifyInstance) {
  // Register
  fastify.post('/register', async (request) => {
    const body = registerSchema.parse(request.body);
    const user = await createUser(body.email, body.password, body.name);
    const token = fastify.jwt.sign({ id: user.id, email: user.email, role: user.role });
    return { user, token };
  });

  // Login
  fastify.post('/login', async (request) => {
    const body = loginSchema.parse(request.body);
    const user = await findUserByEmail(body.email);

    if (!user || !(await comparePasswords(body.password, user.password))) {
      throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    const token = fastify.jwt.sign({ id: user.id, email: user.email, role: user.role });
    const { password, ...userWithoutPassword } = user;
    void password; // Suppress unused variable warning
    return { user: userWithoutPassword, token };
  });

  // Get current user
  fastify.get('/me', { onRequest: [authenticate] }, async (request) => {
    const jwtUser = request.user as { id: string };
    const user = await findUserById(jwtUser.id);
    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }
    return user;
  });
}
