import { describe, it, expect, beforeEach } from 'vitest';
import { buildApp } from '../src/app.js';
import { resetDb, seed } from '../src/store.js';

const signupPayload = {
  name: 'Alex Builder',
  email: 'alex@buildtrack.com',
  password: 'securepass1',
};

const getToken = async (app: Awaited<ReturnType<typeof buildApp>>) => {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/signup',
    payload: signupPayload,
  });
  return res.json().token as string;
};

beforeEach(() => {
  resetDb();
  seed();
});

describe('Categories API', () => {
  it('lists all seeded categories', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/categories',
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = res.json();

    expect(res.statusCode).toBe(200);
    expect(body.data).toHaveLength(6);
    expect(body.data.every((c: { id: string; name: string }) => c.id && c.name)).toBe(true);
    await app.close();
  });

  it('requires auth to list categories', async () => {
    const app = await buildApp();
    await app.ready();

    const res = await app.inject({ method: 'GET', url: '/api/v1/categories' });

    expect(res.statusCode).toBe(401);
    await app.close();
  });
});

describe('Expenses API', () => {
  it('lists all expenses', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/expenses',
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = res.json();

    expect(res.statusCode).toBe(200);
    expect(body.data).toHaveLength(15);
    await app.close();
  });

  it('requires auth to list expenses', async () => {
    const app = await buildApp();
    await app.ready();

    const res = await app.inject({ method: 'GET', url: '/api/v1/expenses' });

    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it('filters expenses by projectId', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/expenses?projectId=proj_1',
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = res.json();

    expect(res.statusCode).toBe(200);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data.every((e: { projectId: string }) => e.projectId === 'proj_1')).toBe(true);
    await app.close();
  });

  it('filters expenses by categoryId', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/expenses?categoryId=cat_1',
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = res.json();

    expect(res.statusCode).toBe(200);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data.every((e: { categoryId: string }) => e.categoryId === 'cat_1')).toBe(true);
    await app.close();
  });

  it('filters expenses by date range', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/expenses?fromDate=2026-02-01&toDate=2026-02-28',
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = res.json();
    const from = Date.parse('2026-02-01');
    const to = Date.parse('2026-02-28');

    expect(res.statusCode).toBe(200);
    expect(body.data.length).toBeGreaterThan(0);
    expect(
      body.data.every((e: { expenseDate: string }) => {
        const d = Date.parse(e.expenseDate);
        return d >= from && d <= to;
      }),
    ).toBe(true);
    await app.close();
  });

  it('returns an empty array when no expenses match filters', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/expenses?projectId=proj_3',
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = res.json();

    expect(res.statusCode).toBe(200);
    expect(body.data).toHaveLength(0);
    await app.close();
  });

  it('creates an expense for a project', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/projects/proj_1/expenses',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        amount: 5000,
        categoryId: 'cat_2',
        vendor: 'Rodriguez Framing LLC',
        description: 'Labor crew week 3',
        expenseDate: '2026-03-01',
      },
    });
    const body = res.json();

    expect(res.statusCode).toBe(201);
    expect(body.data.id).toBeTruthy();
    expect(body.data.projectId).toBe('proj_1');
    expect(body.data.amount).toBe(5000);
    expect(body.data.categoryId).toBe('cat_2');
    expect(body.data.vendor).toBe('Rodriguez Framing LLC');
    expect(body.data.description).toBe('Labor crew week 3');
    expect(body.data.expenseDate).toBe('2026-03-01');
    await app.close();
  });

  it('created expense appears in the expense list', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/projects/proj_1/expenses',
      headers: { Authorization: `Bearer ${token}` },
      payload: { amount: 750, categoryId: 'cat_5', vendor: 'City of Springfield', description: 'Permit renewal', expenseDate: '2026-03-02' },
    });
    const created = createRes.json().data;

    const listRes = await app.inject({
      method: 'GET',
      url: '/api/v1/expenses',
      headers: { Authorization: `Bearer ${token}` },
    });
    const ids = listRes.json().data.map((e: { id: string }) => e.id);

    expect(ids).toContain(created.id);
    await app.close();
  });

  it('rejects expense creation with missing amount', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/projects/proj_1/expenses',
      headers: { Authorization: `Bearer ${token}` },
      payload: { categoryId: 'cat_1', vendor: 'Test Vendor', description: 'Test', expenseDate: '2026-03-01' },
    });

    expect(res.statusCode).toBe(400);
    await app.close();
  });

  it('rejects expense creation with missing vendor', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/projects/proj_1/expenses',
      headers: { Authorization: `Bearer ${token}` },
      payload: { amount: 1000, categoryId: 'cat_1', description: 'Test', expenseDate: '2026-03-01' },
    });

    expect(res.statusCode).toBe(400);
    await app.close();
  });

  it('rejects expense creation with missing description', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/projects/proj_1/expenses',
      headers: { Authorization: `Bearer ${token}` },
      payload: { amount: 1000, categoryId: 'cat_1', vendor: 'Test Vendor', expenseDate: '2026-03-01' },
    });

    expect(res.statusCode).toBe(400);
    await app.close();
  });

  it('rejects expense creation with missing expenseDate', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/projects/proj_1/expenses',
      headers: { Authorization: `Bearer ${token}` },
      payload: { amount: 1000, categoryId: 'cat_1', vendor: 'Test Vendor', description: 'Test' },
    });

    expect(res.statusCode).toBe(400);
    await app.close();
  });

  it('requires auth to create an expense', async () => {
    const app = await buildApp();
    await app.ready();

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/projects/proj_1/expenses',
      payload: { amount: 100, categoryId: 'cat_1', expenseDate: '2026-03-01' },
    });

    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it('updates an existing expense', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/expenses/exp_1',
      headers: { Authorization: `Bearer ${token}` },
      payload: { amount: 99999, vendor: 'Updated Vendor Co.', description: 'Updated description' },
    });
    const body = res.json();

    expect(res.statusCode).toBe(200);
    expect(body.data.id).toBe('exp_1');
    expect(body.data.amount).toBe(99999);
    expect(body.data.vendor).toBe('Updated Vendor Co.');
    expect(body.data.description).toBe('Updated description');
    // Unchanged fields are preserved
    expect(body.data.projectId).toBe('proj_1');
    expect(body.data.categoryId).toBe('cat_1');
    await app.close();
  });

  it('updates only the supplied fields on an expense', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/expenses/exp_1',
      headers: { Authorization: `Bearer ${token}` },
      payload: { categoryId: 'cat_3' },
    });
    const body = res.json();

    expect(res.statusCode).toBe(200);
    expect(body.data.categoryId).toBe('cat_3');
    expect(body.data.amount).toBe(12480); // original value preserved
    await app.close();
  });

  it('returns 404 when updating a non-existent expense', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/expenses/does-not-exist',
      headers: { Authorization: `Bearer ${token}` },
      payload: { amount: 100 },
    });

    expect(res.statusCode).toBe(404);
    await app.close();
  });

  it('requires auth to update an expense', async () => {
    const app = await buildApp();
    await app.ready();

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/expenses/exp_1',
      payload: { amount: 100 },
    });

    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it('lists expenses scoped to a project via project route', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/projects/proj_2/expenses',
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = res.json();

    expect(res.statusCode).toBe(200);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data.every((e: { projectId: string }) => e.projectId === 'proj_2')).toBe(true);
    await app.close();
  });
});
