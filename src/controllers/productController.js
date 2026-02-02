const Product = require('../models/Product');
const Craft = require('../models/Craft');
const {
  logProductCreated,
  logProductUpdated,
  logProductDeleted,
  logProductModerated,
} = require('../utils/auditLogger');

/**
 * Get all products
 * @route GET /api/products
 * @access Public/Private (Role-based filtering)
 * @description
 * - Public access: Returns only approved products for marketplace viewing
 * - Seller/Admin access: Returns only their own products (all statuses)
 * - Regular user access: Returns approved products from all sellers
 */
const getAllProducts = async (req, res) => {
  try {
    const {
      craft,
      category,
      minPrice,
      maxPrice,
      inStock,
      search,
      page = 1,
      limit = 10,
      sort = '-createdAt',
    } = req.query;

    // Role-based query filtering
    const query = {};

    if (!req.user) {
      // Public access: only approved products
      query.moderationStatus = 'approved';
    } else if (req.user.role === 'seller' || req.user.role === 'admin') {
      // Sellers/Admins: only their own products (all statuses)
      query.user = req.user._id;
    } else {
      // Regular authenticated users: approved products from all sellers
      query.moderationStatus = 'approved';
    }

    // Filter by craft
    if (craft) {
      query.craft = craft;
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Filter by stock availability
    if (inStock === 'true') {
      query.stock = { $gt: 0 };
      query.isAvailable = true;
    }

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with population
    const products = await Product.find(query)
      .populate('craft', 'name state category')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    // Get total count
    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get single product by ID
 * @route GET /api/products/:id
 * @access Public/Private (Role-based access)
 * @description
 * - Public/Regular users: Only approved products
 * - Sellers: Their own products (any status) or approved products from others
 * - Admins: Any product
 */
const getProductById = async (req, res) => {
  try {
    const query = { _id: req.params.id };

    // Role-based filtering
    if (!req.user) {
      // Public: only approved products
      query.moderationStatus = 'approved';
    } else if (req.user.role === 'seller') {
      // Sellers: their own products OR approved products from others
      query.$or = [{ user: req.user._id }, { moderationStatus: 'approved' }];
    } else if (req.user.role === 'user') {
      // Regular users: only approved products
      query.moderationStatus = 'approved';
    }
    // Admins: no additional filter (can see everything)

    const product = await Product.findOne(query).populate(
      'craft',
      'name state category description'
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID',
      });
    }
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Create new product
 * @route POST /api/products
 * @access Private/Seller
 * @description Only sellers and admins can create products
 */
const createProduct = async (req, res) => {
  try {
    // Explicit role check - extra security layer
    if (req.user.role !== 'seller' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Only sellers and admins can create products.',
      });
    }

    const { name, price, stock, craft, image, description, category, sku, discount } = req.body;

    // Validate required fields
    if (!name || !price || stock === undefined || !craft || !image) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, price, stock, craft, and image',
      });
    }

    // Verify craft exists and belongs to user (admins can use any craft)
    const craftQuery = { _id: craft };
    if (req.user.role !== 'admin') {
      craftQuery.user = req.user._id;
    }

    const craftExists = await Craft.findOne(craftQuery);

    if (!craftExists) {
      return res.status(404).json({
        success: false,
        error:
          req.user.role === 'admin'
            ? 'Craft not found'
            : 'Craft not found or does not belong to you',
      });
    }

    // Create product - always use authenticated user as owner (no override allowed)
    const product = await Product.create({
      name,
      price,
      stock,
      craft,
      image,
      description,
      category,
      sku,
      discount,
      user: req.user._id, // Ownership is always the authenticated user
    });

    // Populate craft details
    await product.populate('craft', 'name state category');

    // Log product creation
    await logProductCreated(req.user, product, req);

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    // Handle duplicate SKU error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Product with this SKU already exists',
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', '),
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Update product
 * @route PUT /api/products/:id
 * @access Private/Seller
 * @description Only sellers and admins can update their own products
 */
