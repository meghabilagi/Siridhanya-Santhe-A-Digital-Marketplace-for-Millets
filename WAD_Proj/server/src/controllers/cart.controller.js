const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { cartTotal } = require('../services/cart.service');

/**
 * GET /api/cart
 * Consumer only — return the current user's cart with totals.
 */
const getCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user.userId }).populate('items.product').lean();

    if (!cart) {
      return res.json({ success: true, data: { items: [], grandTotal: 0 } });
    }

    const { items, grandTotal } = await cartTotal(cart.items);

    return res.json({ success: true, data: { items, grandTotal } });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/cart
 * Consumer only — add a product to the cart (or increment quantity if already present).
 * Body: { productId, quantity }
 */
const addItem = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;

    const product = await Product.findById(productId);
    if (!product || product.isDeleted) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Find or create cart
    let cart = await Cart.findOne({ user: req.user.userId });
    if (!cart) {
      cart = new Cart({ user: req.user.userId, items: [] });
    }

    const existingIndex = cart.items.findIndex(
      (i) => i.product.toString() === productId
    );

    if (existingIndex >= 0) {
      // Increment quantity
      const newQty = cart.items[existingIndex].quantity + quantity;
      if (newQty > product.quantity) {
        return res.status(400).json({
          success: false,
          message: `Quantity exceeds available stock (${product.quantity})`,
        });
      }
      cart.items[existingIndex].quantity = newQty;
    } else {
      // New item — validate stock
      if (quantity > product.quantity) {
        return res.status(400).json({
          success: false,
          message: `Quantity exceeds available stock (${product.quantity})`,
        });
      }
      cart.items.push({
        product: productId,
        quantity,
        priceAtAdd: product.price,
      });
    }

    cart.updatedAt = new Date();
    await cart.save();

    const populated = await Cart.findById(cart._id).populate('items.product').lean();
    const { items, grandTotal } = await cartTotal(populated.items);

    return res.json({ success: true, data: { items, grandTotal } });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/cart/:productId
 * Consumer only — update quantity of a cart item.
 * Body: { quantity }  — if 0, removes the item.
 */
const updateItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    const cart = await Cart.findOne({ user: req.user.userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(
      (i) => i.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    if (quantity === 0) {
      // Remove item
      cart.items.splice(itemIndex, 1);
    } else {
      // Validate against stock
      const product = await Product.findById(productId);
      if (!product || product.isDeleted) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      if (quantity > product.quantity) {
        return res.status(400).json({
          success: false,
          message: `Quantity exceeds available stock (${product.quantity})`,
        });
      }
      cart.items[itemIndex].quantity = quantity;
    }

    cart.updatedAt = new Date();
    await cart.save();

    const populated = await Cart.findById(cart._id).populate('items.product').lean();
    const { items, grandTotal } = await cartTotal(populated.items);

    return res.json({ success: true, data: { items, grandTotal } });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/cart
 * Consumer only — clear all items from the cart.
 */
const clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user.userId });
    if (!cart) {
      return res.json({ success: true, data: { message: 'Cart cleared' } });
    }

    cart.items = [];
    cart.updatedAt = new Date();
    await cart.save();

    return res.json({ success: true, data: { message: 'Cart cleared' } });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCart, addItem, updateItem, clearCart };
