const express = require('express');
const multer = require('multer');
const { transcribeAudio, getStatus } = require('../controllers/speechController');
const { protect } = require('../middleware/auth');

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

// Public routes
router.get('/status', getStatus);

// Protected routes
router.post('/transcribe', protect, upload.single('audio'), transcribeAudio);

module.exports = router;
