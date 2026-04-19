const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const {
  listUsers,
  setUserStatus,
  listPendingProducts,
  verifyProduct,
  orderSummary,
  listOrders,
  getOrder,
} = require('../controllers/admin.controller');

const guard = [auth, roleGuard('admin')];

router.get('/users', ...guard, listUsers);
router.put('/users/:id/status', ...guard, setUserStatus);

router.get('/products/pending', ...guard, listPendingProducts);
router.put('/products/:id/verify', ...guard, verifyProduct);

// summary MUST be registered before /:id to avoid being swallowed as an id param
router.get('/orders/summary', ...guard, orderSummary);
router.get('/orders', ...guard, listOrders);
router.get('/orders/:id', ...guard, getOrder);

module.exports = router;
