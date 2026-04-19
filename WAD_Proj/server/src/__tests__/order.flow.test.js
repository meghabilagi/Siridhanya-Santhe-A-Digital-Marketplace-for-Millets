/**
 * Order flow integration test — covers the full consumer purchase journey.
 *
 * Flow:
 *   1. Register a farmer user
 *   2. Register a consumer user
 *   3. Farmer creates a product (starts as 'pending')
 *   4. Manually set product verificationStatus to 'verified' via Mongoose model
 *   5. Consumer adds product to cart
 *   6. Consumer checks out (POST /api/orders/checkout)
 *   7. Verify stock was decremented (GET /api/products/:id)
 *   8. Verify cart is cleared (GET /api/cart)
 *   9. Verify order record exists (GET /api/orders/:id)
 *
 * Requirements: 5.1, 6.1–6.5
 */

process.env.JWT_SECRET = 'test-secret-for-jest';
process.env.NODE_ENV = 'test';

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request = require('supertest');

const app = require('../app');
const Product = require('../models/Product');

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
  // Clean all collections between tests
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

// ── Order flow ───────────────────────────────────────────────────────────────
describe('Order flow integration', () => {
  it('completes the full purchase journey and verifies all side-effects', async () => {
    // 1. Register farmer
    const farmerRes = await registerUser({
      name: 'Test Farmer',
      email: 'farmer@example.com',
      password: 'password123',
      role: 'farmer',
    });
    expect(farmerRes.status).toBe(201);
    const farmerToken = farmerRes.body.token;

    // 2. Register consumer
    const consumerRes = await registerUser({
      name: 'Test Consumer',
      email: 'consumer@example.com',
      password: 'password123',
      role: 'consumer',
    });
    expect(consumerRes.status).toBe(201);
    const consumerToken = consumerRes.body.token;

    // 3. Farmer creates a product
    const createProductRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({
        name: 'Foxtail Millet',
        description: 'Premium quality foxtail millet',
        price: 80,
        quantity: 50,
        milletType: 'Foxtail',
        qualityGrade: 'A',
      });
    expect(createProductRes.status).toBe(201);
    const product = createProductRes.body.data;
    expect(product.verificationStatus).toBe('pending');

    // 4. Manually verify the product using the Mongoose model directly
    await Product.findByIdAndUpdate(product._id, { verificationStatus: 'verified' });

    // 5. Consumer adds product to cart
    const addToCartRes = await request(app)
      .post('/api/cart')
      .set('Authorization', `Bearer ${consumerToken}`)
      .send({ productId: product._id, quantity: 3 });
    expect(addToCartRes.status).toBe(200);
    expect(addToCartRes.body.success).toBe(true);

    // 6. Consumer checks out
    const checkoutRes = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${consumerToken}`)
      .send({
        deliveryAddress: {
          street: '123 Main St',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
        },
      });
    expect(checkoutRes.status).toBe(201);
    expect(checkoutRes.body.success).toBe(true);
    const order = checkoutRes.body.data;
    expect(order.paymentStatus).toBe('success');
    expect(order.items).toHaveLength(1);
    expect(order.items[0].quantity).toBe(3);
    expect(order.items[0].unitPrice).toBe(80);
    expect(order.items[0].lineTotal).toBe(240);
    expect(order.totalAmount).toBe(240);

    // 7. Verify stock was decremented (50 - 3 = 47)
    const productRes = await request(app).get(`/api/products/${product._id}`);
    expect(productRes.status).toBe(200);
    expect(productRes.body.data.quantity).toBe(47);

    // 8. Verify cart is cleared
    const cartRes = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${consumerToken}`);
    expect(cartRes.status).toBe(200);
    expect(cartRes.body.data.items).toHaveLength(0);

    // 9. Verify order record exists and is retrievable
    const orderId = order._id;
    const orderRes = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${consumerToken}`);
    expect(orderRes.status).toBe(200);
    expect(orderRes.body.success).toBe(true);
    expect(orderRes.body.data._id).toBe(orderId);
    expect(orderRes.body.data.deliveryAddress.city).toBe('Bengaluru');
  });

  it('returns 400 when cart is empty at checkout', async () => {
    const consumerRes = await registerUser({
      name: 'Empty Cart Consumer',
      email: 'empty@example.com',
      password: 'password123',
      role: 'consumer',
    });
    const consumerToken = consumerRes.body.token;

    const res = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${consumerToken}`)
      .send({
        deliveryAddress: {
          street: '1 Road',
          city: 'City',
          state: 'State',
          pincode: '000000',
        },
      });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when ordered quantity exceeds available stock', async () => {
    // Register farmer and consumer
    const farmerRes = await registerUser({
      name: 'Stock Farmer',
      email: 'stockfarmer@example.com',
      password: 'password123',
      role: 'farmer',
    });
    const farmerToken = farmerRes.body.token;

    const consumerRes = await registerUser({
      name: 'Stock Consumer',
      email: 'stockconsumer@example.com',
      password: 'password123',
      role: 'consumer',
    });
    const consumerToken = consumerRes.body.token;

    // Create product with only 2 units
    const createRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({
        name: 'Pearl Millet',
        price: 60,
        quantity: 2,
        qualityGrade: 'B',
      });
    const prod = createRes.body.data;
    await Product.findByIdAndUpdate(prod._id, { verificationStatus: 'verified' });

    // Add 2 to cart (valid)
    await request(app)
      .post('/api/cart')
      .set('Authorization', `Bearer ${consumerToken}`)
      .send({ productId: prod._id, quantity: 2 });

    // Reduce stock to 1 directly (simulating concurrent purchase)
    await Product.findByIdAndUpdate(prod._id, { quantity: 1 });

    // Checkout should fail — stock is now insufficient
    const checkoutRes = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${consumerToken}`)
      .send({
        deliveryAddress: {
          street: '5 Lane',
          city: 'Town',
          state: 'State',
          pincode: '111111',
        },
      });
    expect(checkoutRes.status).toBe(400);
    expect(checkoutRes.body.success).toBe(false);
  });
});
