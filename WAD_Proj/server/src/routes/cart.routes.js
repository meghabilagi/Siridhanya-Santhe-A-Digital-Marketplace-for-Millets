const { Router } = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const validate = require('../middleware/validate');
const { getCart, addItem, updateItem, clearCart } = require('../controllers/cart.controller');

const router = Router();

const addItemValidators = [
  body('productId').isString().notEmpty().withMessage('productId must be a non-empty string'),
  body('quantity').isInt({ min: 1 }).withMessage('quantity must be an integer >= 1'),
];

const updateItemValidators = [
  body('quantity').isInt({ min: 0 }).withMessage('quantity must be an integer >= 0'),
];

router.get('/', auth, roleGuard('consumer', 'buyer'), getCart);
router.post('/', auth, roleGuard('consumer', 'buyer'), addItemValidators, validate, addItem);
router.put('/:productId', auth, roleGuard('consumer', 'buyer'), updateItemValidators, validate, updateItem);
router.delete('/', auth, roleGuard('consumer', 'buyer'), clearCart);

module.exports = router;
