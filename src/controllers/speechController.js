const speechToTextService = require('../services/speechToTextService');
const { getIO } = require('../config/socket');

/**
 * @desc    Transcribe audio to text
 * @route   POST /api/speech/transcribe
 * @access  Private
 */
const transcribeAudio = async (req, res) => {
  const startTime = Date.now();

  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No audio file uploaded',
      });
    }

    // Validate file buffer
    if (!req.file.buffer) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file upload - buffer missing',
      });
    }

    // Validate audio file type
    const allowedMimeTypes = [
      'audio/wav',
      'audio/mpeg',
      'audio/mp3',
      'audio/webm',
      'audio/ogg',
      'audio/flac',
    ];

    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid audio format',
        message: 'Supported formats: WAV, MP3, WEBM, OGG, FLAC',
      });
    }

    // Validate file size (25MB limit for audio)
    const MAX_SIZE = 25 * 1024 * 1024;
    if (req.file.size > MAX_SIZE) {
      return res.status(400).json({
        success: false,
        error: 'File too large',
        message: `Maximum file size is ${MAX_SIZE / 1024 / 1024}MB`,
      });
    }

    console.log('Processing audio file:', {
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: `${(req.file.size / 1024).toFixed(2)}KB`,
    });

    // Emit socket event to notify frontend that transcription has started
    try {
      const io = getIO();
      if (req.user && req.user._id) {
        io.to(req.user._id.toString()).emit('voice_recording_started', {
          userId: req.user._id,
          filename: req.file.originalname,
          fileSize: req.file.size,
          language: language || 'auto-detect',
          timestamp: new Date().toISOString(),
        });
        console.log(`[SOCKET] Emitted voice_recording_started to user ${req.user._id}`);
      }
    } catch (socketError) {
      console.error('[SOCKET] Failed to emit voice_recording_started:', socketError.message);
    }

    // Get language from request body (optional)
    const language = req.body.language || null;

    // Transcribe audio
    const result = await speechToTextService.transcribe(
      req.file.buffer,
      req.file.originalname,
      language
    );

    if (!result.success) {
      console.error('Transcription failed:', result.error, result.message);

      // Emit socket event for transcription failure
      try {
        const io = getIO();
        if (req.user && req.user._id) {
          io.to(req.user._id.toString()).emit('voice_recording_failed', {
            userId: req.user._id,
            filename: req.file.originalname,
            error: result.error,
            message: result.message,
            timestamp: new Date().toISOString(),
          });
          console.log(`[SOCKET] Emitted voice_recording_failed to user ${req.user._id}`);
        }
      } catch (socketError) {
        console.error('[SOCKET] Failed to emit voice_recording_failed:', socketError.message);
      }

      // Return specific error codes for different scenarios
      let statusCode = 500;
      if (result.error === 'Unsupported language') {
        statusCode = 400;
      } else if (result.error === 'Invalid audio file') {
        statusCode = 400;
      } else if (result.error === 'No speech detected') {
        statusCode = 422;
      } else if (result.error === 'Validation failed') {
        statusCode = 400;
      } else if (result.error === 'Request timeout') {
        statusCode = 504;
      }

      return res.status(statusCode).json({
        success: false,
        error: result.error,
        message: result.message,
        supportedLanguages: result.supportedLanguages,
      });
    }

    const totalTime = Date.now() - startTime;
    console.log(`Total transcription time: ${totalTime}ms`);

    // Emit socket event to notify frontend that transcription completed
    try {
      const io = getIO();
      if (req.user && req.user._id) {
        io.to(req.user._id.toString()).emit('voice_recording_completed', {
          userId: req.user._id,
          filename: req.file.originalname,
          text: result.data.text,
          language: result.data.language,
          confidence: result.data.confidence,
          provider: result.data.provider,
          processingTime: result.data.duration,
          totalTime: totalTime / 1000,
          timestamp: new Date().toISOString(),
        });
        console.log(`[SOCKET] Emitted voice_recording_completed to user ${req.user._id}`);
      }
    } catch (socketError) {
      console.error('[SOCKET] Failed to emit voice_recording_completed:', socketError.message);
    }

    // Return transcription results
    res.status(200).json({
      success: true,
      data: {
        text: result.data.text,
        provider: result.data.provider,
        language: result.data.language,
        confidence: result.data.confidence,
        processingTime: result.data.duration,
        totalTime: totalTime / 1000,
      },
    });
  } catch (error) {
    console.error('Transcription controller error:', error);

    // Emit socket event for unexpected errors
    try {
      const io = getIO();
      if (req.user && req.user._id) {
        io.to(req.user._id.toString()).emit('voice_recording_failed', {
          userId: req.user._id,
          filename: req.file?.originalname || 'unknown',
          error: 'Server error',
          message: error.message,
          timestamp: new Date().toISOString(),
        });
        console.log(`[SOCKET] Emitted voice_recording_failed (exception) to user ${req.user._id}`);
      }
    } catch (socketError) {
      console.error('[SOCKET] Failed to emit voice_recording_failed:', socketError.message);
    }

    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message,
    });
  }
};

/**
 * @desc    Get speech-to-text service status
 * @route   GET /api/speech/status
 * @access  Public
 */
const getStatus = async (req, res) => {
  try {
    const status = speechToTextService.getStatus();

    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message,
    });
  }
};

module.exports = {
  transcribeAudio,
  getStatus,
};
