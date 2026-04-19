const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

// GET /api/admin/users — paginated list of all users
const listUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find({}, 'id name email role status').skip(skip).limit(limit).lean(),
      User.countDocuments(),
    ]);

    res.json({
      success: true,
      data: { users, total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/users/:id/status — activate or deactivate a user
const setUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'status must be "active" or "inactive"' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, select: 'id name email role status' }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/products/pending — paginated list of pending products
const listPendingProducts = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const query = { verificationStatus: 'pending', isDeleted: false };
    const [products, total] = await Promise.all([
      Product.find(query).skip(skip).limit(limit).lean(),
      Product.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: { products, total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/products/:id/verify — approve or reject a product
const verifyProduct = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'status must be "verified" or "rejected"' });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { verificationStatus: status },
      { new: true }
    );
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/orders — paginated list of all orders
const listOrders = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({}, 'orderId buyer totalAmount paymentStatus createdAt')
        .populate('buyer', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(),
    ]);

    res.json({
      success: true,
      data: { orders, total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/orders/:id — full order detail (no ownership check)
const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('buyer', 'name email').lean();
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/orders/summary — aggregate stats
const orderSummary = async (req, res, next) => {
  try {
    const [countResult, revenueResult, statusResult] = await Promise.all([
      Order.countDocuments(),
      Order.aggregate([{ $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }]),
      Order.aggregate([
        { $unwind: '$items' },
        { $group: { _id: '$items.status', count: { $sum: 1 } } },
      ]),
    ]);

    const totalOrders = countResult;
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    const countByStatus = { pending: 0, processing: 0, shipped: 0, delivered: 0 };
    for (const { _id, count } of statusResult) {
      if (_id in countByStatus) countByStatus[_id] = count;
    }

    res.json({ success: true, data: { totalOrders, totalRevenue, countByStatus } });
  } catch (err) {
    next(err);
  }
};

module.exports = { listUsers, setUserStatus, listPendingProducts, verifyProduct, listOrders, getOrder, orderSummary };
