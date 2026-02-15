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

describe('Auth API', () => {
  // Verifies that a new account can be created and returns a session token.
  it('signs up a new user', async () => {
    const app = await buildApp();
    await app.ready();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/signup',
      payload: signupPayload,
    });
    const body = res.json();
    expect(res.statusCode).toBe(201);
    expect(body.token).toBeTruthy();
    expect(body.user.email).toBe(signupPayload.email);
    await app.close();
  });

  // Ensures the API enforces unique emails.
  it('rejects duplicate signup email', async () => {
    const app = await buildApp();
    await app.ready();
    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/signup',
      payload: signupPayload,
    });
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/signup',
      payload: signupPayload,
    });
    const body = res.json();
    expect(res.statusCode).toBe(409);
    expect(body.error).toBe('Email already in use');
    await app.close();
  });

  // Confirms a valid email/password pair produces a token.
  it('logs in with valid credentials', async () => {
    const app = await buildApp();
    await app.ready();
    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/signup',
      payload: signupPayload,
    });
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: signupPayload.email, password: signupPayload.password },
    });
    const body = res.json();
    expect(res.statusCode).toBe(200);
    expect(body.token).toBeTruthy();
    expect(body.user.email).toBe(signupPayload.email);
    await app.close();
  });

  // Confirms bad passwords are rejected with 401.
  it('rejects invalid credentials', async () => {
    const app = await buildApp();
    await app.ready();
    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/signup',
      payload: signupPayload,
    });
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: signupPayload.email, password: 'wrongpass1' },
    });
    const body = res.json();
    expect(res.statusCode).toBe(401);
    expect(body.error).toBe('Invalid credentials');
    await app.close();
  });

  // Verifies protected routes require a valid Bearer token.
  it('requires auth for protected endpoints', async () => {
    const app = await buildApp();
    await app.ready();
    const res = await app.inject({ method: 'GET', url: '/api/v1/projects' });
    const body = res.json();
    expect(res.statusCode).toBe(401);
    expect(body.error).toBe('Unauthorized');
    await app.close();
  });
});
