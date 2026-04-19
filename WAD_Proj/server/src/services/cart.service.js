const Product = require('../models/Product');

/**
 * Computes the cart total for a given array of cart items.
 *
 * Accepts items that may already have a populated `product` object,
 * or items where `product` is an ObjectId that needs to be fetched.
 *
 * @param {Array} items - Array of cart item objects
 * @returns {{ items: Array, grandTotal: number }}
 */
const cartTotal = async (items) => {
  if (!items || items.length === 0) {
    return { items: [], grandTotal: 0 };
  }

  // Collect IDs for items whose product is not yet populated
  const unpopulatedIds = [];
  for (const item of items) {
    const prod = item.product;
    // If product is a plain ObjectId (not a populated object), queue for fetch
    if (prod && typeof prod === 'object' && !prod.price && prod._id) {
      unpopulatedIds.push(prod._id.toString());
    } else if (prod && typeof prod !== 'object') {
      // It's a raw ObjectId string/value
      unpopulatedIds.push(prod.toString());
    }
  }

  // Fetch any unpopulated products in one query
  let productMap = {};
  if (unpopulatedIds.length > 0) {
    const products = await Product.find({ _id: { $in: unpopulatedIds } }).lean();
    for (const p of products) {
      productMap[p._id.toString()] = p;
    }
  }

  let grandTotal = 0;
  const processedItems = items.map((item) => {
    const rawProduct = item.product;

    // Resolve the product document
    let product;
    if (rawProduct && typeof rawProduct === 'object' && rawProduct.price !== undefined) {
      // Already populated
      product = rawProduct;
    } else {
      // Look up from fetched map
      const id = rawProduct && rawProduct._id
        ? rawProduct._id.toString()
        : rawProduct
        ? rawProduct.toString()
        : null;
      product = id ? productMap[id] : null;
    }

    // Flag unavailable: product not found, deleted, or out of stock
    if (!product || product.isDeleted || product.quantity === 0) {
      return { ...item, unavailable: true };
    }

    const lineTotal = item.quantity * product.price;
    grandTotal += lineTotal;

    return { ...item, lineTotal };
  });

  return { items: processedItems, grandTotal };
};

module.exports = { cartTotal };
