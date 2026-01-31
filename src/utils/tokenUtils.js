const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Generate JWT token for user
 * @param {Object} payload - Token payload
 * @param {string} payload.id - User ID
 * @param {string} payload.email - User email
 * @param {string} payload.role - User role (user, admin, seller)
 * @returns {string} JWT token
 */
const generateToken = payload => {
  // Ensure role is included in the payload
  const tokenPayload = {
    id: payload.id,
    email: payload.email,
    role: payload.role || 'user', // Default to 'user' if role not provided
  };

  return jwt.sign(tokenPayload, config.jwtSecret || 'your-secret-key-change-in-production', {
    expiresIn: config.jwtExpire,
  });
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} With specific error type
 */
const verifyToken = token => {
  try {
    return jwt.verify(token, config.jwtSecret || 'your-secret-key-change-in-production');
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      const err = new Error('Token has expired. Please login again.');
      err.name = 'TokenExpiredError';
      throw err;
    }
    if (error.name === 'JsonWebTokenError') {
      const err = new Error('Invalid token. Please provide a valid token.');
      err.name = 'JsonWebTokenError';
      throw err;
    }
    throw new Error('Token verification failed');
  }
};

/**
 * Generate refresh token
 * @param {Object} payload - Token payload
 * @param {string} payload.id - User ID
 * @param {string} payload.email - User email
 * @param {string} payload.role - User role (user, admin, seller)
 * @returns {string} Refresh token
 */
const generateRefreshToken = payload => {
  // Ensure role is included in the refresh token payload
  const tokenPayload = {
    id: payload.id,
    email: payload.email,
    role: payload.role || 'user',
  };

  return jwt.sign(tokenPayload, config.jwtSecret || 'your-secret-key-change-in-production', {
    expiresIn: '7d',
  });
};

module.exports = {
  generateToken,
  verifyToken,
  generateRefreshToken,
};
