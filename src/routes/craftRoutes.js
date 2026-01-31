const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
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
 */

// Get popular crafts
router.get('/popular', getPopularCrafts);

// Get all crafts
router.get('/', getAllCrafts);

// Get craft by ID
router.get('/:id', getCraftById);

/**
 * PROTECTED ROUTES
 * Authentication required
 */

// Voice search crafts
router.get('/voice-search', protect, voiceSearchCrafts);

/**
 * PROTECTED ROUTES - ADMIN ONLY
 * Master craft data management restricted to administrators
 * Only admins can create, update, or delete craft definitions
 */

// Create new craft (admin only)
router.post('/', protect, authorize('admin'), createCraft);

// Update craft (admin only)
router.put('/:id', protect, authorize('admin'), updateCraft);

// Delete craft (admin only)
router.delete('/:id', protect, authorize('admin'), deleteCraft);

module.exports = router;
