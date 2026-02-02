const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const {
  getAuditLogs,
  getAuditLogById,
  getAuditLogStatistics,
  getUserAuditLogs,
  getRecentCriticalLogs,
} = require('../controllers/auditLogController');

/**
 * PROTECTED ROUTES - ADMIN ONLY
 * All audit log routes require admin authentication
 * Rate limited to prevent abuse
 */

// Apply admin-only protection to all routes
router.use(protect);
router.use(authorize('admin'));

/**
 * @route   GET /api/audit-logs/stats
 * @desc    Get audit log statistics
 * @access  Private/Admin
 * @ratelimit 100 requests per 15 minutes
 */
router.get('/stats', apiLimiter, getAuditLogStatistics);

/**
 * @route   GET /api/audit-logs/critical/recent
 * @desc    Get recent critical audit logs
 * @access  Private/Admin
 * @ratelimit 100 requests per 15 minutes
 */
router.get('/critical/recent', apiLimiter, getRecentCriticalLogs);

/**
 * @route   GET /api/audit-logs/user/:userId
 * @desc    Get audit logs for a specific user
 * @access  Private/Admin
 * @ratelimit 100 requests per 15 minutes
 */
router.get('/user/:userId', apiLimiter, getUserAuditLogs);

/**
 * @route   GET /api/audit-logs/:id
 * @desc    Get a specific audit log by ID
 * @access  Private/Admin
 * @ratelimit 100 requests per 15 minutes
 */
router.get('/:id', apiLimiter, getAuditLogById);

/**
 * @route   GET /api/audit-logs
 * @desc    Get all audit logs with filtering and pagination
 * @access  Private/Admin
 * @ratelimit 100 requests per 15 minutes
 */
router.get('/', apiLimiter, getAuditLogs);

module.exports = router;
