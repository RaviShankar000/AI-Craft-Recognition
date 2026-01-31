const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  validateCheckout,
  processCheckout,
  getCheckoutSummary,
  applyDiscount,
} = require('../controllers/checkoutController');

/**
 * PROTECTED ROUTES
 * All checkout routes require authentication
 */

// Get checkout summary
router.get('/summary', protect, getCheckoutSummary);

// Validate checkout
router.post('/validate', protect, validateCheckout);

// Apply discount code
router.post('/apply-discount', protect, applyDiscount);

// Process checkout
router.post('/', protect, processCheckout);

module.exports = router;
