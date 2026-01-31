const chatbotService = require('../services/chatbotService');

/**
 * @desc    Send message to chatbot and get response
 * @route   POST /api/chatbot/message
 * @access  Public
 */
const sendMessage = async (req, res) => {
  try {
    const { message, context } = req.body;

    // Validate message
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid message',
        message: 'Message must be a non-empty string',
      });
    }

    // Check message length
    if (message.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Message too long',
        message: 'Message must be less than 1000 characters',
      });
    }

    console.log('Chatbot message received:', message.substring(0, 100));

    // Process message through chatbot service
    const response = await chatbotService.processMessage(message, context || {});

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
