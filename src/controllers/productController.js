const Product = require('../models/Product');
const Craft = require('../models/Craft');

/**
 * Get all products
 * @route GET /api/products
 * @access Private
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

    // Build query
    const query = { user: req.user._id };

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
 * @access Private
 */
const getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate('craft', 'name state category description');

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
 * @access Private
 */
const createProduct = async (req, res) => {
  try {
    const { name, price, stock, craft, image, description, category, sku, discount } = req.body;

    // Validate required fields
    if (!name || !price || stock === undefined || !craft || !image) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, price, stock, craft, and image',
      });
    }

    // Verify craft exists and belongs to user
    const craftExists = await Craft.findOne({
      _id: craft,
      user: req.user._id,
    });

    if (!craftExists) {
      return res.status(404).json({
        success: false,
        error: 'Craft not found or does not belong to you',
      });
    }

    // Create product
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
      user: req.user._id,
    });

    // Populate craft details
    await product.populate('craft', 'name state category');

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
 * @access Private
 */
const updateProduct = async (req, res) => {
  try {
    const { name, price, stock, craft, image, description, category, sku, discount, isAvailable } =
      req.body;

    // Find product
    const product = await Product.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    // If craft is being updated, verify it exists and belongs to user
    if (craft && craft !== product.craft.toString()) {
      const craftExists = await Craft.findOne({
        _id: craft,
        user: req.user._id,
      });

      if (!craftExists) {
        return res.status(404).json({
          success: false,
          error: 'Craft not found or does not belong to you',
        });
      }
    }

    // Update fields
    if (name !== undefined) product.name = name;
    if (price !== undefined) product.price = price;
    if (stock !== undefined) product.stock = stock;
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
 * @access Private
 */
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    await product.deleteOne();

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
 * @access Private
 */
const updateProductStock = async (req, res) => {
  try {
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

    // Find product
    const product = await Product.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
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
 * @access Private
 */
const getProductsByCraft = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Verify craft exists and belongs to user
    const craft = await Craft.findOne({
      _id: req.params.craftId,
      user: req.user._id,
    });

    if (!craft) {
      return res.status(404).json({
        success: false,
        error: 'Craft not found',
      });
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Find products
    const products = await Product.find({
      craft: req.params.craftId,
      user: req.user._id,
    })
      .populate('craft', 'name state category')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    const total = await Product.countDocuments({
      craft: req.params.craftId,
      user: req.user._id,
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
