const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  syncCart,
} = require('../controllers/cartController');

/**
 * PROTECTED ROUTES
 * All cart routes require authentication
 */

// Cart sync route
router.post('/sync', protect, syncCart);

// Get user cart
router.get('/', protect, getCart);

// Clear cart
router.delete('/', protect, clearCart);

// Add item to cart
router.post('/items', protect, addToCart);

// Update cart item
router.put('/items/:productId', protect, updateCartItem);

// Remove item from cart
router.delete('/items/:productId', protect, removeFromCart);

module.exports = router;
