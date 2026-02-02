const AIService = require('../services/aiService');
const { getIO } = require('../config/socket');

/**
 * @desc    Predict craft type from uploaded image
 * @route   POST /api/ai/predict
 * @access  Private (Authenticated users only)
 * @security Only logged-in users can upload crafts for recognition
 */
const predictCraft = async (req, res) => {
  const startTime = Date.now();

  try {
    // Explicit authentication check
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'You must be logged in to use craft recognition',
      });
    }

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
      userId: req.user._id,
      userEmail: req.user.email,
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: `${(req.file.size / 1024).toFixed(2)}KB`,
    });

    // Emit socket event to notify frontend that recognition has started
    try {
      const io = getIO();
      io.to(req.user._id.toString()).emit('recognition_started', {
        userId: req.user._id,
        filename: req.file.originalname,
        fileSize: req.file.size,
        timestamp: new Date().toISOString(),
      });
      console.log(`[SOCKET] Emitted recognition_started to user ${req.user._id}`);
    } catch (socketError) {
      // Log socket error but don't block the request
      console.error('[SOCKET] Failed to emit recognition_started:', socketError.message);
    }

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

    // Prepare response data
    const responseData = {
      craftName: result.data.craft_name,
      confidence: result.data.confidence,
      allPredictions: result.data.all_predictions,
      imageInfo: result.data.image_info,
      modelVersion: result.data.model_version,
      processingTime: result.data.processing_time,
      totalTime: totalTime / 1000,
    };

    // Emit socket event to notify frontend that recognition is completed
    try {
      const io = getIO();
      io.to(req.user._id.toString()).emit('recognition_completed', {
        userId: req.user._id,
        filename: req.file.originalname,
        craftName: responseData.craftName,
        confidence: responseData.confidence,
        allPredictions: responseData.allPredictions,
        processingTime: responseData.processingTime,
        totalTime: responseData.totalTime,
        timestamp: new Date().toISOString(),
      });
      console.log(`[SOCKET] Emitted recognition_completed to user ${req.user._id}`);
    } catch (socketError) {
      // Log socket error but don't block the response
      console.error('[SOCKET] Failed to emit recognition_completed:', socketError.message);
    }

    // Return prediction results
    res.status(200).json({
      success: true,
      data: responseData,
      user: {
        id: req.user._id,
        email: req.user.email,
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
