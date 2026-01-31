const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStock,
  getProductsByCraft,
} = require('../controllers/productController');

/**
 * PUBLIC ROUTES
 * No authentication required
 */

// Get products by craft (must be before /:id route)
router.get('/craft/:craftId', getProductsByCraft);

// Get all products
router.get('/', getAllProducts);

// Get product by ID
router.get('/:id', getProductById);

/**
 * PROTECTED ROUTES
 * Authentication required
 */

// Create new product
router.post('/', protect, createProduct);

// Update product
router.put('/:id', protect, updateProduct);

// Delete product
router.delete('/:id', protect, deleteProduct);

// Stock management route
router.patch('/:id/stock', protect, updateProductStock);

module.exports = router;
