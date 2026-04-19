const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['farmer', 'buyer', 'consumer', 'admin'],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    // Farmer traceability fields (optional for non-farmers)
    village: { type: String },
    state: { type: String },
    phone: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
