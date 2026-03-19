import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { ZodError } from 'zod';
import crypto from 'node:crypto';
import { prisma } from './lib/prisma.js';
import { seed, Session, User } from './store.js';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import healthRoutes from './routes/health.js';
import companyRoutes from './routes/company.js';

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

const hashPassword = (password: string, salt: string) =>
  crypto.pbkdf2Sync(password, salt, 120000, 64, 'sha512').toString('hex');

const createSession = async (userId: string): Promise<Session> => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + SESSION_TTL_MS;
  await prisma.session.create({ data: { token, userId, expiresAt } });
  return { token, userId, expiresAt };
};

const getAuthUser = async (req: { headers: Record<string, string | string[] | undefined> }) => {
  const rawHeader = req.headers.authorization;
  const header = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
  if (!header) return null;
  const [type, token] = header.split(' ');
  if (type !== 'Bearer' || !token) return null;
  const session = await prisma.session.findUnique({ where: { token } });
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    await prisma.session.delete({ where: { token } });
    return null;
  }
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return null;
  return { user: user as User, session: { token: session.token } };
};

const requireAuth = async (req: any, reply: any) => {
  const auth = await getAuthUser(req);
  if (!auth) {
    reply.code(401).send({ error: 'Unauthorized' });
    return;
  }
  (req as any).auth = auth;
};

export const buildApp = async () => {
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: true });
  await app.register(helmet);

  await seed();
  const API_PREFIX = '/api/v1';

  app.addHook('onClose', async () => {
    await prisma.$disconnect();
  });

  app.setErrorHandler((error, _req, reply) => {
    if (error instanceof ZodError) {
      reply.code(400).send({ error: 'Invalid request body', issues: error.issues });
      return;
    }
    reply.code(500).send({ error: 'Internal server error' });
  });

  await app.register(healthRoutes, { prefix: API_PREFIX });
  await app.register(authRoutes, { prefix: API_PREFIX, hashPassword, createSession, getAuthUser, prisma });
  await app.register(projectRoutes, { prefix: API_PREFIX, requireAuth, prisma });
  await app.register(companyRoutes, { prefix: API_PREFIX, prisma, requireAuth });

  return app;
};
