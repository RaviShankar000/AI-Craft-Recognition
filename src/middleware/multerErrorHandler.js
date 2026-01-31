const handleMulterError = (err, req, res, next) => {
  if (err instanceof require('multer').MulterError) {
    // Multer-specific errors
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File size too large. Maximum size is 5MB.',
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files. Maximum is 5 files.',
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Unexpected field name.',
      });
    }
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }

  // File filter errors
  if (err.message && err.message.includes('Only image files')) {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }

  next(err);
};

module.exports = handleMulterError;
