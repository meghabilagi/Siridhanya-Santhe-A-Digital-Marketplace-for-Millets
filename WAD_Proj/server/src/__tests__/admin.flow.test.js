/**
 * Admin flow integration test — covers product verification and user management.
 *
 * Flow:
 *   1. Register a farmer user
 *   2. Register an admin user
 *   3. Farmer creates a product
 *   4. Verify product starts as 'pending' (GET /api/admin/products/pending includes it)
 *   5. Admin approves the product (PUT /api/admin/products/:id/verify { status: 'verified' })
 *   6. Product appears in public listing (GET /api/products)
 *   7. Admin rejects the product (PUT /api/admin/products/:id/verify { status: 'rejected' })
 *   8. Product disappears from public listing (GET /api/products)
 *
 * Also tests:
 *   - Non-admin cannot access admin routes (403)
 *   - Admin can list users (GET /api/admin/users)
 *   - Admin can deactivate a user (PUT /api/admin/users/:id/status { status: 'inactive' })
 *   - Deactivated user cannot login (403)
 *
 * Requirements: 12.1–12.4
 */

process.env.JWT_SECRET = 'test-secret-for-jest';
process.env.NODE_ENV = 'test';

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request = require('supertest');

const app = require('../app');

let mongod;

// ── DB lifecycle ─────────────────────────────────────────────────────────────
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

// ── Helpers ──────────────────────────────────────────────────────────────────
const registerUser = (payload) =>
  request(app).post('/api/auth/register').send(payload);

const loginUser = (payload) =>
  request(app).post('/api/auth/login').send(payload);

// ── Product verification flow ─────────────────────────────────────────────────
describe('Admin product verification flow', () => {
  it('covers the full approve/reject lifecycle and public listing visibility', async () => {
    // 1. Register farmer
    const farmerRes = await registerUser({
      name: 'Test Farmer',
      email: 'farmer@example.com',
      password: 'password123',
      role: 'farmer',
      village: 'Dharwad',
      state: 'Karnataka',
      phone: '9876543210',
    });
    expect(farmerRes.status).toBe(201);
    const farmerToken = farmerRes.body.token;

    // 2. Register admin
    const adminRes = await registerUser({
      name: 'Test Admin',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
    });
    expect(adminRes.status).toBe(201);
    const adminToken = adminRes.body.token;

    // 3. Farmer creates a product
    const createRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({
        name: 'Finger Millet',
        description: 'Organic finger millet from Karnataka',
        price: 90,
        quantity: 100,
        milletType: 'Finger',
        qualityGrade: 'Organic',
      });
    expect(createRes.status).toBe(201);
    const product = createRes.body.data;

    // 4. Product starts as 'pending'
    expect(product.verificationStatus).toBe('pending');

    // Pending product should appear in admin pending list
    const pendingRes = await request(app)
      .get('/api/admin/products/pending')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(pendingRes.status).toBe(200);
    const pendingIds = pendingRes.body.data.products.map((p) => p._id);
    expect(pendingIds).toContain(product._id);

    // Pending product should NOT appear in public listing
    const publicBeforeApprove = await request(app).get('/api/products');
    expect(publicBeforeApprove.status).toBe(200);
    const publicIdsBefore = publicBeforeApprove.body.data.products.map((p) => p._id);
    expect(publicIdsBefore).not.toContain(product._id);

    // 5. Admin approves the product
    const approveRes = await request(app)
      .put(`/api/admin/products/${product._id}/verify`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'verified' });
    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.verificationStatus).toBe('verified');

    // 6. Product now appears in public listing
    const publicAfterApprove = await request(app).get('/api/products');
    expect(publicAfterApprove.status).toBe(200);
    const publicIdsAfterApprove = publicAfterApprove.body.data.products.map((p) => p._id);
    expect(publicIdsAfterApprove).toContain(product._id);

    // 7. Admin rejects the product
    const rejectRes = await request(app)
      .put(`/api/admin/products/${product._id}/verify`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'rejected' });
    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.data.verificationStatus).toBe('rejected');

    // 8. Product disappears from public listing
    const publicAfterReject = await request(app).get('/api/products');
    expect(publicAfterReject.status).toBe(200);
    const publicIdsAfterReject = publicAfterReject.body.data.products.map((p) => p._id);
    expect(publicIdsAfterReject).not.toContain(product._id);
  });
});

// ── Non-admin access control ──────────────────────────────────────────────────
describe('Admin route access control', () => {
  it('returns 403 when a non-admin user accesses admin routes', async () => {
    const farmerRes = await registerUser({
      name: 'Farmer No Admin',
      email: 'farmer2@example.com',
      password: 'password123',
      role: 'farmer',
    });
    const farmerToken = farmerRes.body.token;

    const consumerRes = await registerUser({
      name: 'Consumer No Admin',
      email: 'consumer@example.com',
      password: 'password123',
      role: 'consumer',
    });
    const consumerToken = consumerRes.body.token;

    // Farmer cannot access admin routes
    const farmerAdminRes = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${farmerToken}`);
    expect(farmerAdminRes.status).toBe(403);

    // Consumer cannot access admin routes
    const consumerAdminRes = await request(app)
      .get('/api/admin/products/pending')
      .set('Authorization', `Bearer ${consumerToken}`);
    expect(consumerAdminRes.status).toBe(403);
  });
});

// ── User management flow ──────────────────────────────────────────────────────
describe('Admin user management flow', () => {
  it('admin can list users, deactivate a user, and deactivated user cannot login', async () => {
    // Register a farmer
    const farmerRes = await registerUser({
      name: 'Managed Farmer',
      email: 'managed@example.com',
      password: 'password123',
      role: 'farmer',
    });
    expect(farmerRes.status).toBe(201);

    // Register admin
    const adminRes = await registerUser({
      name: 'Admin User',
      email: 'admin2@example.com',
      password: 'password123',
      role: 'admin',
    });
    expect(adminRes.status).toBe(201);
    const adminToken = adminRes.body.token;

    // Admin lists users — both should appear
    const listRes = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    const emails = listRes.body.data.users.map((u) => u.email);
    expect(emails).toContain('managed@example.com');
    expect(emails).toContain('admin2@example.com');

    // Find the farmer's id from the list
    const farmerUser = listRes.body.data.users.find((u) => u.email === 'managed@example.com');
    expect(farmerUser).toBeDefined();

    // Admin deactivates the farmer
    const deactivateRes = await request(app)
      .put(`/api/admin/users/${farmerUser._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'inactive' });
    expect(deactivateRes.status).toBe(200);
    expect(deactivateRes.body.data.status).toBe('inactive');

    // Deactivated farmer cannot login
    const loginRes = await loginUser({
      email: 'managed@example.com',
      password: 'password123',
    });
    expect(loginRes.status).toBe(403);
    expect(loginRes.body.success).toBe(false);
  });
});
