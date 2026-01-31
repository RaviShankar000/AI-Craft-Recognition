const AIService = require('../services/aiService');

/**
 * @desc    Predict craft type from uploaded image
 * @route   POST /api/ai/predict
 * @access  Private
 */
const predictCraft = async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file uploaded',
      });
    }

    // Validate file has buffer (memory storage)
    if (!req.file.buffer) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file upload - buffer missing',
      });
    }

    // Validate file size
    const MAX_SIZE = 16 * 1024 * 1024; // 16MB
    if (req.file.size > MAX_SIZE) {
      return res.status(400).json({
        success: false,
        error: 'File too large',
        message: `Maximum file size is ${MAX_SIZE / 1024 / 1024}MB`,
      });
    }

    // Log file info for debugging
    console.log('Processing image:', {
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: `${(req.file.size / 1024).toFixed(2)}KB`,
    });

    // Send image to AI service
    const result = await AIService.predictCraft(req.file);

    if (!result.success) {
      // Log error for monitoring
      console.error('AI prediction failed:', result.error, result.message);
      
      return res.status(result.status || 500).json({
        success: false,
        error: result.error,
        message: result.message,
      });
    }

    const totalTime = Date.now() - startTime;
    console.log(`Total request time: ${totalTime}ms`);

    // Return prediction results
    res.status(200).json({
      success: true,
      data: {
        craftName: result.data.craft_name,
        confidence: result.data.confidence,
        allPredictions: result.data.all_predictions,
        imageInfo: result.data.image_info,
        modelVersion: result.data.model_version,
        processingTime: result.data.processing_time,
        totalTime: totalTime / 1000,
      },
    });
  } catch (error) {
    console.error('Prediction controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message,
    });
  }
};
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message,
    });
  }
};

/**
 * @desc    Check AI service health
 * @route   GET /api/ai/health
 * @access  Public
 */
const checkHealth = async (req, res) => {
  try {
    const result = await AIService.checkHealth();

    if (!result.success) {
      return res.status(503).json({
        success: false,
        error: 'AI service unavailable',
        message: result.error,
      });
    }

    res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message,
    });
  }
};

module.exports = {
  predictCraft,
  checkHealth,
};
