import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import crypto from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import type { User, Session } from '../store.js';

type AuthPluginOptions = {
  prisma: PrismaClient;
  hashPassword: (password: string, salt: string) => string;
  createSession: (userId: string) => Promise<{ token: string }>;
  getAuthUser: (req: { headers: Record<string, string | string[] | undefined> }) =>
    Promise<{ user: User; session: { token: string } } | null>;
  requireAuth: (req: any, reply: any) => Promise<void>;
};

const passwordSchema = z.string().min(8)
  .refine(p => /[A-Z]/.test(p), 'Password must contain an uppercase letter')
  .refine(p => /[0-9]/.test(p), 'Password must contain a number')
  .refine(p => /[!@#$%^&*(),.?":{}|<>]/.test(p), 'Password must contain a special character');

const authRoutes = async (app: FastifyInstance, options: AuthPluginOptions) => {
  const { hashPassword, createSession, getAuthUser, requireAuth, prisma } = options;

  app.post('/auth/signup', async (req, reply) => {
    const body = z
      .object({
        name: z.string().min(1),
        email: z.string().email(),
        password: passwordSchema,
        companyName: z.string().min(1),
        address: z.string().min(1),
        phone: z.string().min(1),
      })
      .parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) return reply.code(409).send({ error: 'Email already in use' });

    const company = await prisma.company.create({
      data: {
        name: body.companyName,
        address: body.address,
        phone: body.phone,
        companySetupComplete: true,
      },
    });

    await prisma.category.createMany({
      data: [
        { id: `cat_${company.id}_1`,  companyId: company.id, name: 'Materials' },
        { id: `cat_${company.id}_2`,  companyId: company.id, name: 'Labor' },
        { id: `cat_${company.id}_3`,  companyId: company.id, name: 'Subcontractors' },
        { id: `cat_${company.id}_4`,  companyId: company.id, name: 'Equipment' },
        { id: `cat_${company.id}_5`,  companyId: company.id, name: 'Permits & Fees' },
        { id: `cat_${company.id}_6`,  companyId: company.id, name: 'Design & Engineering' },
        { id: `cat_${company.id}_7`,  companyId: company.id, name: 'Site Work' },
        { id: `cat_${company.id}_8`,  companyId: company.id, name: 'Safety' },
        { id: `cat_${company.id}_9`,  companyId: company.id, name: 'Insurance & Bonds' },
        { id: `cat_${company.id}_10`, companyId: company.id, name: 'General Conditions' },
        { id: `cat_${company.id}_11`, companyId: company.id, name: 'Contingency' },
        { id: `cat_${company.id}_12`, companyId: company.id, name: 'Other' },
      ],
    });

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(body.password, salt);
    const user: User = {
      id: `user_${Date.now()}`,
      email: body.email,
      name: body.name,
      passwordHash,
      passwordSalt: salt,
      createdAt: new Date().toISOString(),
      companyId: company.id,
    };
    await prisma.user.create({ data: user });

    const session = await createSession(user.id);
    return reply.code(201).send({
      token: session.token,
      user: { id: user.id, email: user.email, name: user.name },
      company: { name: company.name, address: company.address, phone: company.phone },
    });
  });

  app.post('/auth/login', async (req, reply) => {
    const body = z
      .object({
        email: z.string().email(),
        password: z.string().min(8),
      })
      .parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) return reply.code(401).send({ error: 'Invalid credentials' });

    const candidate = hashPassword(body.password, user.passwordSalt);
    if (candidate !== user.passwordHash) return reply.code(401).send({ error: 'Invalid credentials' });

    const session = await createSession(user.id);
    return reply.send({
      token: session.token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  });

  app.post('/auth/logout', async (req, reply) => {
    const auth = await getAuthUser(req);
    if (auth) {
      await prisma.session.delete({ where: { token: auth.session.token } });
    }
    reply.send({ ok: true });
  });

  app.get('/auth/me', async (req, reply) => {
    const auth = await getAuthUser(req);
    if (!auth) return reply.code(401).send({ error: 'Unauthorized' });
    return { user: { id: auth.user.id, email: auth.user.email, name: auth.user.name } };
  });

  app.patch('/auth/password', { preHandler: requireAuth }, async (req, reply) => {
    const userId = (req as any).auth.user.id;
    const body = z.object({
      currentPassword: z.string().min(1),
      newPassword: passwordSchema,
    }).parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return reply.code(404).send({ error: 'User not found' });

    const candidate = hashPassword(body.currentPassword, user.passwordSalt);
    if (candidate !== user.passwordHash) return reply.code(401).send({ error: 'Current password is incorrect' });

    const newSalt = crypto.randomBytes(16).toString('hex');
    const newHash = hashPassword(body.newPassword, newSalt);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash, passwordSalt: newSalt } });

    return reply.send({ ok: true });
  });
};

export default authRoutes;
