const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getQuickHelp,
  getFAQs,
  getStatus,
} = require('../controllers/chatbotController');

// All chatbot routes are public (no authentication required)

/**
 * @route   POST /api/chatbot/message
 * @desc    Send message to chatbot
 * @access  Public
 */
router.post('/message', sendMessage);

/**
 * @route   GET /api/chatbot/quick-help
 * @desc    Get quick help topics
 * @access  Public
 */
router.get('/quick-help', getQuickHelp);

/**
 * @route   GET /api/chatbot/faqs
 * @desc    Get frequently asked questions
 * @access  Public
 */
router.get('/faqs', getFAQs);

/**
 * @route   GET /api/chatbot/status
 * @desc    Get chatbot status and capabilities
 * @access  Public
 */
router.get('/status', getStatus);

module.exports = router;
