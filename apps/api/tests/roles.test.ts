import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildApp } from '../src/app.js';
import { resetDb, seed } from '../src/store.js';
import { prisma } from '../src/lib/prisma.js';

type App = Awaited<ReturnType<typeof buildApp>>;

const API = '/api/v1';
const PASSWORD = 'Securepass1!';
let app: App;
let ownerToken: string;

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

const req = (method: 'GET' | 'POST' | 'PATCH' | 'DELETE', url: string, token?: string, payload?: object) =>
  app.inject({ method, url: `${API}${url}`, headers: token ? auth(token) : {}, payload });

/** Invites `email` with `role` as the seed owner and accepts the invite. */
const addMember = async (email: string, role: 'manager' | 'field') => {
  const inviteRes = await req('POST', '/invites', ownerToken, { email, role });
  expect(inviteRes.statusCode).toBe(201);
  const acceptRes = await req('POST', `/invites/token/${inviteRes.json().token}/accept`, undefined, {
    name: `${role} user`,
    password: PASSWORD,
  });
  expect(acceptRes.statusCode).toBe(201);
  const body = acceptRes.json();
  return { token: body.token as string, id: body.user.id as string };
};

const assign = async (projectId: string, userId: string) => {
  const res = await req('POST', `/projects/${projectId}/members`, ownerToken, { userId });
  expect(res.statusCode).toBe(201);
};

beforeEach(async () => {
  await resetDb();
  await seed();
  app = await buildApp();
  await app.ready();
  const login = await req('POST', '/auth/login', undefined, { email: 'seed@buildtrack.dev', password: 'securepass1' });
  ownerToken = login.json().token;
});

afterEach(async () => {
  await app.close();
});

describe('Roles in auth responses', () => {
  it('signup creates an owner and /auth/me reports the role', async () => {
    const signup = await req('POST', '/auth/signup', undefined, {
      name: 'New Owner', email: 'new@owner.dev', password: PASSWORD,
      companyName: 'New Co', address: '1 Main St', phone: '555-0100',
    });
    expect(signup.statusCode).toBe(201);
    expect(signup.json().user.role).toBe('owner');

    const me = await req('GET', '/auth/me', signup.json().token);
    expect(me.json().user.role).toBe('owner');
  });

  it('login returns the role', async () => {
    const login = await req('POST', '/auth/login', undefined, { email: 'seed@buildtrack.dev', password: 'securepass1' });
    expect(login.json().user.role).toBe('owner');
  });
});

