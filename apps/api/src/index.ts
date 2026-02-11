import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { z } from 'zod';
import { db, seed } from './store.js';

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
await app.register(helmet);

seed();

app.get('/health', async () => ({ ok: true }));

app.get('/projects', async () => ({
  data: Array.from(db.projects.values()),
}));

app.post('/projects', async (req, reply) => {
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

app.get('/projects/:id', async (req, reply) => {
  const id = (req.params as { id: string }).id;
  const project = db.projects.get(id);
  if (!project) return reply.code(404).send({ error: 'Not found' });
  return { data: project };
});

app.get('/projects/:id/tasks', async (req) => {
  const id = (req.params as { id: string }).id;
  const data = Array.from(db.tasks.values()).filter((t) => t.projectId === id);
  return { data };
});

app.post('/projects/:id/tasks', async (req, reply) => {
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

app.get('/projects/:id/expenses', async (req) => {
  const id = (req.params as { id: string }).id;
  const data = Array.from(db.expenses.values()).filter((e) => e.projectId === id);
  return { data };
});

app.post('/projects/:id/expenses', async (req, reply) => {
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
