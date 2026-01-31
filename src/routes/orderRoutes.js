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

// All order routes require authentication
router.use(protect);

// Admin routes - must come before other routes
router.get('/admin/all', authorize('admin'), getAllOrdersAdmin);

// User order routes
router.get('/', getAllOrders);
router.get('/stats', getOrderStats);
router.get('/track/:orderNumber', trackOrder);
router.get('/:id', getOrderById);

// Order cancellation
router.post('/:id/cancel', cancelOrder);

// Admin-only order management
router.patch('/:id/status', authorize('admin'), updateOrderStatus);
router.delete('/:id', authorize('admin'), deleteOrder);

module.exports = router;
