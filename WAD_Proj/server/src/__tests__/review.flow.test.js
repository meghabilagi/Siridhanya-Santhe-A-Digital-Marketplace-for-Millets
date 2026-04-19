/**
 * Review flow integration test — covers the full review submission journey.
 *
 * Flow:
 *   1. Register a farmer and a consumer
 *   2. Farmer creates a product → manually verify it
 *   3. Consumer adds to cart and checks out (creates an order)
 *   4. Manually update the order item status to 'delivered' via Order model
 *   5. Consumer submits a review (POST /api/reviews/:productId) → 201
 *   6. Verify duplicate review is rejected (409)
 *   7. Verify averageRating on the product is updated (GET /api/products/:id)
 *
 * Also tests:
 *   - Review submission without a delivered order returns 403
 *   - Review with invalid rating (0 or 6) is handled gracefully
 *
 * Requirements: 10.1–10.4
 */

process.env.JWT_SECRET = 'test-secret-for-jest';
process.env.NODE_ENV = 'test';

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request = require('supertest');

const app = require('../app');
const Product = require('../models/Product');
const Order = require('../models/Order');

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

/**
 * Full setup: register farmer + consumer, create + verify product,
 * add to cart, checkout, return { consumerToken, productId, orderId }.
 */
async function setupOrderedProduct() {
  const farmerRes = await registerUser({
    name: 'Test Farmer',
    email: 'farmer@example.com',
    password: 'password123',
    role: 'farmer',
  });
  const farmerToken = farmerRes.body.token;

  const consumerRes = await registerUser({
    name: 'Test Consumer',
    email: 'consumer@example.com',
    password: 'password123',
    role: 'consumer',
  });
  const consumerToken = consumerRes.body.token;

  // Create product
  const createRes = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${farmerToken}`)
    .send({
      name: 'Foxtail Millet',
      description: 'Premium foxtail millet',
      price: 80,
      quantity: 50,
      milletType: 'Foxtail',
      qualityGrade: 'A',
    });
  const productId = createRes.body.data._id;

  // Manually verify the product
  await Product.findByIdAndUpdate(productId, { verificationStatus: 'verified' });

  // Add to cart
  await request(app)
    .post('/api/cart')
    .set('Authorization', `Bearer ${consumerToken}`)
    .send({ productId, quantity: 2 });

  // Checkout
  const checkoutRes = await request(app)
    .post('/api/orders/checkout')
    .set('Authorization', `Bearer ${consumerToken}`)
    .send({
      deliveryAddress: {
        street: '1 Main St',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
      },
    });
  const orderId = checkoutRes.body.data._id;

  return { consumerToken, productId, orderId };
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('Review flow integration', () => {
  it('completes the full review journey and verifies all side-effects', async () => {
    const { consumerToken, productId, orderId } = await setupOrderedProduct();

    // 4. Manually mark the order item as 'delivered'
    await Order.updateOne(
      { _id: orderId },
      { $set: { 'items.$[].status': 'delivered' } }
    );

    // 5. Consumer submits a review → 201
    const reviewRes = await request(app)
      .post(`/api/reviews/${productId}`)
      .set('Authorization', `Bearer ${consumerToken}`)
      .send({ rating: 4, comment: 'Great millet!' });

    expect(reviewRes.status).toBe(201);
    expect(reviewRes.body.success).toBe(true);
    expect(reviewRes.body.data.rating).toBe(4);
    expect(reviewRes.body.data.comment).toBe('Great millet!');
    expect(reviewRes.body.data.reviewerName).toBe('Test Consumer');

    // 6. Duplicate review → 409
    const dupRes = await request(app)
      .post(`/api/reviews/${productId}`)
      .set('Authorization', `Bearer ${consumerToken}`)
      .send({ rating: 5, comment: 'Trying again' });

    expect(dupRes.status).toBe(409);
    expect(dupRes.body.success).toBe(false);

    // 7. Verify averageRating updated on the product
    const productRes = await request(app).get(`/api/products/${productId}`);
    expect(productRes.status).toBe(200);
    expect(productRes.body.data.averageRating).toBe(4);
    expect(productRes.body.data.reviewCount).toBe(1);
  });

  it('returns 403 when consumer has no delivered order for the product', async () => {
    const { consumerToken, productId } = await setupOrderedProduct();
    // Order item status remains 'pending' — NOT delivered

    const reviewRes = await request(app)
      .post(`/api/reviews/${productId}`)
      .set('Authorization', `Bearer ${consumerToken}`)
      .send({ rating: 3, comment: 'Should not work' });

    expect(reviewRes.status).toBe(403);
    expect(reviewRes.body.success).toBe(false);
  });

  it('returns 403 when consumer has no order at all for the product', async () => {
    // Register a fresh consumer with no orders
    const consumerRes = await registerUser({
      name: 'No Order Consumer',
      email: 'noorder@example.com',
      password: 'password123',
      role: 'consumer',
    });
    const consumerToken = consumerRes.body.token;

    // Register farmer and create a verified product
    const farmerRes = await registerUser({
      name: 'Farmer B',
      email: 'farmerb@example.com',
      password: 'password123',
      role: 'farmer',
    });
    const farmerToken = farmerRes.body.token;

    const createRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({ name: 'Pearl Millet', price: 60, quantity: 10, qualityGrade: 'B' });
    const productId = createRes.body.data._id;
    await Product.findByIdAndUpdate(productId, { verificationStatus: 'verified' });

    const reviewRes = await request(app)
      .post(`/api/reviews/${productId}`)
      .set('Authorization', `Bearer ${consumerToken}`)
      .send({ rating: 5 });

    expect(reviewRes.status).toBe(403);
    expect(reviewRes.body.success).toBe(false);
  });

  it('rejects a review with rating 0 (below minimum)', async () => {
    const { consumerToken, productId, orderId } = await setupOrderedProduct();
    await Order.updateOne(
      { _id: orderId },
      { $set: { 'items.$[].status': 'delivered' } }
    );

    const reviewRes = await request(app)
      .post(`/api/reviews/${productId}`)
      .set('Authorization', `Bearer ${consumerToken}`)
      .send({ rating: 0 });

    // Should not succeed — rating 0 is invalid (min is 1)
    expect(reviewRes.status).not.toBe(201);
  });

  it('rejects a review with rating 6 (above maximum)', async () => {
    const { consumerToken, productId, orderId } = await setupOrderedProduct();
    await Order.updateOne(
      { _id: orderId },
      { $set: { 'items.$[].status': 'delivered' } }
    );

    const reviewRes = await request(app)
      .post(`/api/reviews/${productId}`)
      .set('Authorization', `Bearer ${consumerToken}`)
      .send({ rating: 6 });

    // Should not succeed — rating 6 is invalid (max is 5)
    expect(reviewRes.status).not.toBe(201);
  });

  it('correctly computes averageRating across multiple consumers', async () => {
    // Set up first consumer with a delivered order
    const { consumerToken: consumer1Token, productId, orderId: orderId1 } =
      await setupOrderedProduct();
    await Order.updateOne(
      { _id: orderId1 },
      { $set: { 'items.$[].status': 'delivered' } }
    );

    // Register a second consumer, add to cart, checkout, deliver
    const consumer2Res = await registerUser({
      name: 'Consumer Two',
      email: 'consumer2@example.com',
      password: 'password123',
      role: 'consumer',
    });
    const consumer2Token = consumer2Res.body.token;

    await request(app)
      .post('/api/cart')
      .set('Authorization', `Bearer ${consumer2Token}`)
      .send({ productId, quantity: 1 });

    const checkout2Res = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${consumer2Token}`)
      .send({
        deliveryAddress: {
          street: '2 Side St',
          city: 'Mysuru',
          state: 'Karnataka',
          pincode: '570001',
        },
      });
    const orderId2 = checkout2Res.body.data._id;
    await Order.updateOne(
      { _id: orderId2 },
      { $set: { 'items.$[].status': 'delivered' } }
    );

    // Consumer 1 submits rating 4, consumer 2 submits rating 2
    await request(app)
      .post(`/api/reviews/${productId}`)
      .set('Authorization', `Bearer ${consumer1Token}`)
      .send({ rating: 4 });

    await request(app)
      .post(`/api/reviews/${productId}`)
      .set('Authorization', `Bearer ${consumer2Token}`)
      .send({ rating: 2 });

    // averageRating = (4 + 2) / 2 = 3.0
    const productRes = await request(app).get(`/api/products/${productId}`);
    expect(productRes.status).toBe(200);
    expect(productRes.body.data.averageRating).toBe(3);
    expect(productRes.body.data.reviewCount).toBe(2);
  });
});
