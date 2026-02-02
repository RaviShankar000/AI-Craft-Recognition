const AuditLog = require('../models/AuditLog');

/**
 * Audit Logging Utilities
 * Helper functions to log critical role-based actions
 */

/**
 * Create an audit log entry
 * @param {Object} params - Audit log parameters
 * @returns {Promise<Object|null>} Created audit log or null if failed
 */
const createAuditLog = async ({
  user, // User object from req.user
  action,
  category,
  severity = 'medium',
  description,
  targetResource = null,
  metadata = {},
  req = null,
  status = 'success',
  errorMessage = null,
}) => {
  try {
    const logData = {
      user: user._id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      action,
      category,
      severity,
      description,
      status,
      metadata,
    };

    // Add target resource if provided
    if (targetResource) {
      logData.targetResource = targetResource;
    }

    // Add request context if available
    if (req) {
      logData.ipAddress = req.ip || req.connection.remoteAddress;
      logData.userAgent = req.get('user-agent');
    }

    // Add error message if provided
    if (errorMessage) {
      logData.errorMessage = errorMessage;
    }

    return await AuditLog.log(logData);
  } catch (error) {
    console.error('[AUDIT UTIL ERROR] Failed to create audit log:', error);
    return null;
  }
};

/**
 * Log seller application approval
 */
const logSellerApplicationApproved = async (admin, application, req) => {
  return await createAuditLog({
    user: admin,
    action: 'seller_application_approved',
    category: 'seller_management',
    severity: 'high',
    description: `Approved seller application for ${application.businessName}`,
    targetResource: {
      type: 'SellerApplication',
      id: application._id,
      identifier: application.businessName,
    },
    metadata: {
      applicantId: application.user,
      businessName: application.businessName,
      reviewNote: application.reviewNote,
    },
    req,
  });
};

/**
 * Log seller application rejection
 */
const logSellerApplicationRejected = async (admin, application, req) => {
  return await createAuditLog({
    user: admin,
    action: 'seller_application_rejected',
    category: 'seller_management',
    severity: 'medium',
    description: `Rejected seller application for ${application.businessName}`,
    targetResource: {
      type: 'SellerApplication',
      id: application._id,
      identifier: application.businessName,
    },
    metadata: {
      applicantId: application.user,
      businessName: application.businessName,
      reviewNote: application.reviewNote,
    },
    req,
  });
};

/**
 * Log product creation
 */
const logProductCreated = async (user, product, req) => {
  return await createAuditLog({
    user,
    action: 'product_created',
    category: 'product_management',
    severity: user.role === 'admin' ? 'medium' : 'low',
    description: `Created product: ${product.name}`,
    targetResource: {
      type: 'Product',
      id: product._id,
      identifier: product.name,
    },
    metadata: {
      productName: product.name,
      price: product.price,
      stock: product.stock,
      moderationStatus: product.moderationStatus,
    },
    req,
  });
};

/**
 * Log product update
 */
const logProductUpdated = async (user, product, changes, req) => {
  return await createAuditLog({
    user,
    action: 'product_updated',
    category: 'product_management',
    severity: 'low',
    description: `Updated product: ${product.name}`,
    targetResource: {
      type: 'Product',
      id: product._id,
      identifier: product.name,
    },
    metadata: {
      productName: product.name,
      changes,
    },
    req,
  });
};

/**
 * Log product deletion
 */
const logProductDeleted = async (user, product, req) => {
  return await createAuditLog({
    user,
    action: 'product_deleted',
    category: 'product_management',
    severity: 'medium',
    description: `Deleted product: ${product.name}`,
    targetResource: {
      type: 'Product',
      id: product._id,
      identifier: product.name,
    },
    metadata: {
      productName: product.name,
      deletedBy: user.role,
    },
    req,
  });
};

/**
 * Log product moderation (approval/rejection)
 */
const logProductModerated = async (admin, product, action, reason, req) => {
  return await createAuditLog({
    user: admin,
    action: `product_${action}`,
    category: 'moderation',
    severity: 'high',
    description: `${action === 'approved' ? 'Approved' : 'Rejected'} product: ${product.name}`,
    targetResource: {
      type: 'Product',
      id: product._id,
      identifier: product.name,
    },
    metadata: {
      productName: product.name,
      moderationAction: action,
      reason,
      seller: product.seller,
    },
    req,
  });
};

/**
 * Log order status change
 */
const logOrderStatusChanged = async (user, order, oldStatus, newStatus, req) => {
  return await createAuditLog({
    user,
    action: 'order_status_changed',
    category: 'order_management',
    severity: 'medium',
    description: `Changed order ${order.orderNumber} status from ${oldStatus} to ${newStatus}`,
    targetResource: {
      type: 'Order',
      id: order._id,
      identifier: order.orderNumber,
    },
    metadata: {
      orderNumber: order.orderNumber,
      oldStatus,
      newStatus,
      totalAmount: order.totalAmount,
    },
    req,
  });
};

/**
 * Log user role change
 */
const logUserRoleChanged = async (admin, targetUser, oldRole, newRole, reason, req) => {
  return await createAuditLog({
    user: admin,
    action: 'user_role_changed',
    category: 'role_change',
    severity: 'critical',
    description: `Changed user ${targetUser.email} role from ${oldRole} to ${newRole}`,
    targetResource: {
      type: 'User',
      id: targetUser._id,
      identifier: targetUser.email,
    },
    metadata: {
      targetUserEmail: targetUser.email,
      oldRole,
      newRole,
      reason,
    },
    req,
  });
};

/**
 * Log user account status change
 */
const logUserAccountStatusChanged = async (
  admin,
  targetUser,
  oldStatus,
  newStatus,
  reason,
  req
) => {
  return await createAuditLog({
    user: admin,
    action: 'user_account_status_changed',
    category: 'user_management',
    severity: 'high',
    description: `Changed account status for ${targetUser.email} from ${oldStatus ? 'active' : 'inactive'} to ${newStatus ? 'active' : 'inactive'}`,
    targetResource: {
      type: 'User',
      id: targetUser._id,
      identifier: targetUser.email,
    },
    metadata: {
      targetUserEmail: targetUser.email,
      oldStatus,
      newStatus,
      reason,
    },
    req,
  });
};

/**
 * Log user deletion
 */
const logUserDeleted = async (admin, targetUser, reason, req) => {
  return await createAuditLog({
    user: admin,
    action: 'user_deleted',
    category: 'user_management',
    severity: 'critical',
    description: `Deleted user account: ${targetUser.email}`,
    targetResource: {
      type: 'User',
      id: targetUser._id,
      identifier: targetUser.email,
    },
    metadata: {
      targetUserEmail: targetUser.email,
      targetUserRole: targetUser.role,
      reason,
    },
    req,
  });
};

/**
 * Log failed action attempt
 */
const logFailedAction = async (user, action, category, description, errorMessage, req) => {
  return await createAuditLog({
    user,
    action,
    category,
    severity: 'medium',
    description,
    status: 'failure',
    errorMessage,
    req,
  });
};

module.exports = {
  createAuditLog,
  logSellerApplicationApproved,
  logSellerApplicationRejected,
  logProductCreated,
  logProductUpdated,
  logProductDeleted,
  logProductModerated,
  logOrderStatusChanged,
  logUserRoleChanged,
  logUserAccountStatusChanged,
  logUserDeleted,
  logFailedAction,
};
