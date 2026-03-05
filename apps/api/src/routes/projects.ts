import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { db } from '../store.js';

type ProjectPluginOptions = {
  requireAuth: (req: any, reply: any, done: any) => void;
};

const projectRoutes = async (app: FastifyInstance, options: ProjectPluginOptions) => {
  const { requireAuth } = options;
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

  app.patch('/projects/:id', { preHandler: requireAuth }, async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const project = db.projects.get(id);
    if (!project) return reply.code(404).send({ error: 'Not found' });

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

    const updated = { ...project, ...body };
    db.projects.set(id, updated);
    return { data: updated };
  });

  app.get('/projects/:id/tasks', { preHandler: requireAuth }, async (req) => {
    const id = (req.params as { id: string }).id;
    const data = Array.from(db.tasks.values()).filter((t) => t.projectId === id);
    return { data };
  });

  app.get('/tasks', { preHandler: requireAuth }, async (req) => {
    const query = (req.query as {
      projectId?: string;
      status?: 'todo' | 'in_progress' | 'blocked' | 'done';
      fromDate?: string;
      toDate?: string;
    }) ?? {};

    const from = query.fromDate ? Date.parse(query.fromDate) : null;
    const to = query.toDate ? Date.parse(query.toDate) : null;

    const data = Array.from(db.tasks.values()).filter((task) => {
      if (query.projectId && task.projectId !== query.projectId) return false;
      if (query.status && task.status !== query.status) return false;
      if (from && task.dueDate && Date.parse(task.dueDate) < from) return false;
      if (to && task.dueDate && Date.parse(task.dueDate) > to) return false;
      return true;
    });
    return { data };
  });

  app.get('/tasks/:id', { preHandler: requireAuth }, async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const task = db.tasks.get(id);
    if (!task) return reply.code(404).send({ error: 'Not found' });
    return { data: task };
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

  app.patch('/tasks/:id', { preHandler: requireAuth }, async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const task = db.tasks.get(id);
    if (!task) return reply.code(404).send({ error: 'Not found' });

    const body = z
      .object({
        title: z.string().min(1).optional(),
        status: z.enum(['todo', 'in_progress', 'blocked', 'done']).optional(),
        dueDate: z.string().optional(),
      })
      .parse(req.body);

    const updated = { ...task, ...body };
    db.tasks.set(id, updated);
    return { data: updated };
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
        vendorId: z.string(),
        description: z.string().min(1),
        expenseDate: z.string(),
        lineItemId: z.string().optional(),
      })
      .parse(req.body);

    const id = `exp_${Date.now()}`;
    const expense = { id, projectId, ...body };
    db.expenses.set(id, expense);
    reply.code(201).send({ data: expense });
  });

  app.get('/expenses', { preHandler: requireAuth }, async (req) => {
    const query = (req.query as {
      projectId?: string;
      categoryId?: string;
      fromDate?: string;
      toDate?: string;
    }) ?? {};

    const from = query.fromDate ? Date.parse(query.fromDate) : null;
    const to = query.toDate ? Date.parse(query.toDate) : null;

    const data = Array.from(db.expenses.values()).filter((expense) => {
      if (query.projectId && expense.projectId !== query.projectId) return false;
      if (query.categoryId && expense.categoryId !== query.categoryId) return false;
      if (from && Date.parse(expense.expenseDate) < from) return false;
      if (to && Date.parse(expense.expenseDate) > to) return false;
      return true;
    });
    return { data };
  });

  app.patch('/expenses/:id', { preHandler: requireAuth }, async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const expense = db.expenses.get(id);
    if (!expense) return reply.code(404).send({ error: 'Not found' });

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

    const updated = { ...expense, ...body };
    db.expenses.set(id, updated);
    return { data: updated };
  });

  app.get('/categories', { preHandler: requireAuth }, async () => ({
    data: Array.from(db.categories.values()),
  }));

  app.get('/vendors', { preHandler: requireAuth }, async () => ({
    data: Array.from(db.vendors.values()),
  }));

  app.post('/vendors', { preHandler: requireAuth }, async (req, reply) => {
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
    const vendor = { id, ...body };
    db.vendors.set(id, vendor);
    reply.code(201).send({ data: vendor });
  });

  app.patch('/vendors/:id', { preHandler: requireAuth }, async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const vendor = db.vendors.get(id);
    if (!vendor) return reply.code(404).send({ error: 'Not found' });

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

    const updated = { ...vendor, ...body };
    db.vendors.set(id, updated);
    return { data: updated };
  });

  app.get('/vendors/:id', { preHandler: requireAuth }, async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const vendor = db.vendors.get(id);
    if (!vendor) return reply.code(404).send({ error: 'Not found' });

    const vendorExpenses = Array.from(db.expenses.values()).filter((e) => e.vendorId === id);
    const totalSpend = vendorExpenses.reduce((sum, e) => sum + e.amount, 0);
    const expenseCount = vendorExpenses.length;

    return { data: { ...vendor, totalSpend, expenseCount } };
  });

  // Budget Line Items
  app.get('/budget-line-items', { preHandler: requireAuth }, async (req) => {
    const query = (req.query as { projectId?: string }) ?? {};
    const data = Array.from(db.budgetLineItems.values()).filter((item) => {
      if (query.projectId && item.projectId !== query.projectId) return false;
      return true;
    });
    return { data };
  });

  app.get('/projects/:id/budget-line-items', { preHandler: requireAuth }, async (req) => {
    const id = (req.params as { id: string }).id;
    const data = Array.from(db.budgetLineItems.values()).filter((item) => item.projectId === id);
    return { data };
  });

  app.post('/projects/:id/budget-line-items', { preHandler: requireAuth }, async (req, reply) => {
    const projectId = (req.params as { id: string }).id;
    const body = z
      .object({
        categoryId: z.string().min(1),
        description: z.string().min(1),
        budgetedAmount: z.number().positive(),
        notes: z.string().optional(),
      })
      .parse(req.body);

    const id = `bli_${randomUUID()}`;
    const lineItem = { id, projectId, ...body };
    db.budgetLineItems.set(id, lineItem);
    reply.code(201).send({ data: lineItem });
  });

  app.patch('/budget-line-items/:id', { preHandler: requireAuth }, async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const lineItem = db.budgetLineItems.get(id);
    if (!lineItem) return reply.code(404).send({ error: 'Not found' });

    const body = z
      .object({
        categoryId: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        budgetedAmount: z.number().positive().optional(),
        notes: z.string().optional(),
      })
      .parse(req.body);

    const updated = { ...lineItem, ...body };
    db.budgetLineItems.set(id, updated);
    return { data: updated };
  });

  // Quotes
  app.get('/projects/:id/quotes', { preHandler: requireAuth }, async (req) => {
    const id = (req.params as { id: string }).id;
    const data = Array.from(db.quotes.values()).filter((q) => q.projectId === id);
    return { data };
  });

  app.post('/budget-line-items/:id/quotes', { preHandler: requireAuth }, async (req, reply) => {
    const lineItemId = (req.params as { id: string }).id;
    const lineItem = db.budgetLineItems.get(lineItemId);
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
    const quote = { id, lineItemId, projectId: lineItem.projectId, status: 'pending' as const, ...body };
    db.quotes.set(id, quote);
    reply.code(201).send({ data: quote });
  });

  app.patch('/quotes/:id', { preHandler: requireAuth }, async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const quote = db.quotes.get(id);
    if (!quote) return reply.code(404).send({ error: 'Not found' });

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

    const updated = { ...quote, ...body };
    db.quotes.set(id, updated);

    if (body.status === 'awarded') {
      for (const [qid, q] of db.quotes) {
        if (q.lineItemId === quote.lineItemId && qid !== id) {
          db.quotes.set(qid, { ...q, status: 'rejected' });
        }
      }
    }

    return { data: updated };
  });
};

export default projectRoutes;
