const logger = require('../config/logger');

/**
 * Request Logging Middleware
 * Logs method, URL, userId, IP, and response time
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Get user ID if authenticated
  const userId = req.user?._id || req.user?.id || 'anonymous';
  const userRole = req.user?.role || 'guest';

  // Log incoming request
  logger.http(`${req.method} ${req.originalUrl}`, {
    userId,
    userRole,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
  });

  // Capture response
  const originalSend = res.send;
  let responseBody;

  res.send = function (data) {
    responseBody = data;
    originalSend.call(this, data);
  };

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    logger.logRequest(req, statusCode, duration);

    // Log slow requests (> 1 second)
    if (duration > 1000) {
      logger.warn(`SLOW REQUEST: ${req.method} ${req.originalUrl} took ${duration}ms`);
    }

    // Log errors
    if (statusCode >= 400 && responseBody) {
      try {
        const parsed = JSON.parse(responseBody);
        if (parsed.message || parsed.error) {
          logger.error('ERROR RESPONSE', {
            url: req.originalUrl,
            error: parsed.message || parsed.error,
            userId,
          });
        }
      } catch (e) {
        // Response body is not JSON
      }
    }
  });

  next();
};

/**
 * Enhanced request logger with detailed info
 */
const detailedRequestLogger = (req, res, next) => {
  const startTime = Date.now();
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Attach request ID to request object
  req.requestId = requestId;

  const logData = {
    requestId,
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    path: req.path,
    query: req.query,
    userId: req.user?._id || req.user?.id,
    userRole: req.user?.role,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    contentType: req.get('content-type'),
    origin: req.get('origin'),
  };

  // Log body for non-GET requests (excluding sensitive fields)
  if (req.method !== 'GET' && req.body) {
    const sanitizedBody = { ...req.body };
    // Remove sensitive fields
    delete sanitizedBody.password;
    delete sanitizedBody.token;
    delete sanitizedBody.secret;
    delete sanitizedBody.apiKey;
    
    logData.body = sanitizedBody;
  }

  console.log(`📥 REQUEST:`, logData);

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    logger.logRequest(req, res.statusCode, duration);
  });

  next();
};

/**
 * Skip logging for certain routes
 */
const skipLogging = (patterns = []) => {
  return (req, res, next) => {
    const shouldSkip = patterns.some((pattern) => {
      if (typeof pattern === 'string') {
        return req.originalUrl.includes(pattern);
      }
      if (pattern instanceof RegExp) {
        return pattern.test(req.originalUrl);
      }
      return false;
    });

    if (shouldSkip) {
      return next();
    }

    return requestLogger(req, res, next);
  };
};

module.exports = {
  requestLogger,
  detailedRequestLogger,
  skipLogging,
};
