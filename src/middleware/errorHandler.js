const config = require('../config/env');
const logger = require('../config/logger');

/**
 * Format error response
 */
const formatErrorResponse = (err, req) => {
  const response = {
    success: false,
    status: err.status || 'error',
    message: err.message || 'Something went wrong',
  };

  if (err.code) response.code = err.code;
  if (err.errors) response.errors = err.errors;

  // Add details in development
  if (config.env === 'development') {
    response.stack = err.stack;
    response.request = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    };
  }

  return response;
};

/**
 * Handle specific error types
 */
const handleCastError = err => ({
  message: `Invalid ${err.path}: ${err.value}`,
  statusCode: 400,
  isOperational: true,
});

const handleDuplicateKeyError = err => {
  const field = Object.keys(err.keyValue || err.keyPattern || {})[0];
  const value = err.keyValue?.[field];
  return {
    message: `Duplicate field value: ${field} = "${value}". Please use another value.`,
    statusCode: 409,
    isOperational: true,
  };
};

const handleValidationError = err => {
  const errors = Object.values(err.errors).map(el => ({
    field: el.path,
    message: el.message,
  }));
  return {
    message: 'Invalid input data',
    statusCode: 400,
    errors,
    isOperational: true,
  };
};

const handleJWTError = () => ({
  message: 'Invalid token. Please log in again.',
  statusCode: 401,
  isOperational: true,
});

const handleJWTExpiredError = () => ({
  message: 'Your token has expired. Please log in again.',
  statusCode: 401,
  isOperational: true,
});

/**
 * Global Error Handling Middleware
 */
const errorHandler = (err, req, res, _next) => {
  const error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;
  error.status = err.status || 'error';
  error.isOperational = err.isOperational;

  // Role authorization error (preserve existing behavior)
  if (err.code === 'ROLE_AUTHORIZATION_FAILED') {
    return res.status(403).json({
      success: false,
      error: err.message,
      code: err.code,
      details: {
        userRole: err.details?.userRole,
        requiredRoles: err.details?.requiredRoles,
        route: err.details?.route,
        method: err.details?.method,
      },
    });
  }

  // Authentication error (preserve existing behavior)
  if (err.code === 'NOT_AUTHENTICATED') {
    return res.status(401).json({
      success: false,
      error: err.message,
      code: err.code,
    });
  }

  // Handle specific Mongoose/JWT errors
  if (err.name === 'CastError') {
    const castError = handleCastError(err);
    Object.assign(error, castError);
  }

  if (err.code === 11000) {
    const duplicateError = handleDuplicateKeyError(err);
    Object.assign(error, duplicateError);
  }

  if (err.name === 'ValidationError') {
    const validationError = handleValidationError(err);
    Object.assign(error, validationError);
  }

  if (err.name === 'JsonWebTokenError') {
    const jwtError = handleJWTError();
    Object.assign(error, jwtError);
  }

  if (err.name === 'TokenExpiredError') {
    const jwtExpiredError = handleJWTExpiredError();
    Object.assign(error, jwtExpiredError);
  }

  // Log error
  logger.logError(error, req);

  // Send response
  const response = formatErrorResponse(error, req);
  res.status(error.statusCode).json(response);
};

/**
 * Handle 404 Not Found
 */
const notFoundHandler = (req, res, next) => {
  const err = new Error(`Route not found: ${req.originalUrl}`);
  err.statusCode = 404;
  err.isOperational = true;
  next(err);
};

/**
 * Catch async errors wrapper
 */
const catchAsync = fn => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = { errorHandler, notFoundHandler, catchAsync };
