const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 0 },
    milletType: { type: String },
    qualityGrade: {
      type: String,
      enum: ['A', 'B', 'C', 'Organic'],
      required: true,
    },
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Traceability snapshots (denormalized from farmer at creation time)
    farmerName: { type: String },
    farmerVillage: { type: String },
    farmerState: { type: String },
    farmerPhone: { type: String },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    isDeleted: { type: Boolean, default: false },
    image: { type: String }, // URL of product image
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
