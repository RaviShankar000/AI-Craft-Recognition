const express = require('express');
const router = express.Router();
const { protect, authorize, optionalAuth } = require('../middleware/auth');
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
 */

// Get products by craft (must be before /:id route)
router.get('/craft/:craftId', getProductsByCraft);

// Get all products (shows approved for public, user's own if authenticated)
router.get('/', optionalAuth, getAllProducts);

// Get product by ID
router.get('/:id', getProductById);

/**
 * PROTECTED ROUTES - SELLER ONLY
 * Sellers can manage their own products
 */

// Create new product
router.post('/', protect, authorize('seller', 'admin'), createProduct);

// Update product
router.put('/:id', protect, authorize('seller', 'admin'), updateProduct);

// Delete product
router.delete('/:id', protect, authorize('seller', 'admin'), deleteProduct);

// Stock management route
router.patch('/:id/stock', protect, authorize('seller', 'admin'), updateProductStock);

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
