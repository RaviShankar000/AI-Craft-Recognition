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

// All cart routes are protected
router.use(protect);

// Cart sync route
router.post('/sync', syncCart);

// Main cart routes
router.route('/').get(getCart).delete(clearCart);

// Cart items routes
router.post('/items', addToCart);
router.route('/items/:productId').put(updateCartItem).delete(removeFromCart);

module.exports = router;
