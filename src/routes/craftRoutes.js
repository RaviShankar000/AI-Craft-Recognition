const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
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

// Create new craft
router.post('/', protect, createCraft);

// Update craft
router.put('/:id', protect, updateCraft);

// Delete craft
router.delete('/:id', protect, deleteCraft);

module.exports = router;