describe('Invites', () => {
  it('owner invites a member who joins the same company with the invited role', async () => {
    const inviteRes = await req('POST', '/invites', ownerToken, { email: 'Field@Example.com', role: 'field' });
    expect(inviteRes.statusCode).toBe(201);
    const { token, data } = inviteRes.json();
    expect(data.email).toBe('field@example.com');
    expect(token).toMatch(/^[0-9a-f]{64}$/);

    const pending = await req('GET', '/invites', ownerToken);
    expect(pending.json().data).toHaveLength(1);

    const lookup = await req('GET', `/invites/token/${token}`);
    expect(lookup.statusCode).toBe(200);
    expect(lookup.json().data).toEqual({ email: 'field@example.com', role: 'field', companyName: 'BuildTrack Demo Co.' });

    const accept = await req('POST', `/invites/token/${token}/accept`, undefined, { name: 'Fran Field', password: PASSWORD });
    expect(accept.statusCode).toBe(201);
    expect(accept.json().user).toMatchObject({ email: 'field@example.com', name: 'Fran Field', role: 'field' });

    const user = await prisma.user.findUnique({ where: { email: 'field@example.com' } });
    expect(user?.companyId).toBe('company_seed');

    const login = await req('POST', '/auth/login', undefined, { email: 'field@example.com', password: PASSWORD });
    expect(login.statusCode).toBe(200);
    expect(login.json().user.role).toBe('field');

    // Used invites disappear from the pending list and can't be redeemed again.
    expect((await req('GET', '/invites', ownerToken)).json().data).toHaveLength(0);
    expect((await req('GET', `/invites/token/${token}`)).statusCode).toBe(404);
    const again = await req('POST', `/invites/token/${token}/accept`, undefined, { name: 'Again', password: PASSWORD });
    expect(again.statusCode).toBe(404);
  });

  it('stores only a hash of the invite token', async () => {
    const { token } = (await req('POST', '/invites', ownerToken, { email: 'a@b.dev', role: 'field' })).json();
    const row = await prisma.invite.findFirst({ where: { email: 'a@b.dev' } });
    expect(row?.tokenHash).toBeTruthy();
    expect(row?.tokenHash).not.toBe(token);
  });

  it('rejects a weak password and leaves the invite usable', async () => {
    const { token } = (await req('POST', '/invites', ownerToken, { email: 'a@b.dev', role: 'field' })).json();
    const weak = await req('POST', `/invites/token/${token}/accept`, undefined, { name: 'A', password: 'weak' });
    expect(weak.statusCode).toBe(400);
    expect((await req('GET', `/invites/token/${token}`)).statusCode).toBe(200);
  });

  it('rejects inviting an email that already has an account', async () => {
    const res = await req('POST', '/invites', ownerToken, { email: 'seed@buildtrack.dev', role: 'manager' });
    expect(res.statusCode).toBe(409);
  });

  it('rejects inviting someone as owner', async () => {
    const res = await req('POST', '/invites', ownerToken, { email: 'a@b.dev', role: 'owner' });
    expect(res.statusCode).toBe(400);
  });

  it('rejects expired invites', async () => {
    const { token } = (await req('POST', '/invites', ownerToken, { email: 'a@b.dev', role: 'field' })).json();
    await prisma.invite.updateMany({ data: { expiresAt: Date.now() - 1000 } });
    expect((await req('GET', `/invites/token/${token}`)).statusCode).toBe(404);
    const accept = await req('POST', `/invites/token/${token}/accept`, undefined, { name: 'A', password: PASSWORD });
    expect(accept.statusCode).toBe(404);
  });

  it('owner can revoke a pending invite', async () => {
    const { token, data } = (await req('POST', '/invites', ownerToken, { email: 'a@b.dev', role: 'field' })).json();
    expect((await req('DELETE', `/invites/${data.id}`, ownerToken)).statusCode).toBe(204);
    expect((await req('GET', `/invites/token/${token}`)).statusCode).toBe(404);
  });

  it('re-inviting the same email replaces the earlier link', async () => {
    const first = (await req('POST', '/invites', ownerToken, { email: 'a@b.dev', role: 'field' })).json();
    const second = (await req('POST', '/invites', ownerToken, { email: 'a@b.dev', role: 'manager' })).json();
    expect((await req('GET', `/invites/token/${first.token}`)).statusCode).toBe(404);
    expect((await req('GET', `/invites/token/${second.token}`)).json().data.role).toBe('manager');
  });

  it('only owners can manage invites', async () => {
    const manager = await addMember('m@b.dev', 'manager');
    const field = await addMember('f@b.dev', 'field');
    for (const token of [manager.token, field.token]) {
      expect((await req('POST', '/invites', token, { email: 'x@b.dev', role: 'field' })).statusCode).toBe(403);
      expect((await req('GET', '/invites', token)).statusCode).toBe(403);
    }
    expect((await req('POST', '/invites', undefined, { email: 'x@b.dev', role: 'field' })).statusCode).toBe(401);
  });
});

describe('Members', () => {
  it('owners and managers can list members; field users cannot', async () => {
    const manager = await addMember('m@b.dev', 'manager');
    const field = await addMember('f@b.dev', 'field');

    const list = await req('GET', '/members', ownerToken);
    expect(list.statusCode).toBe(200);
    expect(list.json().data.map((m: { role: string }) => m.role).sort()).toEqual(['field', 'manager', 'owner']);
    expect(list.json().data[0]).not.toHaveProperty('passwordHash');

    expect((await req('GET', '/members', manager.token)).statusCode).toBe(200);
    expect((await req('GET', '/members', field.token)).statusCode).toBe(403);
  });

  it('role changes take effect immediately', async () => {
    const field = await addMember('f@b.dev', 'field');
    expect((await req('GET', '/budget-line-items', field.token)).statusCode).toBe(403);

    const promote = await req('PATCH', `/members/${field.id}`, ownerToken, { role: 'manager' });
    expect(promote.statusCode).toBe(200);
    expect(promote.json().data.role).toBe('manager');
    expect((await req('GET', '/budget-line-items', field.token)).statusCode).toBe(200);
  });

  it('a company always keeps at least one owner', async () => {
    const demote = await req('PATCH', '/members/user_seed', ownerToken, { role: 'manager' });
    expect(demote.statusCode).toBe(409);

    const manager = await addMember('m@b.dev', 'manager');
    expect((await req('PATCH', `/members/${manager.id}`, ownerToken, { role: 'owner' })).statusCode).toBe(200);
    expect((await req('PATCH', '/members/user_seed', ownerToken, { role: 'manager' })).statusCode).toBe(200);
  });

  it('owner cannot remove themselves', async () => {
    expect((await req('DELETE', '/members/user_seed', ownerToken)).statusCode).toBe(409);
  });

  it('removing a member signs them out', async () => {
    const field = await addMember('f@b.dev', 'field');
    expect((await req('DELETE', `/members/${field.id}`, ownerToken)).statusCode).toBe(204);
    expect((await req('GET', '/projects', field.token)).statusCode).toBe(401);
  });

  it('managers cannot change roles or remove members', async () => {
    const manager = await addMember('m@b.dev', 'manager');
    const field = await addMember('f@b.dev', 'field');
    expect((await req('PATCH', `/members/${field.id}`, manager.token, { role: 'manager' })).statusCode).toBe(403);
    expect((await req('DELETE', `/members/${field.id}`, manager.token)).statusCode).toBe(403);
  });

  it('members of another company are invisible', async () => {
    const other = await req('POST', '/auth/signup', undefined, {
      name: 'Other', email: 'other@co.dev', password: PASSWORD,
      companyName: 'Other Co', address: '1 Main St', phone: '555-0100',
    });
    const otherToken = other.json().token;
    const otherList = await req('GET', '/members', otherToken);
    expect(otherList.json().data).toHaveLength(1);
    expect((await req('PATCH', '/members/user_seed', otherToken, { role: 'field' })).statusCode).toBe(404);
    expect((await req('DELETE', '/members/user_seed', otherToken)).statusCode).toBe(404);
  });
});

