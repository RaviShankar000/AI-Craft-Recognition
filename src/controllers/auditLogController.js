const AuditLog = require('../models/AuditLog');

/**
 * Get all audit logs (with filtering and pagination)
 * @route GET /api/audit-logs
 * @access Private/Admin
 */
const getAuditLogs = async (req, res) => {
  try {
    const {
      userId,
      category,
      action,
      severity,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;

    const result = await AuditLog.getLogs({
      userId,
      category,
      action,
      severity,
      startDate,
      endDate,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    res.status(200).json({
      success: true,
      message: 'Audit logs retrieved successfully',
      data: result.logs,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('[AUDIT LOGS ERROR]', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve audit logs',
      message: error.message,
    });
  }
};

/**
 * Get audit log by ID
 * @route GET /api/audit-logs/:id
 * @access Private/Admin
 */
const getAuditLogById = async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id).populate('user', 'name email role');

    if (!log) {
      return res.status(404).json({
        success: false,
        error: 'Audit log not found',
      });
    }

    res.status(200).json({
      success: true,
      data: log,
    });
  } catch (error) {
    console.error('[AUDIT LOG ERROR]', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve audit log',
      message: error.message,
    });
  }
};

/**
 * Get audit log statistics
 * @route GET /api/audit-logs/stats
 * @access Private/Admin
 */
const getAuditLogStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await AuditLog.getStatistics({
      startDate,
      endDate,
    });

    res.status(200).json({
      success: true,
      message: 'Audit log statistics retrieved successfully',
      data: stats,
    });
  } catch (error) {
    console.error('[AUDIT STATS ERROR]', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve audit log statistics',
      message: error.message,
    });
  }
};

/**
 * Get audit logs for a specific user
 * @route GET /api/audit-logs/user/:userId
 * @access Private/Admin
 */
const getUserAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const result = await AuditLog.getLogs({
      userId: req.params.userId,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    res.status(200).json({
      success: true,
      message: 'User audit logs retrieved successfully',
      data: result.logs,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('[USER AUDIT LOGS ERROR]', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user audit logs',
      message: error.message,
    });
  }
};

/**
 * Get recent critical audit logs
 * @route GET /api/audit-logs/critical/recent
 * @access Private/Admin
 */
const getRecentCriticalLogs = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const logs = await AuditLog.find({ severity: { $in: ['high', 'critical'] } })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('user', 'name email role')
      .lean();

    res.status(200).json({
      success: true,
      message: 'Recent critical logs retrieved successfully',
      data: logs,
    });
  } catch (error) {
    console.error('[CRITICAL LOGS ERROR]', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve critical logs',
      message: error.message,
    });
  }
};

module.exports = {
  getAuditLogs,
  getAuditLogById,
  getAuditLogStatistics,
  getUserAuditLogs,
  getRecentCriticalLogs,
};
