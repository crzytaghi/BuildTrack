import { describe, it, expect, beforeEach } from 'vitest';
import { buildApp } from '../src/app.js';
import { resetDb, seed } from '../src/store.js';

const signupPayload = {
  name: 'Alex Builder',
  email: 'alex@buildtrack.com',
  password: 'securepass1',
};

beforeEach(() => {
  resetDb();
  seed();
});

describe('Company API', () => {
  // Verifies that a company record is available and setup can be completed.
  it('returns company info and updates company setup', async () => {
    const app = await buildApp();
    await app.ready();

    const signupRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/signup',
      payload: signupPayload,
    });
    const signupBody = signupRes.json();

    const meRes = await app.inject({
      method: 'GET',
      url: '/api/v1/company/me',
      headers: { Authorization: `Bearer ${signupBody.token}` },
    });
    const meBody = meRes.json();

    expect(meRes.statusCode).toBe(200);
    expect(meBody.company).toBeTruthy();

    const setupRes = await app.inject({
      method: 'POST',
      url: '/api/v1/company/setup',
      headers: { Authorization: `Bearer ${signupBody.token}` },
      payload: { name: 'BuildTrack LLC' },
    });
    const setupBody = setupRes.json();

    expect(setupRes.statusCode).toBe(200);
    expect(setupBody.company.name).toBe('BuildTrack LLC');
    expect(setupBody.company.companySetupComplete).toBe(true);

    await app.close();
  });
});
