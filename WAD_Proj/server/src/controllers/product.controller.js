const Product = require('../models/Product');
const User = require('../models/User');

/**
 * GET /api/products
 * Public — list verified, non-deleted products with optional filters and pagination.
 */
const listProducts = async (req, res, next) => {
  try {
    const {
      keyword,
      milletType,
      qualityGrade,
      minPrice,
      maxPrice,
      location,
      page = 1,
      limit = 20,
    } = req.query;

    const query = { verificationStatus: 'verified', isDeleted: false };

    if (keyword) {
      const regex = new RegExp(keyword, 'i');
      query.$or = [{ name: regex }, { description: regex }];
    }

    if (milletType) query.milletType = milletType;
    if (qualityGrade) query.qualityGrade = qualityGrade;
    if (location) query.farmerState = new RegExp(location, 'i');

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query).skip(skip).limit(limitNum).lean(),
      Product.countDocuments(query),
    ]);

    return res.json({
      success: true,
      data: { products, total, page: pageNum, limit: limitNum },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/products/:id
 * Public — return full product doc including traceability and rating fields.
 */
const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).lean();

    if (!product || product.isDeleted) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    return res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/products
 * Farmer only — create a product with denormalised traceability from the farmer's profile.
 */
const createProduct = async (req, res, next) => {
  try {
    const farmer = await User.findById(req.user.userId).lean();
    if (!farmer) {
      return res.status(404).json({ success: false, message: 'Farmer not found' });
    }

    // Handle uploaded image — convert buffer to base64 data URL
    let image;
    if (req.file) {
      const mime = req.file.mimetype;
      const b64 = req.file.buffer.toString('base64');
      image = `data:${mime};base64,${b64}`;
    } else if (req.body.imageUrl) {
      image = req.body.imageUrl;
    }

    const product = await Product.create({
      ...req.body,
      image,
      farmer: req.user.userId,
      farmerName: farmer.name,
      farmerVillage: farmer.village,
      farmerState: farmer.state,
      farmerPhone: farmer.phone,
      verificationStatus: 'verified', // auto-approve so it shows immediately
    });

    return res.status(201).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/products/:id
 * Farmer only — update own product.
 */
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product || product.isDeleted) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.farmer.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Handle image update
    const updateData = { ...req.body };
    if (req.file) {
      const mime = req.file.mimetype;
      const b64 = req.file.buffer.toString('base64');
      updateData.image = `data:${mime};base64,${b64}`;
    } else if (req.body.imageUrl) {
      updateData.image = req.body.imageUrl;
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).lean();

    return res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/products/:id
 * Farmer only — soft-delete own product.
 */
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product || product.isDeleted) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.farmer.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    product.isDeleted = true;
    await product.save();

    return res.json({ success: true, data: { message: 'Product deleted' } });
  } catch (err) {
    next(err);
  }
};

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct };
