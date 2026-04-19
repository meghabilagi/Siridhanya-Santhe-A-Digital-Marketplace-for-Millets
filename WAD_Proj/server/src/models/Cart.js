const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, min: 1 },
    priceAtAdd: { type: Number }, // price snapshot when added
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // one cart per user
  },
  items: [cartItemSchema],
  updatedAt: { type: Date },
});

module.exports = mongoose.model('Cart', cartSchema);
