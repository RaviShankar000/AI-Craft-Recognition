const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getQuickHelp,
  getFAQs,
  getStatus,
} = require('../controllers/chatbotController');
const { chatLimiter, apiLimiter } = require('../middleware/rateLimiter');

/**
 * PUBLIC ROUTES
 * All chatbot routes are public - no authentication required
 * Rate limited to prevent abuse of AI-powered features
 */

/**
 * @route   POST /api/chatbot/message
 * @desc    Send message to chatbot
 * @access  Public
 * @ratelimit 30 requests per 15 minutes
 */
router.post('/message', chatLimiter, sendMessage);

/**
 * @route   GET /api/chatbot/quick-help
 * @desc    Get quick help topics
 * @access  Public
 * @ratelimit 100 requests per 15 minutes
 */
router.get('/quick-help', apiLimiter, getQuickHelp);

/**
 * @route   GET /api/chatbot/faqs
 * @desc    Get frequently asked questions
 * @access  Public
 * @ratelimit 100 requests per 15 minutes
 */
router.get('/faqs', apiLimiter, getFAQs);

/**
 * @route   GET /api/chatbot/status
 * @desc    Get chatbot status and capabilities
 * @access  Public
 * @ratelimit 100 requests per 15 minutes
 */
router.get('/status', apiLimiter, getStatus);

module.exports = router;
