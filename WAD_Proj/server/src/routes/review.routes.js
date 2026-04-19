const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const { submitReview, getReviews } = require('../controllers/review.controller');

// POST /:productId — authenticated consumer or buyer only
router.post('/:productId', auth, roleGuard('consumer', 'buyer'), submitReview);

// GET /:productId — public
router.get('/:productId', getReviews);

module.exports = router;
