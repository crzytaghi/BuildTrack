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

describe('Vendors API', () => {
  it('lists all seeded vendors', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/vendors',
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = res.json();

    expect(res.statusCode).toBe(200);
    expect(body.data).toHaveLength(10);
    expect(body.data.every((v: { id: string; name: string }) => v.id && v.name)).toBe(true);
    await app.close();
  });

  it('requires auth to list vendors', async () => {
    const app = await buildApp();
    await app.ready();

    const res = await app.inject({ method: 'GET', url: '/api/v1/vendors' });

    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it('creates a vendor and returns 201 with id', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/vendors',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        name: 'New Test Vendor',
        trade: 'Plumbing',
        contactName: 'Jane Doe',
        phone: '555-1234',
        email: 'jane@testvendor.com',
        notes: 'Reliable contractor',
      },
    });
    const body = res.json();

    expect(res.statusCode).toBe(201);
    expect(body.data.id).toBeTruthy();
    expect(body.data.name).toBe('New Test Vendor');
    expect(body.data.trade).toBe('Plumbing');
    expect(body.data.contactName).toBe('Jane Doe');
    expect(body.data.phone).toBe('555-1234');
    expect(body.data.email).toBe('jane@testvendor.com');
    expect(body.data.notes).toBe('Reliable contractor');
    await app.close();
  });

  it('created vendor appears in the vendor list', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/vendors',
      headers: { Authorization: `Bearer ${token}` },
      payload: { name: 'Unique Vendor Co.' },
    });
    const created = createRes.json().data;

    const listRes = await app.inject({
      method: 'GET',
      url: '/api/v1/vendors',
      headers: { Authorization: `Bearer ${token}` },
    });
    const ids = listRes.json().data.map((v: { id: string }) => v.id);

    expect(ids).toContain(created.id);
    await app.close();
  });

  it('rejects vendor creation with missing name', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/vendors',
      headers: { Authorization: `Bearer ${token}` },
      payload: { trade: 'Plumbing' },
    });

    expect(res.statusCode).toBe(400);
    await app.close();
  });

  it('requires auth to create a vendor', async () => {
    const app = await buildApp();
    await app.ready();

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/vendors',
      payload: { name: 'Unauthorized Vendor' },
    });

    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it('updates a vendor and preserves unchanged fields', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/vendors/vendor_1',
      headers: { Authorization: `Bearer ${token}` },
      payload: { contactName: 'Bob Smith', phone: '555-9999' },
    });
    const body = res.json();

    expect(res.statusCode).toBe(200);
    expect(body.data.id).toBe('vendor_1');
    expect(body.data.contactName).toBe('Bob Smith');
    expect(body.data.phone).toBe('555-9999');
    // Unchanged fields are preserved
    expect(body.data.name).toBe('Concrete Supply Co.');
    expect(body.data.trade).toBe('Materials');
    await app.close();
  });

  it('returns 404 when updating a non-existent vendor', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/vendors/does-not-exist',
      headers: { Authorization: `Bearer ${token}` },
      payload: { name: 'Updated Name' },
    });

    expect(res.statusCode).toBe(404);
    await app.close();
  });

  it('requires auth to update a vendor', async () => {
    const app = await buildApp();
    await app.ready();

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/vendors/vendor_1',
      payload: { name: 'Updated Name' },
    });

    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it('gets a single vendor with totalSpend and expenseCount', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    // vendor_2 (Rodriguez Framing LLC) is linked to exp_2 ($3,200) only
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/vendors/vendor_2',
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = res.json();

    expect(res.statusCode).toBe(200);
    expect(body.data.id).toBe('vendor_2');
    expect(body.data.name).toBe('Rodriguez Framing LLC');
    expect(body.data.expenseCount).toBe(1);
    expect(body.data.totalSpend).toBe(3200);
    await app.close();
  });

  it('returns 404 for a non-existent vendor detail', async () => {
    const app = await buildApp();
    await app.ready();
    const token = await getToken(app);

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/vendors/does-not-exist',
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(404);
    await app.close();
  });

  it('requires auth to get a vendor detail', async () => {
    const app = await buildApp();
    await app.ready();

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/vendors/vendor_1',
    });

    expect(res.statusCode).toBe(401);
    await app.close();
  });
});
