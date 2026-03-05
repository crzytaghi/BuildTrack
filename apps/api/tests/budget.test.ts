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

describe('Budget Line Items API', () => {
  it('lists all 10 seeded line items', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/budget-line-items',
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = res.json();

    expect(res.statusCode).toBe(200);
    expect(body.data).toHaveLength(10);
    await app.close();
  });

  it('requires auth to list line items', async () => {
    const app = await buildApp();
    await app.ready();

    const res = await app.inject({ method: 'GET', url: '/api/v1/budget-line-items' });

    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it('filters line items by projectId', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/budget-line-items?projectId=proj_2',
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = res.json();

    expect(res.statusCode).toBe(200);
    expect(body.data).toHaveLength(3);
    expect(body.data.every((li: { projectId: string }) => li.projectId === 'proj_2')).toBe(true);
    await app.close();
  });

  it('project-scoped route returns correct line items', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/projects/proj_1/budget-line-items',
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = res.json();

    expect(res.statusCode).toBe(200);
    expect(body.data).toHaveLength(3);
    await app.close();
  });

  it('requires auth for project-scoped line items', async () => {
    const app = await buildApp();
    await app.ready();

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/projects/proj_1/budget-line-items',
    });

    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it('creates a line item and returns 201 with correct fields', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/projects/proj_3/budget-line-items',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        categoryId: 'cat_1',
        description: 'Test line item',
        budgetedAmount: 50000,
        notes: 'Some notes',
      },
    });
    const body = res.json();

    expect(res.statusCode).toBe(201);
    expect(body.data.id).toBeTruthy();
    expect(body.data.projectId).toBe('proj_3');
    expect(body.data.categoryId).toBe('cat_1');
    expect(body.data.description).toBe('Test line item');
    expect(body.data.budgetedAmount).toBe(50000);
    expect(body.data.notes).toBe('Some notes');
    await app.close();
  });

  it('created line item appears in list', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/projects/proj_3/budget-line-items',
      headers: { Authorization: `Bearer ${token}` },
      payload: { categoryId: 'cat_2', description: 'New item', budgetedAmount: 25000 },
    });
    const created = createRes.json().data;

    const listRes = await app.inject({
      method: 'GET',
      url: '/api/v1/budget-line-items',
      headers: { Authorization: `Bearer ${token}` },
    });
    const ids = listRes.json().data.map((li: { id: string }) => li.id);

    expect(ids).toContain(created.id);
    await app.close();
  });

  it('rejects creation with missing description', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/projects/proj_1/budget-line-items',
      headers: { Authorization: `Bearer ${token}` },
      payload: { categoryId: 'cat_1', budgetedAmount: 10000 },
    });

    expect(res.statusCode).toBe(400);
    await app.close();
  });

  it('rejects creation with missing categoryId', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/projects/proj_1/budget-line-items',
      headers: { Authorization: `Bearer ${token}` },
      payload: { description: 'Test', budgetedAmount: 10000 },
    });

    expect(res.statusCode).toBe(400);
    await app.close();
  });

  it('rejects creation with non-positive budgetedAmount', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/projects/proj_1/budget-line-items',
      headers: { Authorization: `Bearer ${token}` },
      payload: { categoryId: 'cat_1', description: 'Test', budgetedAmount: -100 },
    });

    expect(res.statusCode).toBe(400);
    await app.close();
  });

  it('requires auth to create a line item', async () => {
    const app = await buildApp();
    await app.ready();

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/projects/proj_1/budget-line-items',
      payload: { categoryId: 'cat_1', description: 'Test', budgetedAmount: 10000 },
    });

    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it('updates a line item and preserves unchanged fields', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/budget-line-items/bli_1',
      headers: { Authorization: `Bearer ${token}` },
      payload: { budgetedAmount: 30000 },
    });
    const body = res.json();

    expect(res.statusCode).toBe(200);
    expect(body.data.id).toBe('bli_1');
    expect(body.data.budgetedAmount).toBe(30000);
    expect(body.data.description).toBe('Framing labor — all floors');
    expect(body.data.categoryId).toBe('cat_2');
    await app.close();
  });

  it('returns 404 when updating a non-existent line item', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/budget-line-items/does-not-exist',
      headers: { Authorization: `Bearer ${token}` },
      payload: { description: 'Updated' },
    });

    expect(res.statusCode).toBe(404);
    await app.close();
  });

  it('requires auth to update a line item', async () => {
    const app = await buildApp();
    await app.ready();

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/budget-line-items/bli_1',
      payload: { description: 'Updated' },
    });

    expect(res.statusCode).toBe(401);
    await app.close();
  });
});

