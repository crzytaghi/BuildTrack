import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { db, seed, Session, User } from './store.js';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import healthRoutes from './routes/health.js';
import companyRoutes from './routes/company.js';

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

const hashPassword = (password: string, salt: string) =>
  crypto.pbkdf2Sync(password, salt, 120000, 64, 'sha512').toString('hex');

const createSession = (userId: string): Session => {
  const token = crypto.randomBytes(32).toString('hex');
  const session: Session = { token, userId, expiresAt: Date.now() + SESSION_TTL_MS };
  db.sessions.set(token, session);
  return session;
};

const getAuthUser = (req: { headers: Record<string, string | string[] | undefined> }) => {
  // TODO: Reject requests with multiple Authorization headers for stricter validation.
  const rawHeader = req.headers.authorization;
  const header = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
  if (!header) return null;
  const [type, token] = header.split(' ');
  if (type !== 'Bearer' || !token) return null;
  const session = db.sessions.get(token);
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    db.sessions.delete(token);
    return null;
  }
  const user = db.users.get(session.userId);
  if (!user) return null;
  return { user, session };
};

const requireAuth = (req: any, reply: any, done: any) => {
  const auth = getAuthUser(req);
  if (!auth) {
    reply.code(401).send({ error: 'Unauthorized' });
    return;
  }
  (req as any).auth = auth;
  done();
};

export const buildApp = async () => {
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: true });
  await app.register(helmet);

  seed();
  const API_PREFIX = '/api/v1';
  const prisma = new PrismaClient();
  await prisma.$connect();

  const ensureCompany = async () => {
    const existing = await prisma.company.findFirst();
    if (!existing) {
      await prisma.company.create({ data: { name: 'BuildTrack', companySetupComplete: false } });
    }
  };
  await ensureCompany();
  app.addHook('onClose', async () => {
    await prisma.$disconnect();
  });

  await app.register(healthRoutes, { prefix: API_PREFIX });
  await app.register(authRoutes, { prefix: API_PREFIX, hashPassword, createSession, getAuthUser });
  await app.register(projectRoutes, { prefix: API_PREFIX, requireAuth });
  await app.register(companyRoutes, { prefix: API_PREFIX, prisma, requireAuth });

  return app;
};
