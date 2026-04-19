const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

/**
 * POST /api/reviews/:productId
 * Submit a review for a product (requires a delivered order).
 */
const submitReview = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const userId = req.user.userId;
    const { rating, comment } = req.body;

    // 1. Check that a delivered order exists for (userId, productId)
    const deliveredOrder = await Order.findOne({
      buyer: userId,
      items: {
        $elemMatch: {
          product: productId,
          status: 'delivered',
        },
      },
    });

    if (!deliveredOrder) {
      return res.status(403).json({
        success: false,
        message: 'You can only review products from a delivered order',
      });
    }

    // 2. Check for duplicate review
    const existing = await Review.findOne({ product: productId, reviewer: userId });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You have already reviewed this product',
      });
    }

    // 3. Fetch reviewer name from User model (not in JWT payload)
    const user = await User.findById(userId).select('name');
    const reviewerName = user ? user.name : 'Unknown';

    // 4. Save the review
    const review = await Review.create({
      product: productId,
      reviewer: userId,
      reviewerName,
      rating,
      comment,
    });

    // 5. Update Product averageRating and reviewCount using incremental formula
    const product = await Product.findById(productId);
    if (product) {
      const newAvg =
        (product.averageRating * product.reviewCount + rating) /
        (product.reviewCount + 1);
      await Product.findByIdAndUpdate(productId, {
        averageRating: Math.round(newAvg * 10) / 10,
        $inc: { reviewCount: 1 },
      });
    }

    return res.status(201).json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/reviews/:productId
 * Paginated list of reviews for a product (public).
 */
const getReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find({ product: productId })
        .select('reviewerName rating comment createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments({ product: productId }),
    ]);

    return res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { submitReview, getReviews };
