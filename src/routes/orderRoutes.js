const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAllOrders,
  createOrder,
  getOrderById,
  updateOrder,
  deleteOrder,
  getAllOrdersAdmin,
} = require('../controllers/orderController');

// All order routes require authentication
router.use(protect);

// Admin routes - must come before other routes
router.get('/admin/all', authorize('admin'), getAllOrdersAdmin);

// User order routes
router.route('/').get(getAllOrders).post(createOrder);

router.route('/:id').get(getOrderById);

// Admin-only order management
router.route('/:id').put(authorize('admin'), updateOrder).delete(authorize('admin'), deleteOrder);

module.exports = router;
