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

// All craft routes are protected
router.use(protect);

// Special routes (must be before /:id route)
router.get('/voice-search', voiceSearchCrafts);
router.get('/popular', getPopularCrafts);

// Craft routes
router.route('/').get(getAllCrafts).post(createCraft);

router.route('/:id').get(getCraftById).put(updateCraft).delete(deleteCraft);

module.exports = router;