describe('Field users', () => {
  let field: { token: string; id: string };

  beforeEach(async () => {
    field = await addMember('f@b.dev', 'field');
    await assign('proj_1', field.id);
  });

  it('only see projects they are assigned to', async () => {
    const list = await req('GET', '/projects', field.token);
    expect(list.json().data.map((p: { id: string }) => p.id)).toEqual(['proj_1']);
    expect(list.json().data[0]).not.toHaveProperty('budgetTotal');
    expect((await req('GET', '/projects/proj_1', field.token)).json().data).not.toHaveProperty('budgetTotal');
    expect((await req('GET', '/projects/proj_1', ownerToken)).json().data.budgetTotal).toBe(420000);
    expect((await req('GET', '/projects/proj_1', field.token)).statusCode).toBe(200);
    expect((await req('GET', '/projects/proj_2', field.token)).statusCode).toBe(404);
  });

  it('manage tasks only on assigned projects', async () => {
    const create = await req('POST', '/projects/proj_1/tasks', field.token, { title: 'Pour slab' });
    expect(create.statusCode).toBe(201);
    expect((await req('PATCH', `/tasks/${create.json().data.id}`, field.token, { status: 'done' })).statusCode).toBe(200);

    expect((await req('POST', '/projects/proj_2/tasks', field.token, { title: 'Nope' })).statusCode).toBe(404);
    expect((await req('PATCH', '/tasks/task_proj_2_1', field.token, { status: 'done' })).statusCode).toBe(404);
    expect((await req('DELETE', '/tasks/task_proj_2_1', field.token)).statusCode).toBe(404);
    expect((await req('GET', '/projects/proj_2/tasks', field.token)).json().data).toHaveLength(0);

    const all = await req('GET', '/tasks', field.token);
    expect(new Set(all.json().data.map((t: { projectId: string }) => t.projectId))).toEqual(new Set(['proj_1']));
  });

  it('log expenses on assigned projects but cannot edit or delete them', async () => {
    const payload = { amount: 120, categoryId: 'cat_1', vendorId: 'vendor_1', description: 'Rebar', expenseDate: '2026-03-01' };
    const create = await req('POST', '/projects/proj_1/expenses', field.token, payload);
    expect(create.statusCode).toBe(201);
    expect((await req('POST', '/projects/proj_2/expenses', field.token, payload)).statusCode).toBe(404);

    const all = await req('GET', '/expenses', field.token);
    expect(new Set(all.json().data.map((e: { projectId: string }) => e.projectId))).toEqual(new Set(['proj_1']));

    expect((await req('PATCH', `/expenses/${create.json().data.id}`, field.token, { amount: 1 })).statusCode).toBe(403);
    expect((await req('DELETE', `/expenses/${create.json().data.id}`, field.token)).statusCode).toBe(403);
  });

  it('are blocked from projects admin, budgets, quotes, invoices, vendors/categories edits and company settings', async () => {
    const blocked: [Parameters<typeof req>[0], string, object?][] = [
      ['POST', '/projects', { name: 'X' }],
      ['PATCH', '/projects/proj_1', { name: 'X' }],
      ['DELETE', '/projects/proj_1'],
      ['GET', '/budget-line-items'],
      ['GET', '/projects/proj_1/budget-line-items'],
      ['POST', '/projects/proj_1/budget-line-items', { categoryId: 'cat_1', description: 'X', budgetedAmount: 1 }],
      ['GET', '/projects/proj_1/quotes'],
      ['GET', '/invoices'],
      ['GET', '/projects/proj_1/invoices'],
      ['POST', '/vendors', { name: 'X' }],
      ['DELETE', '/vendors/vendor_1'],
      ['POST', '/categories', { name: 'X' }],
      ['PATCH', '/company/me', { name: 'X' }],
      ['GET', '/projects/proj_1/members'],
    ];
    for (const [method, url, body] of blocked) {
      const res = await req(method, url, field.token, body);
      expect(res.statusCode, `${method} ${url}`).toBe(403);
    }
  });

  it('can view vendors and categories, without company-wide spend totals', async () => {
    expect((await req('GET', '/vendors', field.token)).statusCode).toBe(200);
    expect((await req('GET', '/categories', field.token)).statusCode).toBe(200);
    const vendor = await req('GET', '/vendors/vendor_1', field.token);
    expect(vendor.statusCode).toBe(200);
    expect(vendor.json().data).not.toHaveProperty('totalSpend');

    const ownerView = await req('GET', '/vendors/vendor_1', ownerToken);
    expect(ownerView.json().data).toHaveProperty('totalSpend');
  });

  it('only see and add documents on assigned projects', async () => {
    const doc = (projectId?: string) => ({
      fileKey: 'k', title: 'Plan', fileName: 'plan.pdf', fileSize: 10, mimeType: 'application/pdf', ...(projectId ? { projectId } : {}),
    });
    expect((await req('POST', '/documents', ownerToken, doc())).statusCode).toBe(201); // company-wide
    expect((await req('POST', '/documents', ownerToken, doc('proj_2'))).statusCode).toBe(201);

    expect((await req('POST', '/documents', field.token, doc('proj_1'))).statusCode).toBe(201);
    expect((await req('POST', '/documents', field.token, doc('proj_2'))).statusCode).toBe(404);
    expect((await req('POST', '/documents', field.token, doc())).statusCode).toBe(404);

    const fieldDocs = (await req('GET', '/documents', field.token)).json().data;
    expect(fieldDocs.map((d: { projectId: string }) => d.projectId)).toEqual(['proj_1']);
    expect((await req('GET', '/documents', ownerToken)).json().data).toHaveLength(3);

    const otherDoc = (await prisma.document.findFirst({ where: { projectId: 'proj_2' } }))!;
    expect((await req('PATCH', `/documents/${otherDoc.id}`, field.token, { notes: 'x' })).statusCode).toBe(404);
  });

  it('lose access when unassigned', async () => {
    expect((await req('DELETE', `/projects/proj_1/members/${field.id}`, ownerToken)).statusCode).toBe(204);
    expect((await req('GET', '/projects', field.token)).json().data).toHaveLength(0);
    expect((await req('GET', '/projects/proj_1', field.token)).statusCode).toBe(404);
  });
});

