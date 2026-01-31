const { verifyToken } = require('../utils/tokenUtils');
const User = require('../models/User');

/**
 * Protect routes - Verify JWT token
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route. Please provide a valid token.',
        code: 'NO_TOKEN',
      });
    }

    // Verify token
    try {
      const decoded = verifyToken(token);
      console.log('[AUTH DEBUG] Token verified successfully:', {
        userId: decoded.id,
        email: decoded.email,
        role: decoded.role,
        timestamp: new Date().toISOString()
      });

      // Find user by id from token
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not found. Token is invalid.',
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Account is deactivated.',
        });
      }

      // Attach user information to request object for downstream use
      req.user = {
        id: user._id,
        email: user.email,
        name: user.name,
        role: decoded.role || user.role, // Use role from JWT token, fallback to user model
        isActive: user.isActive,
      };
      
      console.log('[AUTH DEBUG] User authenticated and attached to request:', {
        userId: req.user.id,
        email: req.user.email,
        role: req.user.role,
        route: req.originalUrl,
        method: req.method
      });
      
      next();
    } catch (error) {
      // Handle specific token errors
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: error.message,
          code: 'TOKEN_EXPIRED',
        });
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: error.message,
          code: 'INVALID_TOKEN',
        });
      }
      // Generic token error
      return res.status(401).json({
        success: false,
        error: 'Authentication failed. Please login again.',
        code: 'AUTH_FAILED',
      });
    }
  } catch {
    res.status(500).json({
      success: false,
      error: 'Server error during authentication.',
    });
  }
};

/**
 * Grant access to specific roles
 * @param  {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    console.log('[AUTH DEBUG] Authorization check initiated:', {
      userId: req.user?.id,
      userRole: req.user?.role,
      requiredRoles: roles,
      route: req.originalUrl,
      method: req.method
    });

    if (!req.user) {
      console.log('[AUTH DEBUG] Authorization failed: No user attached to request');
      const error = new Error('Not authenticated.');
      error.statusCode = 401;
      error.code = 'NOT_AUTHENTICATED';
      return next(error);
    }

    if (!roles.includes(req.user.role)) {
      console.log('[AUTH DEBUG] Authorization denied:', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        reason: 'User role not in allowed roles'
      });
      const error = new Error(`Access denied. User role '${req.user.role}' is not authorized to access this route.`);
      error.statusCode = 403;
      error.code = 'ROLE_AUTHORIZATION_FAILED';
      error.details = {
        userRole: req.user.role,
        requiredRoles: roles,
        route: req.originalUrl,
        method: req.method
      };
      return next(error);
    }

    console.log('[AUTH DEBUG] Authorization granted:', {
      userId: req.user.id,
      userRole: req.user.role,
      allowedRoles: roles
    });
    next();
  };
};

module.exports = {
  protect,
  authorize,
};
