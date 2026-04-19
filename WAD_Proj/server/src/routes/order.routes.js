const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const {
  checkout,
  getOrders,
  getOrder,
  getFarmerIncoming,
  updateItemStatus,
} = require('../controllers/order.controller');

// POST /api/orders/checkout — consumer/buyer places an order
router.post('/checkout', auth, roleGuard('consumer', 'buyer'), checkout);

// GET /api/orders — consumer/buyer order history
router.get('/', auth, roleGuard('consumer', 'buyer'), getOrders);

// GET /api/orders/farmer/incoming — MUST be before /:id to avoid route conflict
router.get('/farmer/incoming', auth, roleGuard('farmer'), getFarmerIncoming);

// GET /api/orders/:id — consumer/buyer single order detail
router.get('/:id', auth, roleGuard('consumer', 'buyer'), getOrder);

// PUT /api/orders/:orderId/items/:itemId/status — farmer updates item status
router.put('/:orderId/items/:itemId/status', auth, roleGuard('farmer'), updateItemStatus);

module.exports = router;
