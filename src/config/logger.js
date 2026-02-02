const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const config = require('../config/env');
const { maskSensitiveData } = require('../utils/maskSensitiveData');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`
  )
);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');

// Define transports
const transports = [];

// Console transport for all environments
transports.push(
  new winston.transports.Console({
    format: config.env === 'development' ? consoleFormat : logFormat,
  })
);

// File transports for production
if (config.env === 'production') {
  // Error logs - daily rotation
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',
      format: logFormat,
    })
  );

  // Combined logs - daily rotation
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: logFormat,
    })
  );

  // HTTP logs - daily rotation
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'http-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'http',
      maxSize: '20m',
      maxFiles: '7d',
      format: logFormat,
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: config.env === 'development' ? 'debug' : 'info',
  levels,
  format: logFormat,
  transports,
  exitOnError: false,
});

// Create stream for morgan integration
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

/**
 * Log HTTP requests
 */
logger.logRequest = (req, statusCode, duration) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    statusCode,
    duration: `${duration}ms`,
    userId: req.user?._id || 'anonymous',
    ip: req.ip,
  };

  if (statusCode >= 500) {
    logger.error('HTTP Request Failed', logData);
  } else if (statusCode >= 400) {
    logger.warn('HTTP Request Error', logData);
  } else {
    logger.http('HTTP Request', logData);
  }
};

/**
 * Log errors with context
 */
logger.logError = (error, req = null) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    statusCode: error.statusCode,
  };

  if (req) {
    errorData.request = maskSensitiveData({
      method: req.method,
      url: req.originalUrl,
      body: req.body,
      query: req.query,
      userId: req.user?._id,
      ip: req.ip,
    });
  }

  logger.error('Application Error', errorData);
};

/**
 * Log database operations
 */
logger.logDb = (operation, model, duration = null) => {
  const logData = { operation, model };
  if (duration) logData.duration = `${duration}ms`;

  logger.debug('Database Operation', logData);
};

/**
 * Log socket events
 */
logger.logSocket = (event, data = {}) => {
  logger.debug('Socket Event', {
    event,
    ...data,
  });
};

/**
 * Log security events
 */
logger.logSecurity = (event, data = {}) => {
  logger.warn('Security Event', {
    event,
    timestamp: new Date().toISOString(),
    ...data,
  });
};

module.exports = logger;
