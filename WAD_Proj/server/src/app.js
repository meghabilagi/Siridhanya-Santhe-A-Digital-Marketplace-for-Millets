const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Route stubs — will be replaced as each route module is implemented
const stubRouter = (name) => {
  const router = express.Router();
  router.all('/{*path}', (_req, res) =>
    res.status(501).json({ success: false, message: `${name} routes not yet implemented` })
  );
  return router;
};

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/cart', require('./routes/cart.routes'));
app.use('/api/orders', require('./routes/order.routes'));
app.use('/api/reviews', require('./routes/review.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

// Payment config — UPI ID served from env, never hardcoded in frontend
app.get('/api/payment/config', (req, res) => {
  const upiId = process.env.UPI_ID || '';
  const upiName = process.env.UPI_NAME || 'Siridhanya Santhe';
  // Mask the UPI ID: show only first 3 chars and domain e.g. "meg***@upi"
  const parts = upiId.split('@');
  const masked = parts[0]
    ? parts[0].slice(0, 3) + '***@' + (parts[1] ?? 'upi')
    : '***@upi';
  res.json({ success: true, data: { upiId, upiName, maskedUpiId: masked } });
});

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
    errors: err.errors || [],
  });
});

module.exports = app;
