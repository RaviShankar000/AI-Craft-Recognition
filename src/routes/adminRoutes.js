const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// Import admin-related controllers
const {
  getPendingProducts,
  approveProduct,
  rejectProduct,
  getModerationStats,
} = require('../controllers/productController');

const {
  getAllOrdersAdmin,
  updateOrderStatus,
  deleteOrder,
  getOrderStats,
} = require('../controllers/orderController');

const {
  createCraft,
  updateCraft,
  deleteCraft,
  getPopularCrafts,
} = require('../controllers/craftController');

/**
 * ============================================================================
 * ADMIN DASHBOARD ROUTES
 * ============================================================================
 * All routes under /api/admin/* require authentication and admin role.
 * These routes are grouped for centralized admin functionality.
 * 
 * MIDDLEWARE PROTECTION:
 * - protect: Verifies JWT token and authenticates user
 * - authorize('admin'): Ensures user has admin role
 * 
 * ROUTE STRUCTURE:
 * /api/admin/
 *   ├── dashboard         - Admin dashboard overview
 *   ├── products/         - Product moderation
 *   ├── orders/           - Order management
 *   ├── crafts/           - Craft management
 *   └── users/            - User management
 * ============================================================================
 */

// Apply admin authentication to all routes
router.use(protect);
router.use(authorize('admin'));

/**
 * ============================================================================
 * DASHBOARD OVERVIEW
 * ============================================================================
 */

/**
 * Get admin dashboard overview
 * @route GET /api/admin/dashboard
 * @access Private/Admin
 */
router.get('/dashboard', async (req, res) => {
  try {
    const User = require('../models/User');
    const Product = require('../models/Product');
    const Order = require('../models/Order');
    const Craft = require('../models/Craft');

    // Aggregate statistics
    const [userCount, productCount, orderCount, craftCount, pendingProducts] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Craft.countDocuments(),
      Product.countDocuments({ moderationStatus: 'pending' }),
    ]);

    // Get recent activity
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email')
      .select('orderNumber totalAmount status createdAt');

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role createdAt');

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers: userCount,
          totalProducts: productCount,
          totalOrders: orderCount,
          totalCrafts: craftCount,
          pendingProducts,
        },
        recentOrders,
        recentUsers,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * ============================================================================
 * PRODUCT MODERATION
 * ============================================================================
 */

// Get moderation statistics
router.get('/products/moderation/stats', getModerationStats);

// Get pending products
router.get('/products/moderation/pending', getPendingProducts);

// Approve product
router.patch('/products/:id/approve', approveProduct);

// Reject product
router.patch('/products/:id/reject', rejectProduct);

/**
 * ============================================================================
 * ORDER MANAGEMENT
 * ============================================================================
 */

// Get all orders (admin view)
router.get('/orders', getAllOrdersAdmin);

// Get order statistics
router.get('/orders/stats', getOrderStats);

// Update order status
router.patch('/orders/:id/status', updateOrderStatus);

// Delete order
router.delete('/orders/:id', deleteOrder);

/**
 * ============================================================================
 * CRAFT MANAGEMENT
 * ============================================================================
 */

// Get popular crafts analytics
router.get('/crafts/popular', getPopularCrafts);

// Create new craft
router.post('/crafts', createCraft);

// Update craft
router.put('/crafts/:id', updateCraft);

// Delete craft
router.delete('/crafts/:id', deleteCraft);

/**
 * ============================================================================
 * USER MANAGEMENT
 * ============================================================================
 */

/**
 * Get all users
 * @route GET /api/admin/users
 * @access Private/Admin
 */
router.get('/users', async (req, res) => {
  try {
    const User = require('../models/User');
    const { page = 1, limit = 20, role, isActive, search } = req.query;
    
    const query = {};
    
    // Filter by role
    if (role) {
      query.role = role;
    }
    
    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Update user role or status
 * @route PATCH /api/admin/users/:id
 * @access Private/Admin
 */
router.patch('/users/:id', async (req, res) => {
  try {
    const User = require('../models/User');
    const { role, isActive } = req.body;
    
    const updateData = {};
    if (role) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Delete user (soft delete - deactivate)
 * @route DELETE /api/admin/users/:id
 * @access Private/Admin
 */
router.delete('/users/:id', async (req, res) => {
  try {
    const User = require('../models/User');
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully',
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * ============================================================================
 * ANALYTICS & REPORTS
 * ============================================================================
 */

/**
 * Get platform analytics
 * @route GET /api/admin/analytics
 * @access Private/Admin
 */
router.get('/analytics', async (req, res) => {
  try {
    const Analytics = require('../models/Analytics');
    const { startDate, endDate, eventType } = req.query;

    const query = {};
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    if (eventType) {
      query.eventType = eventType;
    }

    const analytics = await Analytics.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: '$user' },
        },
      },
      {
        $project: {
          eventType: '$_id',
          count: 1,
          uniqueUserCount: { $size: '$uniqueUsers' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
