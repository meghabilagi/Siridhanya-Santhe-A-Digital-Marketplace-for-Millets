const { Router } = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/product.controller');

const router = Router();

const createValidators = [
  body('name').notEmpty().withMessage('Name is required'),
  body('price').isNumeric().isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
  body('quantity').isNumeric().isFloat({ min: 0 }).withMessage('Quantity must be a non-negative number'),
  body('qualityGrade').isIn(['A', 'B', 'C', 'Organic']).withMessage('qualityGrade must be one of: A, B, C, Organic'),
];

const updateValidators = [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('price').optional().isNumeric().isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
  body('quantity').optional().isNumeric().isFloat({ min: 0 }).withMessage('Quantity must be a non-negative number'),
  body('qualityGrade').optional().isIn(['A', 'B', 'C', 'Organic']).withMessage('qualityGrade must be one of: A, B, C, Organic'),
];

// Public routes
router.get('/', listProducts);

// Farmer — get own products (MUST be before /:id to avoid route conflict)
router.get('/farmer/mine', auth, roleGuard('farmer'), async (req, res, next) => {
  try {
    const Product = require('../models/Product');
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      Product.find({ farmer: req.user.userId, isDeleted: false }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Product.countDocuments({ farmer: req.user.userId, isDeleted: false }),
    ]);
    res.json({ success: true, data: { products, total } });
  } catch (err) { next(err); }
});

router.get('/:id', getProduct);

// Farmer-only routes
router.post('/', auth, roleGuard('farmer'), upload.single('image'), createValidators, validate, createProduct);
router.put('/:id', auth, roleGuard('farmer'), upload.single('image'), updateValidators, validate, updateProduct);
router.delete('/:id', auth, roleGuard('farmer'), deleteProduct);

module.exports = router;
