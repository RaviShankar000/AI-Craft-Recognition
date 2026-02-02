const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimiter');

/**
 * PUBLIC ROUTES
 * No authentication required
 * Rate limited to prevent brute force attacks
 */

// Register route - Rate limited: 5 requests per 15 minutes
router.post('/register', authLimiter, validateRegister, register);

// Login route - Rate limited: 5 requests per 15 minutes
router.post('/login', authLimiter, validateLogin, login);

module.exports = router;
