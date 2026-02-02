const express = require('express');
const multer = require('multer');
const { transcribeAudio, getStatus } = require('../controllers/speechController');
const { protect } = require('../middleware/auth');
const { chatLimiter, apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit for audio
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files only
    const allowedMimeTypes = [
      'audio/wav',
      'audio/mpeg',
      'audio/mp3',
      'audio/webm',
      'audio/ogg',
      'audio/flac',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('Only audio files are allowed'), false);
    }
    cb(null, true);
  },
});

/**
 * PUBLIC ROUTES
 * No authentication required
 * Rate limited to prevent abuse
 */

// Get speech service status - Rate limited: 100 requests per 15 minutes
router.get('/status', apiLimiter, getStatus);

/**
 * PROTECTED ROUTES
 * Authentication required
 * Rate limited to prevent abuse of AI service
 */

// Transcribe audio to text - Rate limited: 30 requests per 15 minutes
router.post('/transcribe', protect, chatLimiter, upload.single('audio'), transcribeAudio);

module.exports = router;
