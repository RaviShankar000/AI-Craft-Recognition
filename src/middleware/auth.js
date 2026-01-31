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
      });
    }

    // Verify token
    try {
      const decoded = verifyToken(token);

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

      // Attach user to request object
      req.user = user;
      next();
    } catch {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token.',
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
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role '${req.user.role}' is not authorized to access this route.`,
      });
    }

    next();
  };
};

module.exports = {
  protect,
  authorize,
};
