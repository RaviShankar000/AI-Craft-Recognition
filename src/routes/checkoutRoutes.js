const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { apiLimiter, updateLimiter } = require('../middleware/rateLimiter');
const {
  validateCheckout,
  processCheckout,
  getCheckoutSummary,
  applyDiscount,
} = require('../controllers/checkoutController');

/**
 * PROTECTED ROUTES
 * All checkout routes require authentication
 * Rate limited to prevent abuse
 */

// Get checkout summary - Rate limited: 100 requests per 15 minutes
router.get('/summary', protect, apiLimiter, getCheckoutSummary);

// Validate checkout - Rate limited: 20 requests per 15 minutes
router.post('/validate', protect, updateLimiter, validateCheckout);

// Apply discount code - Rate limited: 20 requests per 15 minutes
router.post('/apply-discount', protect, updateLimiter, applyDiscount);

// Process checkout - Rate limited: 20 requests per 15 minutes
router.post('/', protect, updateLimiter, processCheckout);

module.exports = router;
