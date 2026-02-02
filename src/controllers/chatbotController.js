const chatbotService = require('../services/chatbotService');
const { getIO } = require('../config/socket');

// Chatbot timeout configuration (in milliseconds)
const CHATBOT_TIMEOUT_MS = 45000; // 45 seconds

/**
 * Create a promise that rejects after a timeout
 * @param {Number} ms - Timeout in milliseconds
 * @returns {Promise} Timeout promise
 */
const createTimeout = (ms) => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Request timeout after ${ms / 1000} seconds`));
    }, ms);
  });
};

/**
 * @desc    Send message to chatbot and get response with streaming
 * @route   POST /api/chatbot/message
 * @access  Public
 */
const sendMessage = async (req, res) => {
  let timeoutOccurred = false;
  let partialResponse = '';
  
  try {
    const { message, context, userId } = req.body;

    // Basic type checking (detailed validation happens in service)
    if (message === undefined || message === null) {
      return res.status(400).json({
        success: false,
        error: 'Missing message',
        message: 'Request body must include a message field',
      });
    }

    // Log incoming message
    console.log(
      'Chatbot message received:',
      typeof message === 'string' ? message.substring(0, 100) : typeof message
    );

    // Emit chatbot_started event
    try {
      const io = getIO();
      const targetRoom = userId || 'anonymous';
      io.to(targetRoom).emit('chatbot_started', {
        userId: targetRoom,
        message: typeof message === 'string' ? message.substring(0, 200) : message,
        timestamp: new Date().toISOString(),
      });
      console.log(`[SOCKET] Emitted chatbot_started to ${targetRoom}`);
    } catch (socketError) {
      console.error('[SOCKET] Failed to emit chatbot_started:', socketError.message);
    }

    // Process message with timeout handling
    const processPromise = chatbotService.processMessage(message, context || {}, {
      onToken: (token) => {
        // Track partial response in case of timeout
        partialResponse += token;
        
        // Emit each token as it's generated
        try {
          const io = getIO();
          const targetRoom = userId || 'anonymous';
          io.to(targetRoom).emit('chatbot_token', {
            userId: targetRoom,
            token: token,
            timestamp: new Date().toISOString(),
          });
        } catch (socketError) {
          console.error('[SOCKET] Failed to emit chatbot_token:', socketError.message);
        }
      },
      onComplete: (fullResponse) => {
        // Only emit if not timed out
        if (!timeoutOccurred) {
          try {
            const io = getIO();
            const targetRoom = userId || 'anonymous';
            io.to(targetRoom).emit('chatbot_completed', {
              userId: targetRoom,
              response: fullResponse,
              timestamp: new Date().toISOString(),
            });
            console.log(`[SOCKET] Emitted chatbot_completed to ${targetRoom}`);
          } catch (socketError) {
            console.error('[SOCKET] Failed to emit chatbot_completed:', socketError.message);
          }
        }
      },
      onError: (error) => {
        // Emit error event
        try {
          const io = getIO();
          const targetRoom = userId || 'anonymous';
          io.to(targetRoom).emit('chatbot_error', {
            userId: targetRoom,
            error: error.message || 'Processing error',
            timestamp: new Date().toISOString(),
          });
          console.log(`[SOCKET] Emitted chatbot_error to ${targetRoom}`);
        } catch (socketError) {
          console.error('[SOCKET] Failed to emit chatbot_error:', socketError.message);
        }
      },
    });

    // Race between processing and timeout
    const response = await Promise.race([
      processPromise,
      createTimeout(CHATBOT_TIMEOUT_MS),
    ]);

    // Check if response is an error from validation
    if (response.error && response.validationError) {
      // Emit error event for validation errors
      try {
        const io = getIO();
        const targetRoom = userId || 'anonymous';
        io.to(targetRoom).emit('chatbot_error', {
          userId: targetRoom,
          error: response.validationError,
          errorType: response.errorType,
          timestamp: new Date().toISOString(),
        });
      } catch (socketError) {
        console.error('[SOCKET] Failed to emit validation error:', socketError.message);
      }

      // Return 200 with error response (allows frontend to display error message)
      return res.status(200).json({
        success: true,
        data: response,
        validation: {
          isValid: false,
          error: response.errorType,
          reason: response.validationError,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Chatbot message error:', error);
    
    // Check if it's a timeout error
    const isTimeout = error.message && error.message.includes('timeout');
    
    if (isTimeout) {
      timeoutOccurred = true;
      
      // Emit timeout event with partial response
      try {
        const io = getIO();
        const targetRoom = req.body.userId || 'anonymous';
        io.to(targetRoom).emit('chatbot_error', {
          userId: targetRoom,
          error: 'Request timeout',
          message: 'The request took too long to process',
          timeout: true,
          partialResponse: partialResponse || null,
          timestamp: new Date().toISOString(),
        });
        console.log(`[SOCKET] Emitted timeout error to ${targetRoom}`);
      } catch (socketError) {
        console.error('[SOCKET] Failed to emit timeout error:', socketError.message);
      }
      
      return res.status(408).json({
        success: false,
        error: 'Request timeout',
        message: 'The chatbot response took too long. Please try again.',
        timeout: true,
        partialResponse: partialResponse || null,
      });
    }
    
    // Emit error event for other exceptions
    try {
      const io = getIO();
      const targetRoom = req.body.userId || 'anonymous';
      io.to(targetRoom).emit('chatbot_error', {
        userId: targetRoom,
        error: 'Server error',
        message: 'Failed to process message',
        timestamp: new Date().toISOString(),
      });
    } catch (socketError) {
      console.error('[SOCKET] Failed to emit error:', socketError.message);
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Failed to process message',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get quick help topics
 * @route   GET /api/chatbot/quick-help
 * @access  Public
 */
const getQuickHelp = async (req, res) => {
  try {
    const quickHelp = chatbotService.getQuickHelp();

    res.status(200).json({
      success: true,
      data: quickHelp,
    });
  } catch (error) {
    console.error('Get quick help error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Failed to get quick help',
    });
  }
};

/**
 * @desc    Get frequently asked questions
 * @route   GET /api/chatbot/faqs
 * @access  Public
 */
const getFAQs = async (req, res) => {
  try {
    const faqs = chatbotService.getFAQs();

    res.status(200).json({
      success: true,
      data: faqs,
    });
  } catch (error) {
    console.error('Get FAQs error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Failed to get FAQs',
    });
  }
};

/**
 * @desc    Get chatbot status and capabilities
 * @route   GET /api/chatbot/status
 * @access  Public
 */
const getStatus = async (req, res) => {
  try {
    const status = {
      online: true,
      version: '1.0.0',
      capabilities: [
        'Craft information',
        'Feature guidance',
        'Upload assistance',
        'Voice search help',
        'Intent recognition',
        'Multi-turn conversation',
      ],
      supportedIntents: [
        'greeting',
        'help',
        'craftInfo',
        'features',
        'upload',
        'search',
        'voiceSearch',
        'materials',
        'techniques',
        'categories',
      ],
      supportedLanguages: ['en'],
    };

    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Failed to get status',
    });
  }
};

module.exports = {
  sendMessage,
  getQuickHelp,
  getFAQs,
  getStatus,
};