const updateProduct = async (req, res) => {
  try {
    // Explicit role check - extra security layer
    if (req.user.role !== 'seller' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Only sellers and admins can update products.',
      });
    }

    const { name, price, stock, craft, image, description, category, sku, discount, isAvailable } =
      req.body;

    // Find product - admins can update any product, sellers only their own
    const query = { _id: req.params.id };
    if (req.user.role !== 'admin') {
      query.user = req.user._id;
    }

    const product = await Product.findOne(query);

    if (!product) {
      return res.status(404).json({
        success: false,
        error:
          req.user.role === 'admin'
            ? 'Product not found'
            : 'Product not found or you do not have permission to update it',
      });
    }

    // Ownership validation: Ensure sellers can only update their own products
    if (req.user.role === 'seller' && product.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to update this product',
      });
    }

    // If craft is being updated, verify it exists and belongs to user (admins can use any craft)
    if (craft && craft !== product.craft.toString()) {
      const craftQuery = { _id: craft };
      if (req.user.role !== 'admin') {
        craftQuery.user = req.user._id;
      }

      const craftExists = await Craft.findOne(craftQuery);

      if (!craftExists) {
        return res.status(404).json({
          success: false,
          error:
            req.user.role === 'admin'
              ? 'Craft not found'
              : 'Craft not found or does not belong to you',
        });
      }
    }

    // Update fields
    const changes = {};
    if (name !== undefined && name !== product.name) {
      changes.name = { old: product.name, new: name };
      product.name = name;
    }
    if (price !== undefined && price !== product.price) {
      changes.price = { old: product.price, new: price };
      product.price = price;
    }
    if (stock !== undefined && stock !== product.stock) {
      changes.stock = { old: product.stock, new: stock };
      product.stock = stock;
    }
    if (craft !== undefined) product.craft = craft;
    if (image !== undefined) product.image = image;
    if (description !== undefined) product.description = description;
    if (category !== undefined) product.category = category;
    if (sku !== undefined) product.sku = sku;
    if (discount !== undefined) product.discount = discount;
    if (isAvailable !== undefined) product.isAvailable = isAvailable;

    await product.save();

    // Populate craft details
    await product.populate('craft', 'name state category');

    // Log product update with changes
    await logProductUpdated(req.user, product, changes, req);

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    // Handle duplicate SKU error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Product with this SKU already exists',
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', '),
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID',
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Delete product
 * @route DELETE /api/products/:id
 * @access Private/Seller
 * @description Only sellers and admins can delete their own products
 */
const deleteProduct = async (req, res) => {
  try {
    // Explicit role check - extra security layer
    if (req.user.role !== 'seller' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Only sellers and admins can delete products.',
      });
    }

    // Find product - admins can delete any product, sellers only their own
    const query = { _id: req.params.id };
    if (req.user.role !== 'admin') {
      query.user = req.user._id;
    }

    const product = await Product.findOne(query);

    if (!product) {
      return res.status(404).json({
        success: false,
        error:
          req.user.role === 'admin'
            ? 'Product not found'
            : 'Product not found or you do not have permission to delete it',
      });
    }

    // Ownership validation: Ensure sellers can only delete their own products
    if (req.user.role === 'seller' && product.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to delete this product',
      });
    }

    await product.deleteOne();

    // Log product deletion
    await logProductDeleted(req.user, product, req);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      data: {},
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID',
      });
    }
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Update product stock
 * @route PATCH /api/products/:id/stock
 * @access Private/Seller
 */
