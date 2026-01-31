/**
 * ============================================================================
 * AUTHENTICATION & AUTHORIZATION MIDDLEWARE
 * ============================================================================
 * 
 * This module provides role-based access control (RBAC) for the application.
 * It consists of two main middleware functions:
 * 
 * 1. protect - Verifies JWT token and attaches user to request
 * 2. authorize - Restricts access based on user roles
 * 
 * ROLE HIERARCHY:
 * ---------------
 * - 'user': Default role for registered users (basic access)
 * - 'seller': Marketplace vendors (can list products)
 * - 'admin': Full system access (user management, content moderation)
 * 
 * HOW IT WORKS:
 * -------------
 * 1. User logs in and receives a JWT token containing their role
 * 2. protect middleware verifies token and attaches user info to req.user
 * 3. authorize middleware checks if user's role is in allowed roles list
 * 4. If authorized, request proceeds; otherwise, 403 error is returned
 * 
 * USAGE EXAMPLES:
 * ---------------
 * // Public route (no middleware)
 * router.get('/products', getAllProducts);
 * 
 * // Protected route (authenticated users only)
 * router.get('/profile', protect, getProfile);
 * 
 * // Role-restricted route (specific roles only)
 * router.delete('/users/:id', protect, authorize('admin'), deleteUser);
 * router.post('/products', protect, authorize('seller', 'admin'), createProduct);
 * 
 * EXTENDING ROLES:
 * ----------------
 * To add new roles to the system:
 * 
 * 1. Update User Model (src/models/User.js):
 *    role: {
 *      type: String,
 *      enum: ['user', 'admin', 'seller', 'YOUR_NEW_ROLE'],
 *      default: 'user',
 *    }
 * 
 * 2. Use the new role in route definitions:
 *    router.post('/some-route', protect, authorize('YOUR_NEW_ROLE'), handler);
 * 
 * 3. Assign the role when creating/updating users:
 *    const user = await User.create({ 
 *      name, email, password, 
 *      role: 'YOUR_NEW_ROLE' 
 *    });
 * 
 * 4. No changes needed to this middleware - it dynamically handles any role!
 * 
 * DEBUGGING:
 * ----------
 * All auth operations are logged with [AUTH DEBUG] prefix for troubleshooting.
 * Monitor console logs to track authentication and authorization flow.
 * 
 * ERROR HANDLING:
 * ---------------
 * Errors are passed to the global error handler (src/middleware/errorHandler.js)
 * with specific error codes:
 * - NOT_AUTHENTICATED: User not logged in
 * - ROLE_AUTHORIZATION_FAILED: User lacks required role
 * ============================================================================
 */

const { verifyToken } = require('../utils/tokenUtils');
const User = require('../models/User');

/**
 * PROTECT MIDDLEWARE
 * ===================
 * Verifies JWT token and attaches authenticated user to request object.
 * Must be applied before any route that requires authentication.
 * 
 * @middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * 
 * @description
 * - Extracts JWT token from Authorization header (Bearer token)
 * - Verifies token signature and expiration
 * - Fetches user from database using token payload
 * - Checks if user account is active
 * - Attaches user info to req.user for downstream use
 * 
 * @returns {void} Calls next() on success, returns error response on failure
 * 
 * @example
 * // Apply to single route
 * router.get('/dashboard', protect, getDashboard);
 * 
 * // Apply to all routes in a router
 * router.use(protect);
 * router.get('/orders', getOrders);
 * router.post('/orders', createOrder);
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
 * AUTHORIZE MIDDLEWARE
 * ====================
 * Higher-order function that creates middleware to restrict access based on user roles.
 * Must be used AFTER protect middleware (requires req.user to be set).
 * 
 * @function
 * @param {...string} roles - Variable number of role strings that are allowed access
 * @returns {Function} Express middleware function that checks user authorization
 * 
 * @description
 * This is a middleware factory that returns a middleware function configured
 * with specific allowed roles. It checks if the authenticated user's role
 * matches any of the allowed roles.
 * 
 * FLOW:
 * 1. Check if user is authenticated (req.user exists)
 * 2. Check if user's role is in the allowed roles list
 * 3. Grant access if role matches, deny with 403 if not
 * 4. Pass detailed error info to global error handler
 * 
 * @example
 * // Single role restriction
 * router.delete('/users/:id', protect, authorize('admin'), deleteUser);
 * 
 * // Multiple roles allowed (OR logic)
 * router.post('/products', protect, authorize('seller', 'admin'), createProduct);
 * 
 * // Complex role chain
 * router.patch('/orders/:id', 
 *   protect,                              // Step 1: Authenticate
 *   authorize('admin', 'order_manager'),  // Step 2: Authorize
 *   updateOrderStatus                     // Step 3: Execute
 * );
 * 
 * BEST PRACTICES:
 * - Always use protect before authorize
 * - List roles from most to least restrictive for readability
 * - Document why each role has access in route comments
 * - Consider creating role constants to avoid typos:
 *   const ROLES = { ADMIN: 'admin', SELLER: 'seller', USER: 'user' };
 *   router.post('/route', protect, authorize(ROLES.ADMIN), handler);
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

/**
 * EXPORTS
 * =======
 * Export both middleware functions for use in route definitions.
 * 
 * @exports protect - Authentication middleware (verifies JWT)
 * @exports authorize - Authorization middleware factory (checks roles)
 * 
 * @example Import and use in routes:
 * const { protect, authorize } = require('../middleware/auth');
 * 
 * // Public route - no middleware
 * router.get('/public', publicHandler);
 * 
 * // Authenticated route - protect only
 * router.get('/profile', protect, profileHandler);
 * 
 * // Role-restricted route - protect + authorize
 * router.delete('/admin', protect, authorize('admin'), adminHandler);
 */
module.exports = {
  protect,
  authorize,
};
