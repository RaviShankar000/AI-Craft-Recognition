const config = require('./env');
const logger = require('./logger');

/**
 * CORS Configuration
 * Implements strict CORS policy with environment-based allowed origins
 */

/**
 * Allowed origins based on environment
 */
const getAllowedOrigins = () => {
  const env = config.nodeEnv;

  // Production: only specific domains
  if (env === 'production') {
    return (
      config.corsOrigins || [
        'https://your-production-domain.com',
        'https://www.your-production-domain.com',
      ]
    );
  }

  // Development: local origins
  if (env === 'development') {
    return [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
    ];
  }

  // Test: any origin
  if (env === 'test') {
    return ['*'];
  }

  // Default fallback
  return config.corsOrigins || ['http://localhost:5173'];
};

/**
 * CORS options configuration
 */
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is in whitelist
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Log blocked CORS request
      logger.logSecurity('cors_request_blocked', {
        origin: origin,
        allowedOrigins: allowedOrigins,
        environment: config.nodeEnv,
      });

      callback(new Error(`Origin ${origin} is not allowed by CORS policy`));
    }
  },

  // Allowed HTTP methods
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  // Allowed headers
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'X-File-Name',
  ],

  // Headers exposed to the client
  exposedHeaders: [
    'Content-Range',
    'X-Content-Range',
    'X-Total-Count',
    'RateLimit-Limit',
    'RateLimit-Remaining',
    'RateLimit-Reset',
  ],

  // Allow credentials (cookies, authorization headers)
  credentials: true,

  // Cache preflight requests for 1 hour
  maxAge: 3600,

  // Pass the CORS preflight response to the next handler
  preflightContinue: false,

  // Provide a status code to use for successful OPTIONS requests
  optionsSuccessStatus: 204,
};

/**
 * CORS error handler
 */
const handleCORSError = (err, req, res, next) => {
  if (err.message && err.message.includes('CORS policy')) {
    logger.logSecurity('cors_error', {
      origin: req.get('origin'),
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.status(403).json({
      success: false,
      error: 'CORS policy violation',
      message: 'Your origin is not allowed to access this resource',
    });
  }
  next(err);
};

/**
 * Log CORS requests for monitoring
 */
const logCORSRequest = (req, res, next) => {
  const origin = req.get('origin');
  if (origin && req.method === 'OPTIONS') {
    logger.info('CORS preflight request', {
      origin: origin,
      method: req.get('access-control-request-method'),
      headers: req.get('access-control-request-headers'),
      path: req.path,
    });
  }
  next();
};

module.exports = {
  corsOptions,
  handleCORSError,
  logCORSRequest,
  getAllowedOrigins,
};
