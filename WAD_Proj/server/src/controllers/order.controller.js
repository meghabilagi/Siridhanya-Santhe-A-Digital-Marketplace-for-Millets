const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const paymentService = require('../services/payment.service');
const { sendFarmerOrderNotification } = require('../services/email.service');

/**
 * Generate a unique human-readable order ID.
 */
const generateOrderId = () =>
  `SS-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

/**
 * POST /api/orders/checkout
 * Consumer/Buyer: create an order from the current cart.
 */
const checkout = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { deliveryAddress } = req.body;

    // 1. Fetch cart
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // 2. Stock check
    for (const item of cart.items) {
      const product = item.product;
      if (!product || product.isDeleted) {
        return res.status(400).json({
          success: false,
          message: `Product is no longer available`,
        });
      }
      if (item.quantity > product.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Available: ${product.quantity}, requested: ${item.quantity}`,
        });
      }
    }

    // 3. Simulate payment
    const payment = paymentService.simulate();
    if (payment.status === 'failed') {
      return res.status(402).json({ success: false, message: 'Payment failed' });
    }

    // 4. Build order items with price + traceability snapshots
    const orderItems = cart.items.map((item) => {
      const product = item.product;
      return {
        product: product._id,
        productName: product.name,
        farmerName: product.farmerName,
        farmerVillage: product.farmerVillage,
        farmerState: product.farmerState,
        farmerPhone: product.farmerPhone,
        unitPrice: product.price,
        quantity: item.quantity,
        lineTotal: product.price * item.quantity,
        status: 'pending',
        statusUpdatedAt: new Date(),
      };
    });

    const totalAmount = orderItems.reduce((sum, i) => sum + i.lineTotal, 0);

    // 5. Atomic stock decrement — abort if any product runs out between check and update
    for (const item of cart.items) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.product._id, quantity: { $gte: item.quantity } },
        { $inc: { quantity: -item.quantity } }
      );
      if (!updated) {
        return res.status(400).json({
          success: false,
          message: `Stock became insufficient for "${item.product.name}" during checkout`,
        });
      }
    }

    // 6. Create order
    const order = await Order.create({
      orderId: generateOrderId(),
      buyer: userId,
      items: orderItems,
      deliveryAddress,
      totalAmount,
      paymentStatus: payment.status,
      transactionId: payment.transactionId,
    });

    // 7. Clear cart
    cart.items = [];
    cart.updatedAt = new Date();
    await cart.save();

    // 8. Send email notifications to each farmer whose products were ordered
    try {
      // Group order items by farmer
      const farmerItemsMap = {};
      for (const item of orderItems) {
        const product = cart.items.find ? null : null; // already have product data in orderItems
        // Find the original product to get farmer info
        const prod = await Product.findById(item.product).populate('farmer', 'name email').lean();
        if (prod && prod.farmer && prod.farmer.email) {
          const farmerId = prod.farmer._id.toString();
          if (!farmerItemsMap[farmerId]) {
            farmerItemsMap[farmerId] = {
              farmerEmail: prod.farmer.email,
              farmerName: prod.farmer.name,
              items: [],
            };
          }
          farmerItemsMap[farmerId].items.push(item);
        }
      }

      // Fetch buyer name
      const buyer = await User.findById(userId, 'name').lean();
      const buyerName = buyer?.name ?? 'A customer';

      // Send one email per farmer
      for (const farmerData of Object.values(farmerItemsMap)) {
        sendFarmerOrderNotification({
          farmerEmail: farmerData.farmerEmail,
          farmerName: farmerData.farmerName,
          orderId: order.orderId,
          items: farmerData.items,
          deliveryAddress,
          buyerName,
        }); // fire-and-forget — don't await
      }
    } catch (emailErr) {
      console.error('[Email] Error preparing notifications:', emailErr.message);
    }

    return res.status(201).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/orders
 * Consumer/Buyer: paginated order history, newest first.
 */
const getOrders = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ buyer: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments({ buyer: userId }),
    ]);

    return res.json({
      success: true,
      data: { orders, total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/orders/:id
 * Consumer/Buyer: get a single order (ownership enforced).
 */
const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.buyer.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    return res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/orders/farmer/incoming
 * Farmer: orders that contain at least one of their products.
 */
const getFarmerIncoming = async (req, res, next) => {
  try {
    const farmerId = req.user.userId;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    // Get all product IDs owned by this farmer
    const farmerProducts = await Product.find({ farmer: farmerId }, '_id').lean();
    const productIds = farmerProducts.map((p) => p._id);

    const [orders, total] = await Promise.all([
      Order.find({ 'items.product': { $in: productIds } })
        .populate('buyer', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments({ 'items.product': { $in: productIds } }),
    ]);

    // Filter each order to only show items belonging to this farmer
    const productIdStrings = productIds.map(id => id.toString());
    const filteredOrders = orders.map(order => ({
      ...order,
      items: order.items.filter(item => productIdStrings.includes(item.product?.toString())),
    }));

    return res.json({
      success: true,
      data: { orders: filteredOrders, total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/orders/:orderId/items/:itemId/status
 * Farmer: update the status of a specific order item they own.
 */
const updateItemStatus = async (req, res, next) => {
  try {
    const { orderId, itemId } = req.params;
    const { status } = req.body;
    const farmerId = req.user.userId;

    const validStatuses = ['processing', 'shipped', 'delivered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const item = order.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Order item not found' });
    }

    // Verify the item's product belongs to the requesting farmer
    const product = await Product.findOne({ _id: item.product, farmer: farmerId }, '_id').lean();
    if (!product) {
      return res.status(403).json({
        success: false,
        message: 'You do not own this product',
      });
    }

    item.status = status;
    item.statusUpdatedAt = new Date();
    await order.save();

    return res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

module.exports = { checkout, getOrders, getOrder, getFarmerIncoming, updateItemStatus };
