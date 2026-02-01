const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  applyForSeller,
  getApplicationStatus,
  cancelApplication,
} = require('../controllers/sellerController');

/**
 * ============================================================================
 * SELLER ONBOARDING ROUTES (USER-FACING)
 * ============================================================================
 * 
 * These routes handle the user-facing seller application workflow:
 * 
 * USER FLOW:
 * 1. User applies for seller status with business details
 * 2. Application goes to 'pending' status
 * 3. User can check their application status
 * 4. User can cancel pending application if needed
 * 5. Admin reviews and approves/rejects (see adminRoutes.js)
 * 6. If approved, user role automatically changes to 'seller'
 * 7. If rejected, user can reapply after addressing concerns
 * 
 * NOTE: Admin management of applications is in /api/admin/seller-applications/*
 * ============================================================================
 */

/**
 * PROTECTED ROUTES - AUTHENTICATED USER ACCESS
 * Any authenticated user can apply to become a seller
 */

/**
 * Apply for seller status
 * @route POST /api/seller/apply
 * @access Private
 * @body { businessName, businessDescription, contactPhone, businessAddress, taxId, websiteUrl }
 */
router.post('/apply', protect, applyForSeller);

/**
 * Get current user's seller application status
 * @route GET /api/seller/application/status
 * @access Private
 */
router.get('/application/status', protect, getApplicationStatus);

/**
 * Cancel pending seller application
 * @route DELETE /api/seller/application
 * @access Private
 */
router.delete('/application', protect, cancelApplication);

module.exports = router;
