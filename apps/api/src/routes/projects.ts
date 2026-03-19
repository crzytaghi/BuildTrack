import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import type { PrismaClient } from '@prisma/client';

type ProjectPluginOptions = {
  prisma: PrismaClient;
  requireAuth: (req: any, reply: any) => Promise<void>;
};

const stripNulls = (obj: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== null));

const projectRoutes = async (app: FastifyInstance, options: ProjectPluginOptions) => {
  const { requireAuth, prisma } = options;

  app.get('/projects', { preHandler: requireAuth }, async (req) => {
    const { companyId } = (req as any).auth.user;
    return { data: await prisma.project.findMany({ where: { companyId } }) };
  });

  app.post('/projects', { preHandler: requireAuth }, async (req, reply) => {
    const { companyId } = (req as any).auth.user;
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
    const project = await prisma.project.create({ data: { id, companyId, ...body } });
    reply.code(201).send({ data: project });
  });

  app.get('/projects/:id', { preHandler: requireAuth }, async (req, reply) => {
    const { companyId } = (req as any).auth.user;
    const id = (req.params as { id: string }).id;
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project || project.companyId !== companyId) return reply.code(404).send({ error: 'Not found' });
    return { data: project };
  });

  app.patch('/projects/:id', { preHandler: requireAuth }, async (req, reply) => {
    const { companyId } = (req as any).auth.user;
    const id = (req.params as { id: string }).id;

    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing || existing.companyId !== companyId) return reply.code(404).send({ error: 'Not found' });

    const body = z
      .object({
        name: z.string().min(1).optional(),
        status: z.enum(['planning', 'active', 'on_hold', 'completed']).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        budgetTotal: z.number().optional(),
        notes: z.string().optional(),
      })
      .parse(req.body);

    const updated = await prisma.project.update({ where: { id }, data: body });
    return { data: updated };
  });

  app.delete('/projects/:id', { preHandler: requireAuth }, async (req, reply) => {
    const { companyId } = (req as any).auth.user;
    const id = (req.params as { id: string }).id;
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project || project.companyId !== companyId) return reply.code(404).send({ error: 'Not found' });
    await prisma.project.delete({ where: { id } });
    reply.code(204).send();
  });

  app.get('/projects/:id/tasks', { preHandler: requireAuth }, async (req) => {
    const { companyId } = (req as any).auth.user;
    const id = (req.params as { id: string }).id;
    const data = await prisma.task.findMany({ where: { projectId: id, project: { companyId } } });
    return { data };
  });

  app.get('/tasks', { preHandler: requireAuth }, async (req) => {
    const { companyId } = (req as any).auth.user;
    const query = (req.query as {
      projectId?: string;
      status?: string;
      fromDate?: string;
      toDate?: string;
    }) ?? {};

    const where: Record<string, unknown> = { project: { companyId } };
    if (query.projectId) where.projectId = query.projectId;
    if (query.status) where.status = query.status;
    if (query.fromDate || query.toDate) {
      const dateFilter: Record<string, string> = {};
      if (query.fromDate) dateFilter.gte = query.fromDate;
      if (query.toDate) dateFilter.lte = query.toDate;
      where.dueDate = dateFilter;
    }

    const data = await prisma.task.findMany({ where });
    return { data };
  });

  app.get('/tasks/:id', { preHandler: requireAuth }, async (req, reply) => {
    const { companyId } = (req as any).auth.user;
    const id = (req.params as { id: string }).id;
    const task = await prisma.task.findFirst({ where: { id, project: { companyId } } });
    if (!task) return reply.code(404).send({ error: 'Not found' });
    return { data: task };
  });

  app.post('/projects/:id/tasks', { preHandler: requireAuth }, async (req, reply) => {
    const { companyId } = (req as any).auth.user;
    const projectId = (req.params as { id: string }).id;
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.companyId !== companyId) return reply.code(404).send({ error: 'Not found' });

    const body = z
      .object({
        title: z.string().min(1),
        status: z.enum(['todo', 'in_progress', 'blocked', 'done']).default('todo'),
        dueDate: z.string().optional(),
      })
      .parse(req.body);

    const id = `task_${Date.now()}`;
    const task = await prisma.task.create({ data: { id, projectId, ...body } });
    reply.code(201).send({ data: task });
  });

  app.patch('/tasks/:id', { preHandler: requireAuth }, async (req, reply) => {
    const { companyId } = (req as any).auth.user;
    const id = (req.params as { id: string }).id;

    const existing = await prisma.task.findFirst({ where: { id, project: { companyId } } });
    if (!existing) return reply.code(404).send({ error: 'Not found' });

    const body = z
      .object({
        title: z.string().min(1).optional(),
        status: z.enum(['todo', 'in_progress', 'blocked', 'done']).optional(),
        dueDate: z.string().optional(),
      })
      .parse(req.body);

    const updated = await prisma.task.update({ where: { id }, data: body });
    return { data: updated };
  });

  app.delete('/tasks/:id', { preHandler: requireAuth }, async (req, reply) => {
    const { companyId } = (req as any).auth.user;
    const id = (req.params as { id: string }).id;
    const task = await prisma.task.findFirst({ where: { id, project: { companyId } } });
    if (!task) return reply.code(404).send({ error: 'Not found' });
    await prisma.task.delete({ where: { id } });
    reply.code(204).send();
  });

  app.get('/projects/:id/expenses', { preHandler: requireAuth }, async (req) => {
    const { companyId } = (req as any).auth.user;
    const id = (req.params as { id: string }).id;
    const rows = await prisma.expense.findMany({ where: { projectId: id, project: { companyId } } });
    return { data: rows.map(stripNulls) };
  });

  app.post('/projects/:id/expenses', { preHandler: requireAuth }, async (req, reply) => {
    const { companyId } = (req as any).auth.user;
    const projectId = (req.params as { id: string }).id;
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.companyId !== companyId) return reply.code(404).send({ error: 'Not found' });

    const body = z
      .object({
        amount: z.number(),
        categoryId: z.string(),
        vendorId: z.string(),
        description: z.string().min(1),
        expenseDate: z.string(),
        lineItemId: z.string().optional(),
      })
      .parse(req.body);

    const id = `exp_${Date.now()}`;
    const expense = await prisma.expense.create({ data: { id, projectId, ...body } });
    return reply.code(201).send({ data: stripNulls(expense as Record<string, unknown>) });
  });

  app.get('/expenses', { preHandler: requireAuth }, async (req) => {
    const { companyId } = (req as any).auth.user;
    const query = (req.query as {
      projectId?: string;
      categoryId?: string;
      fromDate?: string;
      toDate?: string;
    }) ?? {};

    const where: Record<string, unknown> = { project: { companyId } };
    if (query.projectId) where.projectId = query.projectId;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.fromDate || query.toDate) {
      const dateFilter: Record<string, string> = {};
      if (query.fromDate) dateFilter.gte = query.fromDate;
      if (query.toDate) dateFilter.lte = query.toDate;
      where.expenseDate = dateFilter;
    }

    const rows = await prisma.expense.findMany({ where });
    return { data: rows.map(stripNulls) };
  });

  app.patch('/expenses/:id', { preHandler: requireAuth }, async (req, reply) => {
    const { companyId } = (req as any).auth.user;
    const id = (req.params as { id: string }).id;

    const existing = await prisma.expense.findFirst({ where: { id, project: { companyId } } });
    if (!existing) return reply.code(404).send({ error: 'Not found' });

    const body = z
      .object({
        amount: z.number().optional(),
        categoryId: z.string().optional(),
        vendorId: z.string().optional(),
        description: z.string().min(1).optional(),
        expenseDate: z.string().optional(),
        lineItemId: z.string().optional(),
      })
      .parse(req.body);

    const updated = await prisma.expense.update({ where: { id }, data: body });
    return { data: stripNulls(updated as Record<string, unknown>) };
  });

  app.delete('/expenses/:id', { preHandler: requireAuth }, async (req, reply) => {
    const { companyId } = (req as any).auth.user;
    const id = (req.params as { id: string }).id;
    const expense = await prisma.expense.findFirst({ where: { id, project: { companyId } } });
    if (!expense) return reply.code(404).send({ error: 'Not found' });
    await prisma.expense.delete({ where: { id } });
    reply.code(204).send();
  });

  app.get('/categories', { preHandler: requireAuth }, async (req) => {
    const { companyId } = (req as any).auth.user;
    return { data: await prisma.category.findMany({ where: { companyId } }) };
  });

  app.get('/vendors', { preHandler: requireAuth }, async (req) => {
    const { companyId } = (req as any).auth.user;
    return { data: await prisma.vendor.findMany({ where: { companyId } }) };
  });

  app.post('/vendors', { preHandler: requireAuth }, async (req, reply) => {
    const { companyId } = (req as any).auth.user;
    const body = z
      .object({
        name: z.string().min(1),
        trade: z.string().optional(),
        contactName: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        notes: z.string().optional(),
      })
      .parse(req.body);

    const id = `vendor_${Date.now()}`;
    const vendor = await prisma.vendor.create({ data: { id, companyId, ...body } });
    reply.code(201).send({ data: stripNulls(vendor as Record<string, unknown>) });
  });

  app.patch('/vendors/:id', { preHandler: requireAuth }, async (req, reply) => {
    const { companyId } = (req as any).auth.user;
    const id = (req.params as { id: string }).id;

    const existing = await prisma.vendor.findFirst({ where: { id, companyId } });
    if (!existing) return reply.code(404).send({ error: 'Not found' });

    const body = z
      .object({
        name: z.string().min(1).optional(),
        trade: z.string().optional(),
        contactName: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        notes: z.string().optional(),
      })
      .parse(req.body);

    const updated = await prisma.vendor.update({ where: { id }, data: body });
    return { data: stripNulls(updated as Record<string, unknown>) };
  });

  app.delete('/vendors/:id', { preHandler: requireAuth }, async (req, reply) => {
    const { companyId } = (req as any).auth.user;
    const id = (req.params as { id: string }).id;
    const vendor = await prisma.vendor.findFirst({ where: { id, companyId } });
    if (!vendor) return reply.code(404).send({ error: 'Not found' });
    await prisma.quote.deleteMany({ where: { vendorId: id } });
    await prisma.expense.deleteMany({ where: { vendorId: id } });
    await prisma.vendor.delete({ where: { id } });
    reply.code(204).send();
  });

  app.get('/vendors/:id', { preHandler: requireAuth }, async (req, reply) => {
    const { companyId } = (req as any).auth.user;
    const id = (req.params as { id: string }).id;
    const vendor = await prisma.vendor.findFirst({ where: { id, companyId } });
    if (!vendor) return reply.code(404).send({ error: 'Not found' });

    const agg = await prisma.expense.aggregate({
      where: { vendorId: id },
      _sum: { amount: true },
      _count: { id: true },
    });

    return {
      data: {
        ...stripNulls(vendor as Record<string, unknown>),
        totalSpend: agg._sum.amount ?? 0,
        expenseCount: agg._count.id,
      },
    };
  });

  // Budget Line Items
  app.get('/budget-line-items', { preHandler: requireAuth }, async (req) => {
    const { companyId } = (req as any).auth.user;
    const query = (req.query as { projectId?: string }) ?? {};
    const where: Record<string, unknown> = { project: { companyId } };
    if (query.projectId) where.projectId = query.projectId;
    const rows = await prisma.budgetLineItem.findMany({ where });
    return { data: rows.map(stripNulls) };
  });

  app.get('/projects/:id/budget-line-items', { preHandler: requireAuth }, async (req) => {
    const { companyId } = (req as any).auth.user;
    const id = (req.params as { id: string }).id;
    const rows = await prisma.budgetLineItem.findMany({ where: { projectId: id, project: { companyId } } });
    return { data: rows.map(stripNulls) };
  });

  app.post('/projects/:id/budget-line-items', { preHandler: requireAuth }, async (req, reply) => {
    const { companyId } = (req as any).auth.user;
    const projectId = (req.params as { id: string }).id;
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.companyId !== companyId) return reply.code(404).send({ error: 'Not found' });

    const body = z
      .object({
        categoryId: z.string().min(1),
        description: z.string().min(1),
        budgetedAmount: z.number().positive(),
        notes: z.string().optional(),
      })
      .parse(req.body);

    const id = `bli_${randomUUID()}`;
    const lineItem = await prisma.budgetLineItem.create({ data: { id, projectId, ...body } });
    reply.code(201).send({ data: stripNulls(lineItem as Record<string, unknown>) });
  });

  app.patch('/budget-line-items/:id', { preHandler: requireAuth }, async (req, reply) => {
    const { companyId } = (req as any).auth.user;
    const id = (req.params as { id: string }).id;

    const existing = await prisma.budgetLineItem.findFirst({ where: { id, project: { companyId } } });
    if (!existing) return reply.code(404).send({ error: 'Not found' });

    const body = z
      .object({
        categoryId: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        budgetedAmount: z.number().positive().optional(),
        notes: z.string().optional(),
      })
      .parse(req.body);

    const updated = await prisma.budgetLineItem.update({ where: { id }, data: body });
    return { data: stripNulls(updated as Record<string, unknown>) };
  });

  app.delete('/budget-line-items/:id', { preHandler: requireAuth }, async (req, reply) => {
    const { companyId } = (req as any).auth.user;
    const id = (req.params as { id: string }).id;
    const lineItem = await prisma.budgetLineItem.findFirst({ where: { id, project: { companyId } } });
    if (!lineItem) return reply.code(404).send({ error: 'Not found' });
    await prisma.budgetLineItem.delete({ where: { id } });
    reply.code(204).send();
  });

  // Quotes
  app.get('/projects/:id/quotes', { preHandler: requireAuth }, async (req) => {
    const { companyId } = (req as any).auth.user;
    const id = (req.params as { id: string }).id;
    const rows = await prisma.quote.findMany({ where: { projectId: id, project: { companyId } } });
    return { data: rows.map(stripNulls) };
  });

  app.post('/budget-line-items/:id/quotes', { preHandler: requireAuth }, async (req, reply) => {
    const { companyId } = (req as any).auth.user;
    const lineItemId = (req.params as { id: string }).id;
    const lineItem = await prisma.budgetLineItem.findFirst({ where: { id: lineItemId, project: { companyId } } });
    if (!lineItem) return reply.code(404).send({ error: 'Not found' });

    const body = z
      .object({
        vendorId: z.string().min(1),
        amount: z.number().positive(),
        submittedAt: z.string(),
        description: z.string().optional(),
        expiresAt: z.string().optional(),
      })
      .parse(req.body);

    const id = `quote_${randomUUID()}`;
    const quote = await prisma.quote.create({
      data: { id, lineItemId, projectId: lineItem.projectId, status: 'pending', ...body },
    });
    reply.code(201).send({ data: stripNulls(quote as Record<string, unknown>) });
  });

  app.patch('/quotes/:id', { preHandler: requireAuth }, async (req, reply) => {
    const { companyId } = (req as any).auth.user;
    const id = (req.params as { id: string }).id;
    const existing = await prisma.quote.findFirst({ where: { id, project: { companyId } } });
    if (!existing) return reply.code(404).send({ error: 'Not found' });

    const body = z
      .object({
        vendorId: z.string().min(1).optional(),
        amount: z.number().positive().optional(),
        submittedAt: z.string().optional(),
        description: z.string().optional(),
        expiresAt: z.string().optional(),
        status: z.enum(['pending', 'awarded', 'rejected']).optional(),
      })
      .parse(req.body);

    const updated = await prisma.quote.update({ where: { id }, data: body });

    if (body.status === 'awarded') {
      await prisma.quote.updateMany({
        where: { lineItemId: existing.lineItemId, id: { not: id } },
        data: { status: 'rejected' },
      });
    }

    return { data: stripNulls(updated as Record<string, unknown>) };
  });

  app.delete('/quotes/:id', { preHandler: requireAuth }, async (req, reply) => {
    const { companyId } = (req as any).auth.user;
    const id = (req.params as { id: string }).id;
    const quote = await prisma.quote.findFirst({ where: { id, project: { companyId } } });
    if (!quote) return reply.code(404).send({ error: 'Not found' });
    await prisma.quote.delete({ where: { id } });
    reply.code(204).send();
  });
};

export default projectRoutes;
