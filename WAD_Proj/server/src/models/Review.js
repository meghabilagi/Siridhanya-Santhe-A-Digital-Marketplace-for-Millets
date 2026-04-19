const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewerName: { type: String }, // snapshot
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: 'Rating must be an integer',
    },
  },
  comment: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// One review per user per product
reviewSchema.index({ product: 1, reviewer: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
