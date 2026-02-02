const express = require('express');
const multer = require('multer');
const { predictCraft, checkHealth } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Configure multer for memory storage (to forward to AI service)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 16 * 1024 * 1024, // 16MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  },
});

/**
 * PUBLIC ROUTES
 * No authentication required
 */

// Check AI service health
router.get('/health', checkHealth);

/**
 * PROTECTED ROUTES - AUTHENTICATED USERS ONLY
 * ============================================================================
 * SECURITY: Craft recognition is restricted to authenticated users only.
 * Anonymous users cannot upload or recognize crafts.
 * 
 * This prevents:
 * - Abuse of AI service resources
 * - Unauthorized craft data collection
 * - Anonymous spam and malicious uploads
 * 
 * Users must be logged in (valid JWT token) to access craft recognition.
 * ============================================================================
 */

// Predict craft type from image
router.post('/predict', protect, upload.single('image'), predictCraft);

module.exports = router;
