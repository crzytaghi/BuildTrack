import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import crypto from 'node:crypto';
import { db, User } from '../store.js';

type AuthPluginOptions = {
  hashPassword: (password: string, salt: string) => string;
  createSession: (userId: string) => { token: string };
  getAuthUser: (req: { headers: Record<string, string | string[] | undefined> }) =>
    | { user: User; session: { token: string } }
    | null;
};

const authRoutes = async (app: FastifyInstance, options: AuthPluginOptions) => {
  const { hashPassword, createSession, getAuthUser } = options;

  app.post('/auth/signup', async (req, reply) => {
    const body = z
      .object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(8),
      })
      .parse(req.body);

    const existing = Array.from(db.users.values()).find((u) => u.email === body.email);
    if (existing) return reply.code(409).send({ error: 'Email already in use' });

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(body.password, salt);
    const user: User = {
      id: `user_${Date.now()}`,
      email: body.email,
      name: body.name,
      passwordHash,
      passwordSalt: salt,
      createdAt: new Date().toISOString(),
    };
    db.users.set(user.id, user);

    const session = createSession(user.id);
    return reply.code(201).send({
      token: session.token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  });

  app.post('/auth/login', async (req, reply) => {
    const body = z
      .object({
        email: z.string().email(),
        password: z.string().min(8),
      })
      .parse(req.body);

    const user = Array.from(db.users.values()).find((u) => u.email === body.email);
    if (!user) return reply.code(401).send({ error: 'Invalid credentials' });

    const candidate = hashPassword(body.password, user.passwordSalt);
    if (candidate !== user.passwordHash) return reply.code(401).send({ error: 'Invalid credentials' });

    const session = createSession(user.id);
    return reply.send({
      token: session.token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  });

  app.post('/auth/logout', async (req, reply) => {
    const auth = getAuthUser(req);
    if (auth) db.sessions.delete(auth.session.token);
    reply.send({ ok: true });
  });

  app.get('/auth/me', async (req, reply) => {
    const auth = getAuthUser(req);
    if (!auth) return reply.code(401).send({ error: 'Unauthorized' });
    return { user: { id: auth.user.id, email: auth.user.email, name: auth.user.name } };
  });
};

export default authRoutes;
