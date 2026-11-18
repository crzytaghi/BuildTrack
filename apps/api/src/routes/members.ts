import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import crypto from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import { passwordSchema } from './auth.js';
import { INVITABLE_ROLES, MANAGERS, OWNERS, ROLES, type AuthUser, type Role } from '../lib/permissions.js';

type MemberPluginOptions = {
  prisma: PrismaClient;
  authorize: (roles: readonly Role[]) => (req: any, reply: any) => Promise<void>;
  hashPassword: (password: string, salt: string) => string;
  createSession: (userId: string) => Promise<{ token: string }>;
};

const INVITE_TTL_MS = 1000 * 60 * 60 * 24 * 7;

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

const toMember = (u: { id: string; name: string; email: string; role: string; createdAt: string }) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  createdAt: u.createdAt,
});

const toInvite = (i: { id: string; email: string; role: string; createdAt: string; expiresAt: number }) => ({
  id: i.id,
  email: i.email,
  role: i.role,
  createdAt: i.createdAt,
  expiresAt: new Date(i.expiresAt).toISOString(),
});

const memberRoutes = async (app: FastifyInstance, options: MemberPluginOptions) => {
  const { prisma, authorize, hashPassword, createSession } = options;
  const requireOwner = authorize(OWNERS);
  const requireManager = authorize(MANAGERS);
  const authUser = (req: any): AuthUser => req.auth.user;

  // Finds a pending (unaccepted, unexpired) invite by its raw token.
  const findPendingInvite = async (token: string) => {
    const invite = await prisma.invite.findUnique({ where: { tokenHash: hashToken(token) } });
    if (!invite || invite.acceptedAt || invite.expiresAt < Date.now()) return null;
    return invite;
  };

  // ── Members ───────────────────────────────────────────────────────────────

  app.get('/members', { preHandler: requireManager }, async (req) => {
    const users = await prisma.user.findMany({
      where: { companyId: authUser(req).companyId },
      orderBy: { createdAt: 'asc' },
    });
    return { data: users.map(toMember) };
  });

  app.patch('/members/:id', { preHandler: requireOwner }, async (req, reply) => {
    const { companyId } = authUser(req);
    const { id } = req.params as { id: string };
    const body = z.object({ role: z.enum(ROLES) }).parse(req.body);

    const target = await prisma.user.findFirst({ where: { id, companyId } });
    if (!target) return reply.code(404).send({ error: 'Not found' });

    if (target.role === 'owner' && body.role !== 'owner') {
      const owners = await prisma.user.count({ where: { companyId, role: 'owner' } });
      if (owners <= 1) return reply.code(409).send({ error: 'A company must have at least one owner' });
    }

    const updated = await prisma.user.update({ where: { id }, data: { role: body.role } });
    return { data: toMember(updated) };
  });

  app.delete('/members/:id', { preHandler: requireOwner }, async (req, reply) => {
    const me = authUser(req);
    const { id } = req.params as { id: string };
    if (id === me.id) return reply.code(409).send({ error: 'You cannot remove yourself' });

    const target = await prisma.user.findFirst({ where: { id, companyId: me.companyId } });
    if (!target) return reply.code(404).send({ error: 'Not found' });

    // Sessions and project assignments are removed by cascade.
    await prisma.user.delete({ where: { id } });
    return reply.code(204).send();
  });

  // ── Invites (owner) ───────────────────────────────────────────────────────

  app.get('/invites', { preHandler: requireOwner }, async (req) => {
    const invites = await prisma.invite.findMany({
      where: { companyId: authUser(req).companyId, acceptedAt: null, expiresAt: { gt: Date.now() } },
      orderBy: { createdAt: 'desc' },
    });
    return { data: invites.map(toInvite) };
  });

  app.post('/invites', { preHandler: requireOwner }, async (req, reply) => {
    const me = authUser(req);
    const body = z.object({
      email: z.string().email().transform((e) => e.trim().toLowerCase()),
      role: z.enum(INVITABLE_ROLES),
    }).parse(req.body);

    const existingUser = await prisma.user.findFirst({ where: { email: { equals: body.email, mode: 'insensitive' } } });
    if (existingUser) return reply.code(409).send({ error: 'A user with this email already exists' });

    // Re-inviting the same email replaces any earlier pending invite.
    await prisma.invite.deleteMany({ where: { companyId: me.companyId, email: body.email, acceptedAt: null } });

    const token = crypto.randomBytes(32).toString('hex');
    const invite = await prisma.invite.create({
      data: {
        id: `inv_${crypto.randomUUID()}`,
        companyId: me.companyId,
        email: body.email,
        role: body.role,
        tokenHash: hashToken(token),
        invitedById: me.id,
        createdAt: new Date().toISOString(),
        expiresAt: Date.now() + INVITE_TTL_MS,
      },
    });

    // The raw token is only returned here, once. The client turns it into a link.
    return reply.code(201).send({ data: toInvite(invite), token });
  });

  app.delete('/invites/:id', { preHandler: requireOwner }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { count } = await prisma.invite.deleteMany({
      where: { id, companyId: authUser(req).companyId, acceptedAt: null },
    });
    if (count === 0) return reply.code(404).send({ error: 'Not found' });
    return reply.code(204).send();
  });

  // ── Invite acceptance (public, authenticated by the token itself) ─────────

  app.get('/invites/token/:token', async (req, reply) => {
    const { token } = req.params as { token: string };
    const invite = await findPendingInvite(token);
    if (!invite) return reply.code(404).send({ error: 'This invite link is invalid or has expired' });
    const company = await prisma.company.findUnique({ where: { id: invite.companyId } });
    return { data: { email: invite.email, role: invite.role, companyName: company?.name ?? '' } };
  });

  app.post('/invites/token/:token/accept', async (req, reply) => {
    const { token } = req.params as { token: string };
    const body = z.object({ name: z.string().min(1), password: passwordSchema }).parse(req.body);

    const invite = await findPendingInvite(token);
    if (!invite) return reply.code(404).send({ error: 'This invite link is invalid or has expired' });

    const existingUser = await prisma.user.findFirst({ where: { email: { equals: invite.email, mode: 'insensitive' } } });
    if (existingUser) return reply.code(409).send({ error: 'A user with this email already exists' });

    const salt = crypto.randomBytes(16).toString('hex');
    const userId = `user_${crypto.randomUUID()}`;

    // Mark the invite used only if it is still unaccepted, so a link can't be redeemed twice.
    const user = await prisma.$transaction(async (tx) => {
      const claimed = await tx.invite.updateMany({
        where: { id: invite.id, acceptedAt: null },
        data: { acceptedAt: new Date().toISOString() },
      });
      if (claimed.count === 0) return null;
      return tx.user.create({
        data: {
          id: userId,
          email: invite.email,
          name: body.name,
          passwordHash: hashPassword(body.password, salt),
          passwordSalt: salt,
          createdAt: new Date().toISOString(),
          companyId: invite.companyId,
          role: invite.role,
        },
      });
    });
    if (!user) return reply.code(404).send({ error: 'This invite link is invalid or has expired' });

    const session = await createSession(user.id);
    const company = await prisma.company.findUnique({ where: { id: user.companyId } });
    return reply.code(201).send({
      token: session.token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      company: { name: company?.name ?? '', address: company?.address ?? null, phone: company?.phone ?? null },
    });
  });

  // ── Project assignments for field users (owner, manager) ──────────────────

  const findProject = (companyId: string, id: string) => prisma.project.findFirst({ where: { id, companyId } });

  app.get('/projects/:id/members', { preHandler: requireManager }, async (req, reply) => {
    const { companyId } = authUser(req);
    const { id } = req.params as { id: string };
    if (!(await findProject(companyId, id))) return reply.code(404).send({ error: 'Not found' });
    const rows = await prisma.projectMember.findMany({ where: { projectId: id }, include: { user: true } });
    return { data: rows.map((r) => toMember(r.user)) };
  });

  app.post('/projects/:id/members', { preHandler: requireManager }, async (req, reply) => {
    const { companyId } = authUser(req);
    const { id } = req.params as { id: string };
    const body = z.object({ userId: z.string().min(1) }).parse(req.body);

    if (!(await findProject(companyId, id))) return reply.code(404).send({ error: 'Not found' });
    const user = await prisma.user.findFirst({ where: { id: body.userId, companyId } });
    if (!user) return reply.code(404).send({ error: 'User not found' });
    if (user.role !== 'field') {
      return reply.code(400).send({ error: 'Only field users are assigned to projects; owners and managers see every project' });
    }

    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: id, userId: user.id } },
      create: { projectId: id, userId: user.id, createdAt: new Date().toISOString() },
      update: {},
    });
    return reply.code(201).send({ data: toMember(user) });
  });

  app.delete('/projects/:id/members/:userId', { preHandler: requireManager }, async (req, reply) => {
    const { companyId } = authUser(req);
    const { id, userId } = req.params as { id: string; userId: string };
    if (!(await findProject(companyId, id))) return reply.code(404).send({ error: 'Not found' });
    const { count } = await prisma.projectMember.deleteMany({ where: { projectId: id, userId } });
    if (count === 0) return reply.code(404).send({ error: 'Not found' });
    return reply.code(204).send();
  });
};

export default memberRoutes;
