const AuditLog = require('../models/AuditLog');
const { logger } = require('../utils/socketDebugLogger');

/**
 * Role-Based Socket Event Authorization
 * Restricts socket events based on user roles
 */

/**
 * Event-to-role mapping
 * Defines which roles can emit specific events
 */
const eventRoleMapping = {
  // Admin-only events
  'admin:broadcast': ['admin'],
  'admin:disconnect_user': ['admin'],
  'admin:stats': ['admin'],
  'admin:user_list': ['admin'],
  'admin:force_disconnect': ['admin'],
  'admin:moderate_product': ['admin'],
  'admin:moderate_seller': ['admin'],
  'admin:system_notification': ['admin'],

  // Seller events
  'seller:product_create': ['admin', 'seller'],
  'seller:product_update': ['admin', 'seller'],
  'seller:product_delete': ['admin', 'seller'],
  'seller:order_status_update': ['admin', 'seller'],
  'seller:inventory_update': ['admin', 'seller'],
  'seller:dashboard': ['admin', 'seller'],

  // User events (authenticated users)
  'user:profile_update': ['admin', 'seller', 'user'],
  'user:order_create': ['admin', 'seller', 'user'],
  'user:cart_update': ['admin', 'seller', 'user'],
  'user:wishlist_update': ['admin', 'seller', 'user'],

  // Chat events
  'chat:message': ['admin', 'seller', 'user'],
  'chat:typing': ['admin', 'seller', 'user'],
  'chat:read': ['admin', 'seller', 'user'],
  'chat:join_room': ['admin', 'seller', 'user'],
  'chat:leave_room': ['admin', 'seller', 'user'],

  // Notification events
  'notification:read': ['admin', 'seller', 'user'],
  'notification:dismiss': ['admin', 'seller', 'user'],

  // Public events (all authenticated users)
  'ping': ['admin', 'seller', 'user'],
  'disconnect_request': ['admin', 'seller', 'user'],
};

/**
 * Check if user has permission to emit an event
 * @param {String} eventName - Event name
 * @param {String} userRole - User's role
 * @returns {Boolean}
 */
const hasEventPermission = (eventName, userRole) => {
  // If event not in mapping, deny by default
  if (!eventRoleMapping[eventName]) {
    return false;
  }

  return eventRoleMapping[eventName].includes(userRole);
};

/**
 * Get allowed roles for an event
 * @param {String} eventName - Event name
 * @returns {Array}
 */
const getAllowedRoles = eventName => {
  return eventRoleMapping[eventName] || [];
};

/**
 * Middleware to authorize socket event based on role
 * @param {String} eventName - Event name
 * @returns {Function} Middleware function
 */
const authorizeEvent = eventName => {
  return (socket, args, callback) => {
    const { userId, userRole, userEmail } = socket;

    // Check if user has permission
    if (!hasEventPermission(eventName, userRole)) {
      const error = {
        code: 'UNAUTHORIZED',
        message: 'Insufficient permissions for this event',
        event: eventName,
        requiredRoles: getAllowedRoles(eventName),
        userRole,
      };

      console.warn('[SOCKET AUTHZ] Event blocked:', {
        event: eventName,
        userId,
        userRole,
        requiredRoles: getAllowedRoles(eventName),
        socketId: socket.id,
      });

      // Debug log authorization failure
      logger.auth(socket, eventName, false, getAllowedRoles(eventName));

      // Log unauthorized attempt
      AuditLog.log({
        userId,
        action: 'socket:unauthorized_event',
        category: 'security',
        severity: 'medium',
        metadata: {
          event: eventName,
          userRole,
          requiredRoles: getAllowedRoles(eventName),
          socketId: socket.id,
          userEmail,
        },
      }).catch(err => {
        console.error('[SOCKET AUTHZ] Failed to log unauthorized attempt:', err.message);
      });

      // Send error to client
      socket.emit('error:unauthorized', error);

      // Call callback with error if provided
      if (typeof callback === 'function') {
        callback(error);
      }

      return false;
    }

    // Permission granted
    console.log('[SOCKET AUTHZ] Event authorized:', {
      event: eventName,
      userId,
      userRole,
      socketId: socket.id,
    });

    // Debug log successful authorization
    logger.auth(socket, eventName, true, getAllowedRoles(eventName));

    return true;
  };
};

