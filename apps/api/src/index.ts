import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { z } from 'zod';
import crypto from 'node:crypto';
import { db, seed, Session, User } from './store.js';

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
await app.register(helmet);

seed();

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

app.get('/health', async () => ({ ok: true }));

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

app.get('/projects', { preHandler: requireAuth }, async () => ({
  data: Array.from(db.projects.values()),
}));

app.post('/projects', { preHandler: requireAuth }, async (req, reply) => {
  const body = z
    .object({
      name: z.string().min(1),
      status: z.enum(['planning', 'active', 'on_hold', 'completed']).default('planning'),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      budgetTotal: z.number().optional(),
      notes: z.string().optional(),
    })
    .parse(req.body);

  const id = `proj_${Date.now()}`;
  const project = { id, ...body };
  db.projects.set(id, project);
  reply.code(201).send({ data: project });
});

app.get('/projects/:id', { preHandler: requireAuth }, async (req, reply) => {
  const id = (req.params as { id: string }).id;
  const project = db.projects.get(id);
  if (!project) return reply.code(404).send({ error: 'Not found' });
  return { data: project };
});

app.get('/projects/:id/tasks', { preHandler: requireAuth }, async (req) => {
  const id = (req.params as { id: string }).id;
  const data = Array.from(db.tasks.values()).filter((t) => t.projectId === id);
  return { data };
});

app.post('/projects/:id/tasks', { preHandler: requireAuth }, async (req, reply) => {
  const projectId = (req.params as { id: string }).id;
  const body = z
    .object({
      title: z.string().min(1),
      status: z.enum(['todo', 'in_progress', 'blocked', 'done']).default('todo'),
      dueDate: z.string().optional(),
    })
    .parse(req.body);

  const id = `task_${Date.now()}`;
  const task = { id, projectId, ...body };
  db.tasks.set(id, task);
  reply.code(201).send({ data: task });
});

app.get('/projects/:id/expenses', { preHandler: requireAuth }, async (req) => {
  const id = (req.params as { id: string }).id;
  const data = Array.from(db.expenses.values()).filter((e) => e.projectId === id);
  return { data };
});

app.post('/projects/:id/expenses', { preHandler: requireAuth }, async (req, reply) => {
  const projectId = (req.params as { id: string }).id;
  const body = z
    .object({
      amount: z.number(),
      categoryId: z.string(),
      description: z.string().optional(),
      expenseDate: z.string(),
    })
    .parse(req.body);

  const id = `exp_${Date.now()}`;
  const expense = { id, projectId, ...body };
  db.expenses.set(id, expense);
  reply.code(201).send({ data: expense });
});

const port = Number(process.env.PORT || 4000);
await app.listen({ port, host: '0.0.0.0' });
