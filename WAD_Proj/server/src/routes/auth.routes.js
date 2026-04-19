const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { register, login } = require('../controllers/auth.controller');

const router = Router();

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role')
      .isIn(['farmer', 'buyer', 'consumer', 'admin'])
      .withMessage('Role must be one of: farmer, buyer, consumer, admin'),
  ],
  validate,
  register
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

module.exports = router;
