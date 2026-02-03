const rateLimit = require('express-rate-limit');
const logger = require('../config/logger');

/**
 * Rate Limiting Middleware
 * Prevents API abuse by limiting the number of requests from a single IP address
 */

/**
 * Strict rate limiter for authentication endpoints
 * - Prevents brute force attacks on login/register
 * - 5 requests per 15 minutes per IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: 'Too many authentication attempts from this IP, please try again after 15 minutes',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: false, // Count all requests
  skipFailedRequests: false, // Count failed requests too
  handler: (req, res) => {
    logger.logSecurity('auth_rate_limit_exceeded', {
      ip: req.ip,
      path: req.path,
      email: req.body?.email || 'unknown',
      userAgent: req.get('user-agent'),
    });
    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts',
      message:
        'You have exceeded the maximum number of login/register attempts. Please try again after 15 minutes.',
      retryAfter: '15 minutes',
    });
  },
});

/**
 * General API rate limiter
 * - Prevents general API abuse
 * - 100 requests per 15 minutes per IP
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    logger.logSecurity('api_rate_limit_exceeded', {
      ip: req.ip,
      path: req.path,
      userAgent: req.get('user-agent'),
    });
    res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
      message: 'You have made too many requests. Please try again after 15 minutes.',
      retryAfter: '15 minutes',
    });
  },
});

/**
 * AI/Upload endpoint rate limiter
 * - Prevents abuse of resource-intensive operations
 * - 10 requests per 15 minutes per IP
 */
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    success: false,
    error: 'Too many AI/upload requests from this IP',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    logger.logSecurity('ai_rate_limit_exceeded', {
      ip: req.ip,
      path: req.path,
      userId: req.user?.id || 'anonymous',
      userAgent: req.get('user-agent'),
    });
    res.status(429).json({
      success: false,
      error: 'AI service rate limit exceeded',
      message: 'You have made too many AI prediction requests. Please try again after 15 minutes.',
      retryAfter: '15 minutes',
    });
  },
});

/**
 * User profile update rate limiter
 * - Prevents rapid profile update abuse
 * - 20 requests per 15 minutes per IP
 */
const updateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  message: {
    success: false,
    error: 'Too many update requests from this IP',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    logger.logSecurity('update_rate_limit_exceeded', {
      ip: req.ip,
      path: req.path,
      userId: req.user?.id || 'anonymous',
      userAgent: req.get('user-agent'),
    });
    res.status(429).json({
      success: false,
      error: 'Update rate limit exceeded',
      message: 'You have made too many update requests. Please try again after 15 minutes.',
      retryAfter: '15 minutes',
    });
  },
});

/**
 * Chatbot/Speech rate limiter
 * - Prevents abuse of AI-powered features
 * - 30 requests per 15 minutes per IP
 */
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per windowMs
  message: {
    success: false,
    error: 'Too many chatbot/speech requests from this IP',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    logger.logSecurity('chat_rate_limit_exceeded', {
      ip: req.ip,
      path: req.path,
      userId: req.user?.id || 'anonymous',
      userAgent: req.get('user-agent'),
    });
    res.status(429).json({
      success: false,
      error: 'Chat service rate limit exceeded',
      message: 'You have made too many chat or speech requests. Please try again after 15 minutes.',
      retryAfter: '15 minutes',
    });
  },
});

/**
 * Registration rate limiter
 * - Prevents mass account creation
 * - 3 requests per hour per IP
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 registrations per hour
  message: {
    success: false,
    error: 'Too many accounts created from this IP',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.logSecurity('registration_rate_limit_exceeded', {
      ip: req.ip,
      email: req.body?.email || 'unknown',
      userAgent: req.get('user-agent'),
    });
    res.status(429).json({
      success: false,
      error: 'Registration rate limit exceeded',
      message: 'Too many accounts created from this IP, please try again after an hour.',
      retryAfter: '1 hour',
    });
  },
});

/**
 * Password reset rate limiter
 * - Prevents password reset abuse
 * - 3 requests per hour per IP
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password resets per hour
  message: {
    success: false,
    error: 'Too many password reset attempts',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.logSecurity('password_reset_rate_limit_exceeded', {
      ip: req.ip,
      email: req.body?.email || 'unknown',
      userAgent: req.get('user-agent'),
    });
    res.status(429).json({
      success: false,
      error: 'Password reset rate limit exceeded',
      message: 'Too many password reset attempts, please try again after an hour.',
      retryAfter: '1 hour',
    });
  },
});

/**
 * File upload rate limiter
 * - Prevents upload abuse
 * - 10 requests per 15 minutes per IP
 */
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 uploads per windowMs
  message: {
    success: false,
    error: 'Too many file uploads from this IP',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.logSecurity('upload_rate_limit_exceeded', {
      ip: req.ip,
      path: req.path,
      userId: req.user?.id || 'anonymous',
      userAgent: req.get('user-agent'),
    });
    res.status(429).json({
      success: false,
      error: 'Upload rate limit exceeded',
      message: 'Too many file uploads from this IP, please try again later.',
      retryAfter: '15 minutes',
    });
  },
});

module.exports = {
  authLimiter,
  apiLimiter,
  aiLimiter,
  updateLimiter,
  chatLimiter,
  registerLimiter,
  passwordResetLimiter,
  uploadLimiter,
};