describe('Quotes API', () => {
  it('lists project-scoped quotes', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    // proj_2 has quote_1 and quote_2 (both on bli_4)
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/projects/proj_2/quotes',
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = res.json();

    expect(res.statusCode).toBe(200);
    expect(body.data).toHaveLength(2);
    expect(body.data.every((q: { projectId: string }) => q.projectId === 'proj_2')).toBe(true);
    await app.close();
  });

  it('requires auth to list quotes', async () => {
    const app = await buildApp();
    await app.ready();

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/projects/proj_2/quotes',
    });

    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it('creates a quote with status pending and denormalized projectId', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/budget-line-items/bli_3/quotes',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        vendorId: 'vendor_1',
        amount: 9000,
        submittedAt: '2026-03-01',
        description: 'Permit fees quote',
      },
    });
    const body = res.json();

    expect(res.statusCode).toBe(201);
    expect(body.data.id).toBeTruthy();
    expect(body.data.status).toBe('pending');
    expect(body.data.projectId).toBe('proj_1');
    expect(body.data.lineItemId).toBe('bli_3');
    expect(body.data.vendorId).toBe('vendor_1');
    expect(body.data.amount).toBe(9000);
    await app.close();
  });

  it('created quote appears in project quotes list', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/budget-line-items/bli_3/quotes',
      headers: { Authorization: `Bearer ${token}` },
      payload: { vendorId: 'vendor_2', amount: 8500, submittedAt: '2026-03-02' },
    });
    const created = createRes.json().data;

    const listRes = await app.inject({
      method: 'GET',
      url: '/api/v1/projects/proj_1/quotes',
      headers: { Authorization: `Bearer ${token}` },
    });
    const ids = listRes.json().data.map((q: { id: string }) => q.id);

    expect(ids).toContain(created.id);
    await app.close();
  });

  it('rejects quote creation with missing vendorId', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/budget-line-items/bli_3/quotes',
      headers: { Authorization: `Bearer ${token}` },
      payload: { amount: 9000, submittedAt: '2026-03-01' },
    });

    expect(res.statusCode).toBe(400);
    await app.close();
  });

  it('rejects quote creation with missing amount', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/budget-line-items/bli_3/quotes',
      headers: { Authorization: `Bearer ${token}` },
      payload: { vendorId: 'vendor_1', submittedAt: '2026-03-01' },
    });

    expect(res.statusCode).toBe(400);
    await app.close();
  });

  it('rejects quote creation with missing submittedAt', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/budget-line-items/bli_3/quotes',
      headers: { Authorization: `Bearer ${token}` },
      payload: { vendorId: 'vendor_1', amount: 9000 },
    });

    expect(res.statusCode).toBe(400);
    await app.close();
  });

  it('returns 404 when line item not found', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/budget-line-items/does-not-exist/quotes',
      headers: { Authorization: `Bearer ${token}` },
      payload: { vendorId: 'vendor_1', amount: 9000, submittedAt: '2026-03-01' },
    });

    expect(res.statusCode).toBe(404);
    await app.close();
  });

  it('requires auth to create a quote', async () => {
    const app = await buildApp();
    await app.ready();

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/budget-line-items/bli_3/quotes',
      payload: { vendorId: 'vendor_1', amount: 9000, submittedAt: '2026-03-01' },
    });

    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it('updates a quote amount and preserves other fields', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/quotes/quote_1',
      headers: { Authorization: `Bearer ${token}` },
      payload: { amount: 115000 },
    });
    const body = res.json();

    expect(res.statusCode).toBe(200);
    expect(body.data.id).toBe('quote_1');
    expect(body.data.amount).toBe(115000);
    expect(body.data.vendorId).toBe('vendor_4');
    expect(body.data.lineItemId).toBe('bli_4');
    await app.close();
  });

  it('returns 404 when updating a non-existent quote', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/quotes/does-not-exist',
      headers: { Authorization: `Bearer ${token}` },
      payload: { amount: 50000 },
    });

    expect(res.statusCode).toBe(404);
    await app.close();
  });

  it('requires auth to update a quote', async () => {
    const app = await buildApp();
    await app.ready();

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/quotes/quote_1',
      payload: { amount: 50000 },
    });

    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it('awarding a quote auto-rejects sibling quotes', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    // Create two pending quotes on bli_3 (no seeds)
    const q1Res = await app.inject({
      method: 'POST',
      url: '/api/v1/budget-line-items/bli_3/quotes',
      headers: { Authorization: `Bearer ${token}` },
      payload: { vendorId: 'vendor_1', amount: 8000, submittedAt: '2026-03-01' },
    });
    const q1 = q1Res.json().data;

    const q2Res = await app.inject({
      method: 'POST',
      url: '/api/v1/budget-line-items/bli_3/quotes',
      headers: { Authorization: `Bearer ${token}` },
      payload: { vendorId: 'vendor_2', amount: 8500, submittedAt: '2026-03-02' },
    });
    const q2 = q2Res.json().data;

    // Award q1
    await app.inject({
      method: 'PATCH',
      url: `/api/v1/quotes/${q1.id}`,
      headers: { Authorization: `Bearer ${token}` },
      payload: { status: 'awarded' },
    });

    // Fetch proj_1 quotes and check q2 is now rejected
    const listRes = await app.inject({
      method: 'GET',
      url: '/api/v1/projects/proj_1/quotes',
      headers: { Authorization: `Bearer ${token}` },
    });
    const quotes = listRes.json().data as { id: string; status: string }[];
    const awardedQuote = quotes.find((q) => q.id === q1.id);
    const rejectedQuote = quotes.find((q) => q.id === q2.id);

    expect(awardedQuote?.status).toBe('awarded');
    expect(rejectedQuote?.status).toBe('rejected');
    await app.close();
  });

  it('awarding does not affect quotes on a different line item', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    // Create a pending quote on bli_3
    const otherRes = await app.inject({
      method: 'POST',
      url: '/api/v1/budget-line-items/bli_3/quotes',
      headers: { Authorization: `Bearer ${token}` },
      payload: { vendorId: 'vendor_3', amount: 9000, submittedAt: '2026-03-01' },
    });
    const otherQuote = otherRes.json().data;

    // Create and award a quote on bli_2 (different line item)
    const q1Res = await app.inject({
      method: 'POST',
      url: '/api/v1/budget-line-items/bli_2/quotes',
      headers: { Authorization: `Bearer ${token}` },
      payload: { vendorId: 'vendor_1', amount: 44000, submittedAt: '2026-03-01' },
    });
    const q1 = q1Res.json().data;

    await app.inject({
      method: 'PATCH',
      url: `/api/v1/quotes/${q1.id}`,
      headers: { Authorization: `Bearer ${token}` },
      payload: { status: 'awarded' },
    });

    // bli_3 quote should still be pending
    const listRes = await app.inject({
      method: 'GET',
      url: '/api/v1/projects/proj_1/quotes',
      headers: { Authorization: `Bearer ${token}` },
    });
    const quotes = listRes.json().data as { id: string; status: string }[];
    const unaffected = quotes.find((q) => q.id === otherQuote.id);

    expect(unaffected?.status).toBe('pending');
    await app.close();
  });
});

