import type { FastifyInstance } from 'fastify';
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
        description: z.string().optional(),
        expenseDate: z.string(),
      })
      .parse(req.body);

    const id = `exp_${Date.now()}`;
    const expense = { id, projectId, ...body };
    db.expenses.set(id, expense);
    reply.code(201).send({ data: expense });
  });
};

export default projectRoutes;
