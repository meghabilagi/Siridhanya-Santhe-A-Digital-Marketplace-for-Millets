const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (user) =>
  jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

/**
 * POST /api/auth/register
 * Body: { name, email, password, role, village?, state?, phone? }
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, village, state, phone } = req.body;

    // Check for duplicate email
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already in use', errors: [] });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashed,
      role,
      ...(village && { village }),
      ...(state && { state }),
      ...(phone && { phone }),
    });

    const token = signToken(user);

    return res.status(201).json({ success: true, token });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials', errors: [] });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Account is inactive', errors: [] });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials', errors: [] });
    }

    const token = signToken(user);

    return res.status(200).json({ success: true, token });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login };
