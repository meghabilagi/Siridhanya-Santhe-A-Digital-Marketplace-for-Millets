const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    // Snapshots for traceability
    productName: { type: String },
    farmerName: { type: String },
    farmerVillage: { type: String },
    farmerState: { type: String },
    farmerPhone: { type: String },
    unitPrice: { type: Number },
    quantity: { type: Number },
    lineTotal: { type: Number },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered'],
      default: 'pending',
    },
    statusUpdatedAt: { type: Date },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, unique: true, required: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],
    deliveryAddress: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
    },
    totalAmount: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ['success', 'failed'],
      required: true,
    },
    transactionId: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
