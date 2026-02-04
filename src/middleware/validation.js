const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation Middleware
 * Uses express-validator for comprehensive input validation
 */

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      messages: errors.array().map(err => err.msg),
      fields: errors.array().map(err => ({ field: err.path, message: err.msg })),
    });
  }
  next();
};

/**
 * Registration validation rules
 */
const validateRegister = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be between 6 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),

  body('role')
    .optional()
    .custom(_value => {
      throw new Error(
        'Role cannot be specified during registration. Default role will be assigned.'
      );
    }),

  handleValidationErrors,
];

/**
 * Login validation rules
 */
const validateLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address'),

  body('password').notEmpty().withMessage('Password is required'),

  handleValidationErrors,
];

/**
 * User update validation rules
 */
const validateUserUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address'),

  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage('Phone number must be 10 digits'),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address cannot exceed 200 characters'),

  body('role')
    .optional()
    .custom(_value => {
      throw new Error('Role cannot be modified through this endpoint');
    }),

  handleValidationErrors,
];

/**
 * Password change validation rules
 */
const validatePasswordChange = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),

  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 6, max: 128 })
    .withMessage('New password must be between 6 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      'New password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),

  body('confirmPassword')
    .notEmpty()
    .withMessage('Password confirmation is required')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match');
      }
      return true;
    }),

  handleValidationErrors,
];

/**
 * Product creation validation rules
 */
const validateProduct = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Product name must be between 3 and 100 characters'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Product description is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),

  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),

  body('category').trim().notEmpty().withMessage('Category is required'),

  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),

  handleValidationErrors,
];

/**
 * Order validation rules
 */
const validateOrder = [
  body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),

  body('items.*.productId')
    .notEmpty()
    .withMessage('Product ID is required')
    .isMongoId()
    .withMessage('Invalid product ID'),

  body('items.*.quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),

  body('shippingAddress')
    .notEmpty()
    .withMessage('Shipping address is required')
    .isLength({ min: 10, max: 300 })
    .withMessage('Shipping address must be between 10 and 300 characters'),

  handleValidationErrors,
];

/**
 * MongoDB ObjectID validation
 */
const validateObjectId = [
  param('id').isMongoId().withMessage('Invalid ID format'),

  handleValidationErrors,
];

/**
 * Pagination validation
 */
const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  handleValidationErrors,
];

/**
 * Email validation
 */
const validateEmail = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address'),

  handleValidationErrors,
];

module.exports = {
  validateRegister,
  validateLogin,
  validateUserUpdate,
  validatePasswordChange,
  validateProduct,
  validateOrder,
  validateObjectId,
  validatePagination,
  validateEmail,
  handleValidationErrors,
};
