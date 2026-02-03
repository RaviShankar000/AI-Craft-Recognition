const express = require('express');
const router = express.Router();
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { apiLimiter, updateLimiter } = require('../middleware/rateLimiter');
const { validateProduct, validateObjectId } = require('../middleware/validation');
const {
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
} = require('../controllers/productController');

/**
 * PUBLIC ROUTES
 * No authentication required (but optionalAuth allows user context)
 * Rate limited to prevent abuse
 */

// Get products by craft (must be before /:id route) - Rate limited: 100 requests per 15 minutes
router.get('/craft/:craftId', apiLimiter, getProductsByCraft);

// Get all products (shows approved for public, user's own if authenticated) - Rate limited: 100 requests per 15 minutes
router.get('/', optionalAuth, apiLimiter, getAllProducts);

// Get product by ID - Rate limited: 100 requests per 15 minutes
router.get('/:id', validateObjectId, apiLimiter, getProductById);

/**
 * PROTECTED ROUTES - SELLER ONLY
 * Sellers can manage their own products
 * Rate limited to prevent abuse
 */

// Create new product - Rate limited: 20 requests per 15 minutes
router.post('/', protect, authorize('seller', 'admin'), validateProduct, updateLimiter, createProduct);

// Update product - Rate limited: 20 requests per 15 minutes
router.put('/:id', protect, authorize('seller', 'admin'), validateObjectId, validateProduct, updateLimiter, updateProduct);

// Delete product - Rate limited: 20 requests per 15 minutes
router.delete('/:id', protect, authorize('seller', 'admin'), validateObjectId, updateLimiter, deleteProduct);

// Stock management route - Rate limited: 20 requests per 15 minutes
router.patch(
  '/:id/stock',
  protect,
  authorize('seller', 'admin'),
  updateLimiter,
  updateProductStock
);

/**
 * PROTECTED ROUTES - ADMIN ONLY
 * Product moderation and approval restricted to administrators
 */

// Get moderation statistics
router.get('/moderation/stats', protect, authorize('admin'), getModerationStats);

// Get all pending products for moderation
router.get('/moderation/pending', protect, authorize('admin'), getPendingProducts);

// Approve product
router.patch('/:id/approve', protect, authorize('admin'), approveProduct);

// Reject product
router.patch('/:id/reject', protect, authorize('admin'), rejectProduct);

module.exports = router;
