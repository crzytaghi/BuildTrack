import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { buildApp, shouldSeedDemoData } from '../src/app.js';
import { resetDb } from '../src/store.js';
import { prisma } from '../src/lib/prisma.js';

beforeEach(async () => {
  await resetDb();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Demo data seeding', () => {
  // Set explicitly: Prisma loads a developer's local .env, which may enable seeding.
  it('does not create the demo company on startup unless enabled', async () => {
    vi.stubEnv('SEED_DEMO_DATA', '');
    const app = await buildApp();
    await app.ready();
    expect(await prisma.company.findUnique({ where: { id: 'company_seed' } })).toBeNull();
    expect(await prisma.user.findUnique({ where: { email: 'seed@buildtrack.dev' } })).toBeNull();
    await app.close();
  });

  it('does not create the demo company in production even if enabled', async () => {
    vi.stubEnv('SEED_DEMO_DATA', 'true');
    vi.stubEnv('NODE_ENV', 'production');
    const app = await buildApp();
    await app.ready();
    expect(await prisma.company.findUnique({ where: { id: 'company_seed' } })).toBeNull();
    await app.close();
  });

  it('creates the demo company when enabled outside production', async () => {
    vi.stubEnv('SEED_DEMO_DATA', 'true');
    vi.stubEnv('NODE_ENV', 'development');
    const app = await buildApp();
    await app.ready();
    expect(await prisma.user.findUnique({ where: { email: 'seed@buildtrack.dev' } })).not.toBeNull();
    await app.close();
  });

  it('is opt-in and never runs in production', () => {
    expect(shouldSeedDemoData({})).toBe(false);
    expect(shouldSeedDemoData({ SEED_DEMO_DATA: 'false' })).toBe(false);
    expect(shouldSeedDemoData({ SEED_DEMO_DATA: 'true' })).toBe(true);
    expect(shouldSeedDemoData({ SEED_DEMO_DATA: 'true', NODE_ENV: 'development' })).toBe(true);
    expect(shouldSeedDemoData({ SEED_DEMO_DATA: 'true', NODE_ENV: 'production' })).toBe(false);
  });
});
