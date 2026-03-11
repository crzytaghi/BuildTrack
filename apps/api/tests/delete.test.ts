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

describe('DELETE routes', () => {
  // ── Projects ──────────────────────────────────────────────────────────────

  it('DELETE /projects/:id returns 204', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/projects/proj_1',
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(204);
    await app.close();
  });

  it('deleted project no longer found via GET', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    await app.inject({
      method: 'DELETE',
      url: '/api/v1/projects/proj_1',
      headers: { Authorization: `Bearer ${token}` },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/projects/proj_1',
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(404);
    await app.close();
  });

  it('deleting a project cascades to its tasks', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    await app.inject({
      method: 'DELETE',
      url: '/api/v1/projects/proj_1',
      headers: { Authorization: `Bearer ${token}` },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/tasks?projectId=proj_1',
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data).toHaveLength(0);
    await app.close();
  });

  it('deleting a project cascades to its expenses', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    await app.inject({
      method: 'DELETE',
      url: '/api/v1/projects/proj_1',
      headers: { Authorization: `Bearer ${token}` },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/expenses?projectId=proj_1',
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data).toHaveLength(0);
    await app.close();
  });

  it('deleting a project cascades to its line items and their quotes', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    // proj_1 has bli_1..bli_3; proj_2 has bli_4 with quote_1 and quote_2
    await app.inject({
      method: 'DELETE',
      url: '/api/v1/projects/proj_2',
      headers: { Authorization: `Bearer ${token}` },
    });

    const liRes = await app.inject({
      method: 'GET',
      url: '/api/v1/budget-line-items?projectId=proj_2',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(liRes.json().data).toHaveLength(0);

    const qRes = await app.inject({
      method: 'GET',
      url: '/api/v1/projects/proj_2/quotes',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(qRes.json().data).toHaveLength(0);
    await app.close();
  });

  it('DELETE /projects/:id returns 404 for unknown id', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/projects/does-not-exist',
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(404);
    await app.close();
  });

  it('DELETE /projects/:id requires auth', async () => {
    const app = await buildApp();
    await app.ready();

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/projects/proj_1',
    });

    expect(res.statusCode).toBe(401);
    await app.close();
  });

  // ── Tasks ─────────────────────────────────────────────────────────────────

  it('DELETE /tasks/:id returns 204', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/tasks/task_proj_1_1',
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(204);
    await app.close();
  });

  it('deleted task no longer appears in GET /tasks', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    await app.inject({
      method: 'DELETE',
      url: '/api/v1/tasks/task_proj_1_1',
      headers: { Authorization: `Bearer ${token}` },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/tasks',
      headers: { Authorization: `Bearer ${token}` },
    });
    const ids = res.json().data.map((t: { id: string }) => t.id);

    expect(ids).not.toContain('task_proj_1_1');
    await app.close();
  });

  it('DELETE /tasks/:id returns 404 for unknown id', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/tasks/does-not-exist',
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(404);
    await app.close();
  });

  it('DELETE /tasks/:id requires auth', async () => {
    const app = await buildApp();
    await app.ready();

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/tasks/task_proj_1_1',
    });

    expect(res.statusCode).toBe(401);
    await app.close();
  });

  // ── Expenses ──────────────────────────────────────────────────────────────

  it('DELETE /expenses/:id returns 204', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/expenses/exp_1',
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(204);
    await app.close();
  });

  it('deleted expense no longer appears in GET /expenses', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    await app.inject({
      method: 'DELETE',
      url: '/api/v1/expenses/exp_1',
      headers: { Authorization: `Bearer ${token}` },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/expenses',
      headers: { Authorization: `Bearer ${token}` },
    });
    const ids = res.json().data.map((e: { id: string }) => e.id);

    expect(ids).not.toContain('exp_1');
    await app.close();
  });

  it('DELETE /expenses/:id returns 404 for unknown id', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/expenses/does-not-exist',
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(404);
    await app.close();
  });

  it('DELETE /expenses/:id requires auth', async () => {
    const app = await buildApp();
    await app.ready();

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/expenses/exp_1',
    });

    expect(res.statusCode).toBe(401);
    await app.close();
  });

  // ── Vendors ───────────────────────────────────────────────────────────────

  it('DELETE /vendors/:id returns 204', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/vendors/vendor_1',
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(204);
    await app.close();
  });

  it('deleted vendor no longer appears in GET /vendors', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    await app.inject({
      method: 'DELETE',
      url: '/api/v1/vendors/vendor_1',
      headers: { Authorization: `Bearer ${token}` },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/vendors',
      headers: { Authorization: `Bearer ${token}` },
    });
    const ids = res.json().data.map((v: { id: string }) => v.id);

    expect(ids).not.toContain('vendor_1');
    await app.close();
  });

  it('DELETE /vendors/:id returns 404 for unknown id', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/vendors/does-not-exist',
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(404);
    await app.close();
  });

  it('DELETE /vendors/:id requires auth', async () => {
    const app = await buildApp();
    await app.ready();

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/vendors/vendor_1',
    });

    expect(res.statusCode).toBe(401);
    await app.close();
  });

  // ── Budget Line Items ─────────────────────────────────────────────────────

  it('DELETE /budget-line-items/:id returns 204', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/budget-line-items/bli_1',
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(204);
    await app.close();
  });

  it('deleting a line item also removes its quotes', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    // bli_4 has quote_1 and quote_2
    await app.inject({
      method: 'DELETE',
      url: '/api/v1/budget-line-items/bli_4',
      headers: { Authorization: `Bearer ${token}` },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/projects/proj_2/quotes',
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.json().data).toHaveLength(0);
    await app.close();
  });

  it('DELETE /budget-line-items/:id returns 404 for unknown id', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/budget-line-items/does-not-exist',
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(404);
    await app.close();
  });

  it('DELETE /budget-line-items/:id requires auth', async () => {
    const app = await buildApp();
    await app.ready();

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/budget-line-items/bli_1',
    });

    expect(res.statusCode).toBe(401);
    await app.close();
  });

  // ── Quotes ────────────────────────────────────────────────────────────────

  it('DELETE /quotes/:id returns 204', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/quotes/quote_1',
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(204);
    await app.close();
  });

  it('deleted quote no longer appears in GET /projects/:id/quotes', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    await app.inject({
      method: 'DELETE',
      url: '/api/v1/quotes/quote_1',
      headers: { Authorization: `Bearer ${token}` },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/projects/proj_2/quotes',
      headers: { Authorization: `Bearer ${token}` },
    });
    const ids = res.json().data.map((q: { id: string }) => q.id);

    expect(ids).not.toContain('quote_1');
    await app.close();
  });

  it('DELETE /quotes/:id returns 404 for unknown id', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/quotes/does-not-exist',
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(404);
    await app.close();
  });

  it('DELETE /quotes/:id requires auth', async () => {
    const app = await buildApp();
    await app.ready();

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/quotes/quote_1',
    });

    expect(res.statusCode).toBe(401);
    await app.close();
  });
});