/**
 * Wrap event handler with authorization check
 * @param {String} eventName - Event name
 * @param {Function} handler - Original event handler
 * @returns {Function} Wrapped handler
 */
const withAuthorization = (eventName, handler) => {
  return function (socket, ...args) {
    // Check authorization
    const authorized = authorizeEvent(eventName)(socket, args);

    if (!authorized) {
      return; // Stop execution if not authorized
    }

    // Execute original handler
    return handler(socket, ...args);
  };
};

/**
 * Register authorized event handler
 * @param {Object} socket - Socket instance
 * @param {String} eventName - Event name
 * @param {Function} handler - Event handler
 */
const registerAuthorizedEvent = (socket, eventName, handler) => {
  socket.on(eventName, (...args) => {
    const callback = typeof args[args.length - 1] === 'function' ? args.pop() : null;
    const data = args[0];

    // Check authorization
    const authorized = authorizeEvent(eventName)(socket, [data], callback);

    if (!authorized) {
      return;
    }

    // Execute handler
    if (callback) {
      handler(data, callback);
    } else {
      handler(data);
    }
  });
};

/**
 * Bulk register multiple authorized events
 * @param {Object} socket - Socket instance
 * @param {Object} eventHandlers - Object with event names as keys and handlers as values
 */
const registerAuthorizedEvents = (socket, eventHandlers) => {
  Object.entries(eventHandlers).forEach(([eventName, handler]) => {
    registerAuthorizedEvent(socket, eventName, handler);
  });
};

/**
 * Check if event requires specific role
 * @param {String} eventName - Event name
 * @param {String} role - Role to check
 * @returns {Boolean}
 */
const eventRequiresRole = (eventName, role) => {
  const allowedRoles = getAllowedRoles(eventName);
  return allowedRoles.includes(role);
};

/**
 * Get all events available for a role
 * @param {String} role - User role
 * @returns {Array} Array of event names
 */
const getEventsForRole = role => {
  return Object.entries(eventRoleMapping)
    .filter(([_, roles]) => roles.includes(role))
    .map(([eventName]) => eventName);
};

/**
 * Add custom event role mapping
 * @param {String} eventName - Event name
 * @param {Array} roles - Allowed roles
 */
const addEventRoleMapping = (eventName, roles) => {
  if (!Array.isArray(roles)) {
    throw new Error('Roles must be an array');
  }

  const validRoles = ['admin', 'seller', 'user'];
  const invalidRoles = roles.filter(role => !validRoles.includes(role));

  if (invalidRoles.length > 0) {
    throw new Error(`Invalid roles: ${invalidRoles.join(', ')}`);
  }

  eventRoleMapping[eventName] = roles;
  console.log(`[SOCKET AUTHZ] Added event role mapping: ${eventName} -> [${roles.join(', ')}]`);
};

/**
 * Remove event role mapping
 * @param {String} eventName - Event name
 */
const removeEventRoleMapping = eventName => {
  if (eventRoleMapping[eventName]) {
    delete eventRoleMapping[eventName];
    console.log(`[SOCKET AUTHZ] Removed event role mapping: ${eventName}`);
  }
};

/**
 * Get all event-role mappings
 * @returns {Object}
 */
const getAllEventRoleMappings = () => {
  return { ...eventRoleMapping };
};

/**
 * Middleware to require specific role for all events in a namespace
 * @param {Array|String} roles - Required roles
 * @returns {Function}
 */
const requireRoleForNamespace = roles => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (socket, next) => {
    if (!allowedRoles.includes(socket.userRole)) {
      console.warn('[SOCKET AUTHZ] Namespace access denied:', {
        userId: socket.userId,
        userRole: socket.userRole,
        requiredRoles: allowedRoles,
        namespace: socket.nsp.name,
      });

      return next(new Error('Insufficient permissions for this namespace'));
    }

    console.log('[SOCKET AUTHZ] Namespace access granted:', {
      userId: socket.userId,
      userRole: socket.userRole,
      namespace: socket.nsp.name,
    });

    next();
  };
};

/**
 * Validate event data based on role
 * @param {Object} socket - Socket instance
 * @param {String} eventName - Event name
 * @param {Object} data - Event data
 * @returns {Object} Validation result
 */