const updateProductStock = async (req, res) => {
  try {
    // Explicit role check - extra security layer
    if (req.user.role !== 'seller' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Only sellers and admins can update product stock.',
      });
    }

    const { quantity, operation } = req.body;

    // Validate input
    if (!quantity || !operation) {
      return res.status(400).json({
        success: false,
        error: 'Please provide quantity and operation (add or reduce)',
      });
    }

    if (!['add', 'reduce'].includes(operation)) {
      return res.status(400).json({
        success: false,
        error: 'Operation must be either "add" or "reduce"',
      });
    }

    const parsedQuantity = parseInt(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Quantity must be a positive number',
      });
    }

    // Find product - admins can update any product stock, sellers only their own
    const query = { _id: req.params.id };
    if (req.user.role !== 'admin') {
      query.user = req.user._id;
    }

    const product = await Product.findOne(query);

    if (!product) {
      return res.status(404).json({
        success: false,
        error:
          req.user.role === 'admin'
            ? 'Product not found'
            : 'Product not found or you do not have permission to update it',
      });
    }

    // Ownership validation: Ensure sellers can only update their own product stock
    if (req.user.role === 'seller' && product.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to update this product stock',
      });
    }

    // Update stock based on operation
    if (operation === 'add') {
      await product.increaseStock(parsedQuantity);
    } else {
      await product.reduceStock(parsedQuantity);
    }

    res.status(200).json({
      success: true,
      message: `Stock ${operation === 'add' ? 'increased' : 'reduced'} successfully`,
      data: {
        stock: product.stock,
        isAvailable: product.isAvailable,
        stockStatus: product.stockStatus,
      },
    });
  } catch (error) {
    if (error.message === 'Insufficient stock') {
      return res.status(400).json({
        success: false,
        error: 'Insufficient stock for this operation',
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID',
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get products by craft
 * @route GET /api/products/craft/:craftId
 * @access Public
 * @description Returns only approved products for the specified craft
 */
const getProductsByCraft = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Verify craft exists
    const craft = await Craft.findById(req.params.craftId);

    if (!craft) {
      return res.status(404).json({
        success: false,
        error: 'Craft not found',
      });
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Find only approved products
    const products = await Product.find({
      craft: req.params.craftId,
      moderationStatus: 'approved',
    })
      .populate('craft', 'name state category')
      .populate('user', 'name')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    const total = await Product.countDocuments({
      craft: req.params.craftId,
      moderationStatus: 'approved',
    });

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: products,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid craft ID',
      });
    }
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStock,
  getProductsByCraft,
};

/**
 * ============================================================================
 * PRODUCT MODERATION ENDPOINTS (Admin Only)
 * ============================================================================
 */

/**
 * Get all products pending moderation
 * @route GET /api/products/moderation/pending
 * @access Private/Admin
 */
const getPendingProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const query = { moderationStatus: 'pending' };

    const products = await Product.find(query)
      .populate('user', 'name email')
      .populate('craft', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Approve a product
 * @route PATCH /api/products/:id/approve
 * @access Private/Admin
 */
const approveProduct = async (req, res) => {
  try {
    const { note } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    await product.updateModerationStatus('approved', req.user.id, note);

    // Log product moderation
    await logProductModerated(req.user, product, 'approved', note, req);

    // Emit socket event to notify seller/user
    try {
      const io = getIO();
      const productWithUser = await Product.findById(product._id).populate('user', '_id');
      
      if (productWithUser && productWithUser.user) {
        io.to(productWithUser.user._id.toString()).emit('moderation:product_approved', {
          productId: product._id,
          productName: product.name,
          status: 'approved',
          note: note || null,
          timestamp: new Date().toISOString(),
        });
        console.log(`[MODERATION] Emitted product_approved to user ${productWithUser.user._id}`);
      }
      
      // Notify all admins
      io.to('role:admin').emit('moderation:product_status_changed', {
        productId: product._id,
        productName: product.name,
        status: 'approved',
        moderator: req.user.name,
        timestamp: new Date().toISOString(),
      });
    } catch (socketError) {
      console.error('[SOCKET] Failed to emit product moderation event:', socketError.message);
    }

    res.status(200).json({
      success: true,
      message: 'Product approved successfully',
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Reject a product
 * @route PATCH /api/products/:id/reject
 * @access Private/Admin
 */
const rejectProduct = async (req, res) => {
  try {
    const { note } = req.body;

    if (!note) {
      return res.status(400).json({
        success: false,
        error: 'Rejection note is required',
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    await product.updateModerationStatus('rejected', req.user.id, note);

    // Log product moderation
    await logProductModerated(req.user, product, 'rejected', note, req);

    // Emit socket event to notify seller/user
    try {
      const io = getIO();
      const productWithUser = await Product.findById(product._id).populate('user', '_id');
      
      if (productWithUser && productWithUser.user) {
        io.to(productWithUser.user._id.toString()).emit('moderation:product_rejected', {
          productId: product._id,
          productName: product.name,
          status: 'rejected',
          note: note,
          timestamp: new Date().toISOString(),
        });
        console.log(`[MODERATION] Emitted product_rejected to user ${productWithUser.user._id}`);
      }
      
      // Notify all admins
      io.to('role:admin').emit('moderation:product_status_changed', {
        productId: product._id,
        productName: product.name,
        status: 'rejected',
        moderator: req.user.name,
        timestamp: new Date().toISOString(),
      });
    } catch (socketError) {
      console.error('[SOCKET] Failed to emit product moderation event:', socketError.message);
    }

    res.status(200).json({
      success: true,
      message: 'Product rejected successfully',
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get moderation statistics
 * @route GET /api/products/moderation/stats
 * @access Private/Admin
 */
const getModerationStats = async (req, res) => {
  try {
    const stats = await Product.aggregate([
      {
        $group: {
          _id: '$moderationStatus',
          count: { $sum: 1 },
        },
      },
    ]);

    const statsMap = {
      pending: 0,
      approved: 0,
      rejected: 0,
    };

    stats.forEach(stat => {
      statsMap[stat._id] = stat.count;
    });

    res.status(200).json({
      success: true,
      data: statsMap,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStock,
  getProductsByCraft,
  getPendingProducts,
  approveProduct,
  rejectProduct,
  getModerationStats,
};
