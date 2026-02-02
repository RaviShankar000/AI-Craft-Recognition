const SellerApplication = require('../models/SellerApplication');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

/**
 * Apply to become a seller
 * @route POST /api/seller/apply
 * @access Private
 */
const applyForSeller = async (req, res) => {
  try {
    const {
      businessName,
      businessDescription,
      contactPhone,
      businessAddress,
      taxId,
      websiteUrl,
    } = req.body;

    // Check if user already has a seller application
    const existingApplication = await SellerApplication.findOne({ user: req.user.id });

    if (existingApplication) {
      if (existingApplication.status === 'pending') {
        return res.status(400).json({
          success: false,
          error: 'You already have a pending seller application',
        });
      }
      if (existingApplication.status === 'approved') {
        return res.status(400).json({
          success: false,
          error: 'You are already a seller',
        });
      }
      // If rejected, allow reapplication
    }

    // Check if user is already a seller
    const user = await User.findById(req.user.id);
    if (user.role === 'seller' || user.role === 'admin') {
      return res.status(400).json({
        success: false,
        error: 'You already have seller privileges',
      });
    }

    // Validate required fields
    if (!businessName || !businessDescription || !contactPhone || !businessAddress) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required business information',
      });
    }

    // Validate address
    const { street, city, state, zipCode, country } = businessAddress;
    if (!street || !city || !state || !zipCode) {
      return res.status(400).json({
        success: false,
        error: 'Please provide complete business address',
      });
    }

    // Create or update application
    let application;
    if (existingApplication && existingApplication.status === 'rejected') {
      // Update rejected application
      existingApplication.businessName = businessName;
      existingApplication.businessDescription = businessDescription;
      existingApplication.contactPhone = contactPhone;
      existingApplication.businessAddress = { street, city, state, zipCode, country };
      existingApplication.taxId = taxId;
      existingApplication.websiteUrl = websiteUrl;
      existingApplication.status = 'pending';
      existingApplication.reviewNote = '';
      existingApplication.reviewedBy = undefined;
      existingApplication.reviewedAt = undefined;
      
      application = await existingApplication.save();
    } else {
      // Create new application
      application = await SellerApplication.create({
        user: req.user.id,
        businessName,
        businessDescription,
        contactPhone,
        businessAddress: { street, city, state, zipCode, country },
        taxId,
        websiteUrl,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Seller application submitted successfully. You will be notified once reviewed.',
      data: application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get current user's seller application status
 * @route GET /api/seller/application/status
 * @access Private
 */
const getApplicationStatus = async (req, res) => {
  try {
    const application = await SellerApplication.findOne({ user: req.user.id })
      .populate('reviewedBy', 'name email');

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'No seller application found',
      });
    }

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Cancel pending application
 * @route DELETE /api/seller/application
 * @access Private
 */
const cancelApplication = async (req, res) => {
  try {
    const application = await SellerApplication.findOne({
      user: req.user.id,
      status: 'pending',
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'No pending application found',
      });
    }

    await SellerApplication.deleteOne({ _id: application._id });

    res.status(200).json({
      success: true,
      message: 'Application cancelled successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * ============================================================================
 * ADMIN FUNCTIONS - Seller Application Management
 * ============================================================================
 */

/**
 * Get application statistics
 * @route GET /api/admin/seller-applications/stats
 * @access Private/Admin
 */
const getApplicationStats = async (req, res) => {
  try {
    const [pending, approved, rejected, total] = await Promise.all([
      SellerApplication.countDocuments({ status: 'pending' }),
      SellerApplication.countDocuments({ status: 'approved' }),
      SellerApplication.countDocuments({ status: 'rejected' }),
      SellerApplication.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        pending,
        approved,
        rejected,
        total,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get all pending seller applications
 * @route GET /api/admin/seller-applications/pending
 * @access Private/Admin
 */
const getPendingApplications = async (req, res) => {
  try {
    const applications = await SellerApplication.findPending();

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Approve seller application
 * @route PATCH /api/admin/seller-applications/:id/approve
 * @access Private/Admin
 */
const approveApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const application = await SellerApplication.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Seller application not found',
      });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `Application is already ${application.status}`,
      });
    }

    // Approve the application (this also updates user role to 'seller')
    await application.approve(req.user.id, note);

    res.status(200).json({
      success: true,
      message: 'Seller application approved successfully. User role updated to seller.',
      data: application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Reject seller application
 * @route PATCH /api/admin/seller-applications/:id/reject
 * @access Private/Admin
 */
const rejectApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!note) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a reason for rejection',
      });
    }

    const application = await SellerApplication.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Seller application not found',
      });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `Application is already ${application.status}`,
      });
    }

    // Reject the application
    await application.reject(req.user.id, note);

    res.status(200).json({
      success: true,
      message: 'Seller application rejected',
      data: application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * ============================================================================
 * SELLER DASHBOARD - Product and Sales Management
 * ============================================================================
 */

/**
 * Get seller dashboard overview
 * @route GET /api/seller/dashboard
 * @access Private/Seller
 */
const getSellerDashboard = async (req, res) => {
  try {
    // Get total products count
    const totalProducts = await Product.countDocuments({ user: req.user._id });

    // Get products by moderation status
    const [pendingProducts, approvedProducts, rejectedProducts] = await Promise.all([
      Product.countDocuments({ user: req.user._id, moderationStatus: 'pending' }),
      Product.countDocuments({ user: req.user._id, moderationStatus: 'approved' }),
      Product.countDocuments({ user: req.user._id, moderationStatus: 'rejected' }),
    ]);

    // Get total orders for seller's products
    const sellerProducts = await Product.find({ user: req.user._id }).select('_id');
    const productIds = sellerProducts.map(p => p._id);

    const orders = await Order.find({
      'items.product': { $in: productIds },
    }).populate('items.product', 'name price user');

    // Filter to only include items for this seller's products
    let totalOrders = 0;
    let totalRevenue = 0;
    let pendingOrders = 0;
    let completedOrders = 0;

    orders.forEach(order => {
      const sellerItems = order.items.filter(
        item => item.product && item.product.user.toString() === req.user._id.toString()
      );

      if (sellerItems.length > 0) {
        totalOrders++;
        if (order.status === 'pending' || order.status === 'processing') {
          pendingOrders++;
        } else if (order.status === 'delivered') {
          completedOrders++;
        }

        // Calculate revenue from seller's items in this order
        sellerItems.forEach(item => {
          totalRevenue += item.price * item.quantity;
        });
      }
    });

    // Get low stock products (stock < 10)
    const lowStockProducts = await Product.countDocuments({
      user: req.user._id,
      stock: { $lt: 10, $gt: 0 },
    });

    // Get out of stock products
    const outOfStockProducts = await Product.countDocuments({
      user: req.user._id,
      stock: 0,
    });

    res.status(200).json({
      success: true,
      data: {
        products: {
          total: totalProducts,
          pending: pendingProducts,
          approved: approvedProducts,
          rejected: rejectedProducts,
          lowStock: lowStockProducts,
          outOfStock: outOfStockProducts,
        },
        sales: {
          totalOrders,
          pendingOrders,
          completedOrders,
          totalRevenue: totalRevenue.toFixed(2),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get seller's products
 * @route GET /api/seller/products
 * @access Private/Seller
 */
const getSellerProducts = async (req, res) => {
  try {
    const {
      status,
      page = 1,
      limit = 10,
      sort = '-createdAt',
      search,
      inStock,
    } = req.query;

    // Build query
    const query = { user: req.user._id };

    // Filter by moderation status
    if (status) {
      query.moderationStatus = status;
    }

    // Filter by stock availability
    if (inStock === 'true') {
      query.stock = { $gt: 0 };
    } else if (inStock === 'false') {
      query.stock = 0;
    }

    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(query)
      .populate('craft', 'name state category')
      .populate('moderatedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

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
 * Get seller's sales summary
 * @route GET /api/seller/sales
 * @access Private/Seller
 */
const getSellerSales = async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 10 } = req.query;

    // Get seller's products
    const sellerProducts = await Product.find({ user: req.user._id }).select('_id name price');
    const productIds = sellerProducts.map(p => p._id);

    if (productIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          orders: [],
          summary: {
            totalOrders: 0,
            totalRevenue: 0,
            totalItems: 0,
          },
        },
      });
    }

    // Build query for orders containing seller's products
    const query = {
      'items.product': { $in: productIds },
    };

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('items.product', 'name price user')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    // Process orders to only show seller's items and calculate totals
    const processedOrders = [];
    let totalRevenue = 0;
    let totalItems = 0;

    orders.forEach(order => {
      const sellerItems = order.items.filter(
        item => item.product && item.product.user.toString() === req.user._id.toString()
      );

      if (sellerItems.length > 0) {
        let orderRevenue = 0;
        sellerItems.forEach(item => {
          const itemTotal = item.price * item.quantity;
          orderRevenue += itemTotal;
          totalItems += item.quantity;
        });

        totalRevenue += orderRevenue;

        processedOrders.push({
          orderId: order._id,
          orderNumber: order.orderNumber,
          customer: order.user,
          items: sellerItems,
          orderRevenue: orderRevenue.toFixed(2),
          status: order.status,
          paymentStatus: order.paymentStatus,
          createdAt: order.createdAt,
        });
      }
    });

    const total = processedOrders.length;

    res.status(200).json({
      success: true,
      count: processedOrders.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: {
        orders: processedOrders,
        summary: {
          totalOrders: total,
          totalRevenue: totalRevenue.toFixed(2),
          totalItems,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  applyForSeller,
  getApplicationStatus,
  cancelApplication,
  getApplicationStats,
  getPendingApplications,
  approveApplication,
  rejectApplication,
  getSellerDashboard,
  getSellerProducts,
  getSellerSales,
};