const validateEventData = (socket, eventName, data) => {
  const { userRole, userId } = socket;

  // Role-specific validation rules
  const validationRules = {
    'seller:product_create': {
      seller: {
        required: ['name', 'price', 'description'],
        maxPrice: 10000,
      },
      admin: {
        required: ['name', 'price', 'description'],
        maxPrice: null, // No limit for admin
      },
    },
    'seller:order_status_update': {
      seller: {
        required: ['orderId', 'status'],
        allowedStatuses: ['processing', 'shipped', 'delivered'],
      },
      admin: {
        required: ['orderId', 'status'],
        allowedStatuses: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      },
    },
    'admin:force_disconnect': {
      admin: {
        required: ['userId', 'reason'],
        cannotDisconnectSelf: true,
      },
    },
  };

  const rules = validationRules[eventName]?.[userRole];

  if (!rules) {
    return { valid: true }; // No specific rules, allow
  }

  // Check required fields
  if (rules.required) {
    for (const field of rules.required) {
      if (!(field in data)) {
        return {
          valid: false,
          error: `Missing required field: ${field}`,
        };
      }
    }
  }

  // Role-specific validations
  if (rules.maxPrice !== undefined && data.price > rules.maxPrice) {
    return {
      valid: false,
      error: `Price exceeds maximum allowed for ${userRole}: ${rules.maxPrice}`,
    };
  }

  if (rules.allowedStatuses && !rules.allowedStatuses.includes(data.status)) {
    return {
      valid: false,
      error: `Status '${data.status}' not allowed for ${userRole}. Allowed: ${rules.allowedStatuses.join(', ')}`,
    };
  }

  if (rules.cannotDisconnectSelf && data.userId === userId) {
    return {
      valid: false,
      error: 'Cannot disconnect yourself',
    };
  }

  return { valid: true };
};

/**
 * Enhanced event registration with authorization and validation
 * @param {Object} socket - Socket instance
 * @param {String} eventName - Event name
 * @param {Function} handler - Event handler
 * @param {Object} options - Options (validate, transform, etc.)
 */
const registerSecureEvent = (socket, eventName, handler, options = {}) => {
  socket.on(eventName, async (data, callback) => {
    try {
      // 1. Check authorization
      const authorized = authorizeEvent(eventName)(socket, [data], callback);
      if (!authorized) {
        return;
      }

      // 2. Validate data if enabled
      if (options.validate !== false) {
        const validation = validateEventData(socket, eventName, data);
        if (!validation.valid) {
          const error = {
            code: 'VALIDATION_ERROR',
            message: validation.error,
            event: eventName,
          };

          console.warn('[SOCKET AUTHZ] Validation failed:', {
            event: eventName,
            userId: socket.userId,
            error: validation.error,
          });

          // Debug log validation failure
          logger.validation(socket, eventName, false, validation.error);

          socket.emit('error:validation', error);
          if (typeof callback === 'function') {
            callback(error);
          }
          return;
        }
      }

      // 3. Transform data if transformer provided
      const transformedData = options.transform ? options.transform(data, socket) : data;

      // 4. Execute handler
      await handler(transformedData, callback);

      // Debug log successful validation
      if (options.validate !== false) {
        logger.validation(socket, eventName, true);
      }
    } catch (error) {
      console.error(`[SOCKET AUTHZ] Error handling event ${eventName}:`, error);
      
      // Debug log error
      logger.error(socket, eventName, error);
      
      socket.emit('error:internal', {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred processing your request',
        event: eventName,
      });

      if (typeof callback === 'function') {
        callback({
          code: 'INTERNAL_ERROR',
          message: 'An error occurred',
        });
      }
    }
  });
};

module.exports = {
  // Core authorization
  authorizeEvent,
  withAuthorization,
  hasEventPermission,
  getAllowedRoles,

  // Event registration
  registerAuthorizedEvent,
  registerAuthorizedEvents,
  registerSecureEvent,

  // Role checks
  eventRequiresRole,
  getEventsForRole,

  // Mapping management
  addEventRoleMapping,
  removeEventRoleMapping,
  getAllEventRoleMappings,

  // Namespace authorization
  requireRoleForNamespace,

  // Data validation
  validateEventData,
};
