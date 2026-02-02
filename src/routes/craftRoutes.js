const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const {
  getAllCrafts,
  createCraft,
  getCraftById,
  updateCraft,
  deleteCraft,
  voiceSearchCrafts,
  getPopularCrafts,
} = require('../controllers/craftController');

/**
 * PUBLIC ROUTES
 * No authentication required
 * Rate limited to prevent abuse
 */

// Get all crafts - Rate limited: 100 requests per 15 minutes
router.get('/', apiLimiter, getAllCrafts);

// Get craft by ID - Rate limited: 100 requests per 15 minutes
router.get('/:id', apiLimiter, getCraftById);

/**
 * PROTECTED ROUTES
 * Authentication required
 * Rate limited to prevent abuse
 */

// Voice search crafts - Rate limited: 100 requests per 15 minutes
router.get('/voice-search', protect, apiLimiter, voiceSearchCrafts);

/**
 * PROTECTED ROUTES - ADMIN ONLY
 * Master craft data management and analytics restricted to administrators
 */

// Get popular crafts (admin-only analytics)
router.get('/popular', protect, authorize('admin'), getPopularCrafts);

// Create new craft (admin only)
router.post('/', protect, authorize('admin'), createCraft);

// Update craft (admin only)
router.put('/:id', protect, authorize('admin'), updateCraft);

// Delete craft (admin only)
router.delete('/:id', protect, authorize('admin'), deleteCraft);

module.exports = router;
