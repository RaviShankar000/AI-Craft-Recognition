const mongoose = require('mongoose');

/**
 * AuditLog Model
 * Tracks critical actions performed by admins and sellers for security and compliance
 */
const auditLogSchema = new mongoose.Schema(
  {
    // Who performed the action
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    userRole: {
      type: String,
      enum: ['user', 'admin', 'seller'],
      required: true,
      index: true,
    },

    // What action was performed
    action: {
      type: String,
      required: true,
      index: true,
      // Examples: 'seller_application_approved', 'product_created', 'product_moderated', etc.
    },
    category: {
      type: String,
      required: true,
      enum: [
        'seller_management',
        'product_management',
        'order_management',
        'user_management',
        'role_change',
        'moderation',
        'system',
      ],
      index: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true,
    },

    // Details about the action
    description: {
      type: String,
      required: true,
    },

    // Target of the action (if applicable)
    targetResource: {
      type: {
        type: String,
        enum: ['User', 'Product', 'Order', 'SellerApplication', 'Craft', 'Other'],
      },
      id: mongoose.Schema.Types.ObjectId,
      identifier: String, // Human-readable identifier (email, product name, order number, etc.)
    },

    // Additional context
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Request context
    ipAddress: String,
    userAgent: String,

    // Status of the action
    status: {
      type: String,
      enum: ['success', 'failure', 'pending'],
      default: 'success',
    },

    // Error details if action failed
    errorMessage: String,
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ category: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ severity: 1, createdAt: -1 });

// Static method to create audit log
auditLogSchema.statics.log = async function (logData) {
  try {
    const log = await this.create(logData);
    console.log(`[AUDIT LOG] ${logData.category} - ${logData.action}:`, {
      user: logData.userEmail,
      role: logData.userRole,
      severity: logData.severity,
      target: logData.targetResource?.identifier,
    });
    return log;
  } catch (error) {
    console.error('[AUDIT LOG ERROR] Failed to create audit log:', error);
    // Don't throw - we don't want audit logging failures to break the main operation
    return null;
  }
};

// Static method to get logs with filters
auditLogSchema.statics.getLogs = async function (filters = {}) {
  const { userId, category, action, severity, startDate, endDate, page = 1, limit = 50 } = filters;

  const query = {};

  if (userId) query.user = userId;
  if (category) query.category = category;
  if (action) query.action = action;
  if (severity) query.severity = severity;

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    this.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email role')
      .lean(),
    this.countDocuments(query),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

// Static method to get statistics
auditLogSchema.statics.getStatistics = async function (filters = {}) {
  const { startDate, endDate } = filters;

  const matchStage = {};
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }

  const stats = await this.aggregate([
    ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
    {
      $facet: {
        byCategory: [{ $group: { _id: '$category', count: { $sum: 1 } } }],
        bySeverity: [{ $group: { _id: '$severity', count: { $sum: 1 } } }],
        byRole: [{ $group: { _id: '$userRole', count: { $sum: 1 } } }],
        byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
        total: [{ $count: 'count' }],
      },
    },
  ]);

  return {
    total: stats[0].total[0]?.count || 0,
    byCategory: stats[0].byCategory.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    bySeverity: stats[0].bySeverity.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    byRole: stats[0].byRole.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    byStatus: stats[0].byStatus.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
  };
};

// Indexes for audit log queries
auditLogSchema.index({ user: 1, createdAt: -1 }); // User activity
auditLogSchema.index({ action: 1, createdAt: -1 }); // Actions by date
auditLogSchema.index({ category: 1, createdAt: -1 }); // Category filtering
auditLogSchema.index({ userRole: 1, action: 1 }); // Role-based actions
auditLogSchema.index({ createdAt: -1 }); // Recent logs
auditLogSchema.index({ severity: 1, createdAt: -1 }); // Severity filtering

module.exports = mongoose.model('AuditLog', auditLogSchema);
