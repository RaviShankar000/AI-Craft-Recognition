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

// All product routes are protected
router.use(protect);

// Get products by craft (must be before /:id route)
router.get('/craft/:craftId', getProductsByCraft);

// Main product routes
router.route('/').get(getAllProducts).post(createProduct);

// Individual product routes
router.route('/:id').get(getProductById).put(updateProduct).delete(deleteProduct);

// Stock management route
router.patch('/:id/stock', updateProductStock);

module.exports = router;
