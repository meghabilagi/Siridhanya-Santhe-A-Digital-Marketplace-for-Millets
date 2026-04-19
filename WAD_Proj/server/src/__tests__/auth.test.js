/**
 * Auth layer tests — covers register, login, auth middleware, and roleGuard.
 * Uses supertest against the Express app with Mongoose mocked so no real DB is needed.
 */

// Set env vars before any module is loaded
process.env.JWT_SECRET = 'test-secret-for-jest';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const jwt = require('jsonwebtoken');

// ── Mock mongoose so no real DB connection is attempted ──────────────────────
jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    connect: jest.fn().mockResolvedValue({}),
  };
});

// ── Mock the User model ──────────────────────────────────────────────────────
jest.mock('../models/User');
const User = require('../models/User');

const app = require('../app');

// ── Helpers ──────────────────────────────────────────────────────────────────
const makeUser = (overrides = {}) => ({
  _id: 'user123',
  name: 'Test User',
  email: 'test@example.com',
  password: '$2a$10$hashedpassword', // bcrypt hash placeholder
  role: 'consumer',
  status: 'active',
  ...overrides,
});

const validToken = () =>
  jwt.sign(
    { userId: 'user123', email: 'test@example.com', role: 'consumer' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

// ── Register ─────────────────────────────────────────────────────────────────
describe('POST /api/auth/register', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 201 with a token on valid registration', async () => {
    User.findOne.mockResolvedValue(null); // no duplicate
    User.create.mockResolvedValue(makeUser());

    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'consumer',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.token).toBe('string');
  });

  it('returns 409 when email already exists', async () => {
    User.findOne.mockResolvedValue(makeUser()); // duplicate found

    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'consumer',
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'test@example.com',
      password: 'password123',
      role: 'consumer',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when email is invalid', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'not-an-email',
      password: 'password123',
      role: 'consumer',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when password is too short (< 8 chars)', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'short',
      role: 'consumer',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when role is invalid', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'superuser',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('JWT payload contains userId, email, and role', async () => {
    const user = makeUser();
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue(user);

    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'consumer',
    });

    expect(res.status).toBe(201);
    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
    expect(decoded).toMatchObject({ email: user.email, role: user.role });
    expect(decoded.userId).toBeDefined();
  });
});

// ── Login ─────────────────────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with a token on valid credentials', async () => {
    const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash('password123', 10);
    User.findOne.mockResolvedValue(makeUser({ password: hashed }));

    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.token).toBe('string');
  });

  it('returns 401 for unregistered email', async () => {
    User.findOne.mockResolvedValue(null);

    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid credentials/i);
  });

  it('returns 401 for wrong password', async () => {
    const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash('correctpassword', 10);
    User.findOne.mockResolvedValue(makeUser({ password: hashed }));

    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'wrongpassword',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 403 for inactive account', async () => {
    const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash('password123', 10);
    User.findOne.mockResolvedValue(makeUser({ password: hashed, status: 'inactive' }));

    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when email is missing', async () => {
    const res = await request(app).post('/api/auth/login').send({
      password: 'password123',
    });

    expect(res.status).toBe(400);
  });

  it('JWT payload contains userId, email, and role', async () => {
    const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash('password123', 10);
    const user = makeUser({ password: hashed });
    User.findOne.mockResolvedValue(user);

    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(200);
    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
    expect(decoded).toMatchObject({ email: user.email, role: user.role });
    expect(decoded.userId).toBeDefined();
  });
});

// ── Auth middleware ───────────────────────────────────────────────────────────
describe('Auth middleware', () => {
  it('returns 401 when no Authorization header is provided', async () => {
    // Use a stub route that requires auth — products stub returns 501 but auth runs first
    // We test the middleware directly by hitting a protected-looking route
    // Since products is a stub, let's test via a custom approach using the middleware directly
    const express = require('express');
    const auth = require('../middleware/auth');
    const testApp = express();
    testApp.get('/protected', auth, (_req, res) => res.json({ ok: true }));

    const res = await request(testApp).get('/protected');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 for a malformed token', async () => {
    const express = require('express');
    const auth = require('../middleware/auth');
    const testApp = express();
    testApp.get('/protected', auth, (_req, res) => res.json({ ok: true }));

    const res = await request(testApp)
      .get('/protected')
      .set('Authorization', 'Bearer not.a.valid.token');
    expect(res.status).toBe(401);
  });

  it('returns 401 for a token signed with wrong secret', async () => {
    const express = require('express');
    const auth = require('../middleware/auth');
    const testApp = express();
    testApp.get('/protected', auth, (_req, res) => res.json({ ok: true }));

    const badToken = jwt.sign({ userId: 'x' }, 'wrong-secret');
    const res = await request(testApp)
      .get('/protected')
      .set('Authorization', `Bearer ${badToken}`);
    expect(res.status).toBe(401);
  });

  it('passes through and attaches req.user for a valid token', async () => {
    const express = require('express');
    const auth = require('../middleware/auth');
    const testApp = express();
    testApp.get('/protected', auth, (req, res) => res.json({ user: req.user }));

    const token = validToken();
    const res = await request(testApp)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ userId: 'user123', role: 'consumer' });
  });
});

// ── roleGuard middleware ──────────────────────────────────────────────────────
describe('roleGuard middleware', () => {
  const express = require('express');
  const auth = require('../middleware/auth');
  const roleGuard = require('../middleware/roleGuard');

  const makeApp = (...roles) => {
    const a = express();
    a.get('/guarded', auth, roleGuard(...roles), (_req, res) => res.json({ ok: true }));
    return a;
  };

  it('allows access when user role matches', async () => {
    const token = validToken(); // role: consumer
    const res = await request(makeApp('consumer'))
      .get('/guarded')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('returns 403 when user role does not match', async () => {
    const token = validToken(); // role: consumer
    const res = await request(makeApp('farmer', 'admin'))
      .get('/guarded')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('allows access when role is one of multiple allowed roles', async () => {
    const token = validToken(); // role: consumer
    const res = await request(makeApp('farmer', 'consumer', 'admin'))
      .get('/guarded')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
