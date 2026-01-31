const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getAllCrafts,
  createCraft,
  getCraftById,
  updateCraft,
  deleteCraft,
} = require('../controllers/craftController');

// All craft routes are protected
router.use(protect);

// Craft routes
router.route('/').get(getAllCrafts).post(createCraft);

router.route('/:id').get(getCraftById).put(updateCraft).delete(deleteCraft);

module.exports = router;
