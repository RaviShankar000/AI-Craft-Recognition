const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { apiLimiter, updateLimiter } = require('../middleware/rateLimiter');
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
 * Rate limited to prevent abuse
 */

// Cart sync route - Rate limited: 100 requests per 15 minutes
router.post('/sync', protect, apiLimiter, syncCart);

// Get user cart - Rate limited: 100 requests per 15 minutes
router.get('/', protect, apiLimiter, getCart);

// Clear cart - Rate limited: 20 requests per 15 minutes
router.delete('/', protect, updateLimiter, clearCart);

// Add item to cart - Rate limited: 20 requests per 15 minutes
router.post('/items', protect, updateLimiter, addToCart);

// Update cart item - Rate limited: 20 requests per 15 minutes
router.put('/items/:productId', protect, updateLimiter, updateCartItem);

// Remove item from cart - Rate limited: 20 requests per 15 minutes
router.delete('/items/:productId', protect, updateLimiter, removeFromCart);

module.exports = router;
