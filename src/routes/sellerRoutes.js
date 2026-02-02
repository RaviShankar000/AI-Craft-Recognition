const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  applyForSeller,
  getApplicationStatus,
  cancelApplication,
  getSellerDashboard,
  getSellerProducts,
  getSellerSales,
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

/**
 * ============================================================================
 * SELLER DASHBOARD ROUTES
 * ============================================================================
 * 
 * SECURITY: These routes are STRICTLY for sellers and admins only.
 * Regular users (role: 'user') are BLOCKED by authorize middleware.
 * 
 * These routes are for approved sellers to manage their business:
 * - View dashboard overview with product and sales statistics
 * - Manage their products
 * - View sales history and revenue
 * 
 * ACCESS CONTROL:
 * - Regular users (role: 'user') → 403 FORBIDDEN
 * - Sellers (role: 'seller') → ALLOWED
 * - Admins (role: 'admin') → ALLOWED
 * 
 * NOTE: Regular users must apply and be approved to become sellers first
 * ============================================================================
 */

/**
 * Get seller dashboard overview
 * @route GET /api/seller/dashboard
 * @access Private/Seller (BLOCKS regular users)
 */
router.get('/dashboard', protect, authorize('seller', 'admin'), getSellerDashboard);

/**
 * Get seller's products with filters
 * @route GET /api/seller/products
 * @access Private/Seller (BLOCKS regular users)
 * @query status - Filter by moderation status (pending/approved/rejected)
 * @query inStock - Filter by stock availability (true/false)
 * @query search - Search by product name or description
 * @query page - Page number
 * @query limit - Items per page
 */
router.get('/products', protect, authorize('seller', 'admin'), getSellerProducts);

/**
 * Get seller's sales summary
 * @route GET /api/seller/sales
 * @access Private/Seller (BLOCKS regular users)
 * @query startDate - Filter from date
 * @query endDate - Filter to date
 * @query page - Page number
 * @query limit - Items per page
 */
router.get('/sales', protect, authorize('seller', 'admin'), getSellerSales);

module.exports = router;