describe('Managers', () => {
  it('have full project and financial access but no owner powers', async () => {
    const manager = await addMember('m@b.dev', 'manager');
    expect((await req('GET', '/projects', manager.token)).json().data).toHaveLength(8);
    expect((await req('POST', '/projects', manager.token, { name: 'New job' })).statusCode).toBe(201);
    expect((await req('GET', '/budget-line-items', manager.token)).statusCode).toBe(200);
    expect((await req('GET', '/invoices', manager.token)).statusCode).toBe(200);
    expect((await req('POST', '/vendors', manager.token, { name: 'New vendor' })).statusCode).toBe(201);

    expect((await req('PATCH', '/company/me', manager.token, { name: 'X' })).statusCode).toBe(403);
    expect((await req('POST', '/company/setup', manager.token, { name: 'X' })).statusCode).toBe(403);
  });

  it('can assign field users to projects, but only field users from their company', async () => {
    const manager = await addMember('m@b.dev', 'manager');
    const field = await addMember('f@b.dev', 'field');

    const add = await req('POST', '/projects/proj_3/members', manager.token, { userId: field.id });
    expect(add.statusCode).toBe(201);
    const list = await req('GET', '/projects/proj_3/members', manager.token);
    expect(list.json().data.map((m: { id: string }) => m.id)).toEqual([field.id]);

    // Assigning twice is harmless.
    expect((await req('POST', '/projects/proj_3/members', manager.token, { userId: field.id })).statusCode).toBe(201);

    expect((await req('POST', '/projects/proj_3/members', manager.token, { userId: manager.id })).statusCode).toBe(400);
    expect((await req('POST', '/projects/proj_3/members', manager.token, { userId: 'user_nope' })).statusCode).toBe(404);
  });
});
