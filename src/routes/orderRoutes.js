const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { apiLimiter, updateLimiter } = require('../middleware/rateLimiter');
const {
  getAllOrders,
  getOrderById,
  trackOrder,
  cancelOrder,
  getOrderStats,
  updateOrderStatus,
  getAllOrdersAdmin,
  deleteOrder,
} = require('../controllers/orderController');

/**
 * PROTECTED ROUTES - USER ACCESS
 * Authentication required
 * Rate limited to prevent abuse
 */

// Get user orders - Rate limited: 100 requests per 15 minutes
router.get('/', protect, apiLimiter, getAllOrders);

// Track order by number - Rate limited: 100 requests per 15 minutes
router.get('/track/:orderNumber', protect, apiLimiter, trackOrder);

// Get specific order - Rate limited: 100 requests per 15 minutes
router.get('/:id', protect, apiLimiter, getOrderById);

// Cancel order - Rate limited: 20 requests per 15 minutes
router.post('/:id/cancel', protect, updateLimiter, cancelOrder);

/**
 * PROTECTED ROUTES - ADMIN ONLY
 * Authentication + Admin role required
 */

// Get order statistics (admin-only platform-wide analytics)
router.get('/stats', protect, authorize('admin'), getOrderStats);

// Get all orders (admin view)
router.get('/admin/all', protect, authorize('admin'), getAllOrdersAdmin);

// Update order status
router.patch('/:id/status', protect, authorize('admin'), updateOrderStatus);

// Delete order
router.delete('/:id', protect, authorize('admin'), deleteOrder);

module.exports = router;
