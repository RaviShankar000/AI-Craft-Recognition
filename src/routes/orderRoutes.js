const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
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
 */

// Get user orders
router.get('/', protect, getAllOrders);

// Track order by number
router.get('/track/:orderNumber', protect, trackOrder);

// Get specific order
router.get('/:id', protect, getOrderById);

// Cancel order
router.post('/:id/cancel', protect, cancelOrder);

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
