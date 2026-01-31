const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  validateCheckout,
  processCheckout,
  getCheckoutSummary,
  applyDiscount,
} = require('../controllers/checkoutController');

// All checkout routes are protected
router.use(protect);

// Checkout routes
router.get('/summary', getCheckoutSummary);
router.post('/validate', validateCheckout);
router.post('/apply-discount', applyDiscount);
router.post('/', processCheckout);

module.exports = router;
