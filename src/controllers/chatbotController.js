const chatbotService = require('../services/chatbotService');

/**
 * @desc    Send message to chatbot and get response
 * @route   POST /api/chatbot/message
 * @access  Public
 */
const sendMessage = async (req, res) => {
  try {
    const { message, context } = req.body;

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

    // Process message through chatbot service (service handles all validation)
    const response = await chatbotService.processMessage(message, context || {});

    // Check if response is an error from validation
    if (response.error && response.validationError) {
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