describe('Expense lineItemId integration', () => {
  it('seeded expense exp_4 has lineItemId bli_4', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/expenses?projectId=proj_2',
      headers: { Authorization: `Bearer ${token}` },
    });
    const expenses = res.json().data as { id: string; lineItemId?: string }[];
    const exp4 = expenses.find((e) => e.id === 'exp_4');

    expect(exp4).toBeDefined();
    expect(exp4?.lineItemId).toBe('bli_4');
    await app.close();
  });

  it('creates an expense with lineItemId and returns it', async () => {
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
        vendorId: 'vendor_2',
        description: 'Framing crew week 3',
        expenseDate: '2026-03-01',
        lineItemId: 'bli_1',
      },
    });
    const body = res.json();

    expect(res.statusCode).toBe(201);
    expect(body.data.lineItemId).toBe('bli_1');
    await app.close();
  });

  it('creates an expense without lineItemId and it is absent', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/projects/proj_1/expenses',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        amount: 500,
        categoryId: 'cat_6',
        vendorId: 'vendor_1',
        description: 'Misc supplies',
        expenseDate: '2026-03-01',
      },
    });
    const body = res.json();

    expect(res.statusCode).toBe(201);
    expect(body.data.lineItemId).toBeUndefined();
    await app.close();
  });

  it('patches an expense to add lineItemId and it is preserved', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/expenses/exp_1',
      headers: { Authorization: `Bearer ${token}` },
      payload: { lineItemId: 'bli_2' },
    });
    const body = res.json();

    expect(res.statusCode).toBe(200);
    expect(body.data.lineItemId).toBe('bli_2');
    expect(body.data.description).toBe('Foundation pour materials');
    await app.close();
  });
});
