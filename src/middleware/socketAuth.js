const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');

/**
 * Socket.IO Authentication Middleware
 * Verifies JWT token and attaches user data to socket
 */

/**
 * Authenticate socket connection using JWT
 * @param {Object} socket - Socket.IO socket instance
 * @param {Function} next - Next middleware function
 */
const authenticateSocket = async (socket, next) => {
  try {
    // Get token from handshake auth or query
    const token =
      socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      console.log('[SOCKET AUTH] Connection rejected: No token provided');
      return next(new Error('Authentication token required'));
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret);

    // Get user from database
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      console.log('[SOCKET AUTH] Connection rejected: User not found');
      return next(new Error('User not found'));
    }

    // Check if user is active
    if (!user.isActive) {
      console.log('[SOCKET AUTH] Connection rejected: User account is inactive');
      return next(new Error('User account is inactive'));
    }

    // Attach user data to socket
    socket.userId = user._id.toString();
    socket.userEmail = user.email;
    socket.userName = user.name;
    socket.userRole = user.role;

    console.log('[SOCKET AUTH] Connection authenticated:', {
      userId: socket.userId,
      email: socket.userEmail,
      role: socket.userRole,
      socketId: socket.id,
    });

    next();
  } catch (error) {
    console.error('[SOCKET AUTH] Authentication error:', error.message);

    if (error.name === 'JsonWebTokenError') {
      return next(new Error('Invalid authentication token'));
    }

    if (error.name === 'TokenExpiredError') {
      return next(new Error('Authentication token expired'));
    }

    return next(new Error('Authentication failed'));
  }
};

/**
 * Optional socket authentication (doesn't reject unauthenticated connections)
 * Useful for public rooms that want to identify authenticated users
 */
const optionalSocketAuth = async (socket, next) => {
  try {
    const token =
      socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      // No token - mark as guest
      socket.userId = null;
      socket.userRole = 'guest';
      socket.isAuthenticated = false;
      console.log('[SOCKET AUTH] Guest connection:', socket.id);
      return next();
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(decoded.id).select('-password');

    if (user && user.isActive) {
      socket.userId = user._id.toString();
      socket.userEmail = user.email;
      socket.userName = user.name;
      socket.userRole = user.role;
      socket.isAuthenticated = true;

      console.log('[SOCKET AUTH] Authenticated connection:', {
        userId: socket.userId,
        email: socket.userEmail,
        role: socket.userRole,
      });
    } else {
      socket.userId = null;
      socket.userRole = 'guest';
      socket.isAuthenticated = false;
    }

    next();
  } catch (error) {
    // Authentication failed, but continue as guest
    socket.userId = null;
    socket.userRole = 'guest';
    socket.isAuthenticated = false;
    console.log('[SOCKET AUTH] Guest connection (auth failed):', socket.id);
    next();
  }
};

/**
 * Check if socket user has required role
 * @param {Object} socket - Socket instance
 * @param {Array|String} roles - Required role(s)
 * @returns {Boolean}
 */
const hasRole = (socket, roles) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  return allowedRoles.includes(socket.userRole);
};

/**
 * Middleware to check role before allowing event
 * @param {Array|String} roles - Required role(s)
 */
const requireRole = roles => {
  return (socket, next) => {
    if (!hasRole(socket, roles)) {
      console.log('[SOCKET AUTH] Role authorization failed:', {
        userId: socket.userId,
        userRole: socket.userRole,
        requiredRoles: roles,
      });
      return next(new Error('Insufficient permissions'));
    }
    next();
  };
};

module.exports = {
  authenticateSocket,
  optionalSocketAuth,
  hasRole,
  requireRole,
};
