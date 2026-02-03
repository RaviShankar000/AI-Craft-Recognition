const mongoSanitize = require('express-mongo-sanitize');
const logger = require('../config/logger');

/**
 * Input Sanitization Middleware
 * Prevents NoSQL injection attacks by removing prohibited characters
 */

/**
 * MongoDB injection sanitizer
 * Removes $ and . from user input to prevent query injection
 */
const sanitizeMongoInput = mongoSanitize({
  replaceWith: '_', // Replace prohibited characters with underscore
  onSanitize: ({ req, key }) => {
    logger.logSecurity('nosql_injection_attempt_blocked', {
      ip: req.ip,
      path: req.path,
      key: key,
      userAgent: req.get('user-agent'),
      userId: req.user?.id || 'anonymous'
    });
  }
});

/**
 * Additional XSS and injection sanitizer
 * Sanitizes potentially dangerous characters from strings
 */
const sanitizeInput = (req, res, next) => {
  // List of dangerous patterns to detect
  const dangerousPatterns = [
    /<script[^>]*>[\s\S]*?<\/script>/gi, // Script tags
    /javascript:/gi, // JavaScript protocol
    /on\w+\s*=/gi, // Event handlers
    /<iframe/gi, // Iframes
    /eval\s*\(/gi, // eval() calls
    /expression\s*\(/gi, // CSS expressions
  ];

  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    
    // Check for dangerous patterns
    for (const pattern of dangerousPatterns) {
      if (pattern.test(str)) {
        logger.logSecurity('xss_attempt_blocked', {
          ip: req.ip,
          path: req.path,
          pattern: pattern.toString(),
          userAgent: req.get('user-agent'),
          userId: req.user?.id || 'anonymous'
        });
        // Replace dangerous content
        str = str.replace(pattern, '');
      }
    }
    
    return str;
  };

  const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeObject(item));
    }
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  };

  // Sanitize body, query, and params
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

/**
 * SQL Injection pattern detector (for cases where SQL might be used)
 * Logs suspicious patterns but doesn't block (since we use MongoDB)
 */
const detectSQLInjection = (req, res, next) => {
  const sqlPatterns = [
    /(\bOR\b|\bAND\b)\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?/gi,
    /UNION\s+SELECT/gi,
    /DROP\s+TABLE/gi,
    /INSERT\s+INTO/gi,
    /DELETE\s+FROM/gi,
    /UPDATE\s+\w+\s+SET/gi,
    /--\s*$/gm, // SQL comments
    /\/\*[\s\S]*?\*\//g, // Multi-line comments
  ];

  const checkForSQL = (obj, path = '') => {
    if (typeof obj === 'string') {
      for (const pattern of sqlPatterns) {
        if (pattern.test(obj)) {
          logger.logSecurity('sql_injection_pattern_detected', {
            ip: req.ip,
            path: req.path,
            field: path,
            pattern: pattern.toString(),
            userAgent: req.get('user-agent'),
            userId: req.user?.id || 'anonymous'
          });
        }
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        checkForSQL(value, path ? `${path}.${key}` : key);
      }
    }
  };

  if (req.body) checkForSQL(req.body, 'body');
  if (req.query) checkForSQL(req.query, 'query');
  if (req.params) checkForSQL(req.params, 'params');

  next();
};

/**
 * Combined sanitization middleware
 * Apply all sanitization in correct order
 */
const sanitizeAll = [
  sanitizeMongoInput,
  sanitizeInput,
  detectSQLInjection
];

module.exports = {
  sanitizeMongoInput,
  sanitizeInput,
  detectSQLInjection,
  sanitizeAll
};
