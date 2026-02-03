const { getIO } = require('../config/socket');

/**
 * Notification Service - Handle real-time notifications
 */
class NotificationService {
  /**
   * Send a notification to a specific user
   * @param {String} userId - Target user ID
   * @param {Object} notification - Notification data
   */
  static sendToUser(userId, notification) {
    try {
      const io = getIO();
      io.to(userId).emit('notification', {
        ...notification,
        timestamp: new Date().toISOString(),
      });
      console.log(`[NOTIFICATION] Sent to user ${userId}:`, notification.type);
    } catch (error) {
      console.error('[NOTIFICATION] Failed to send to user:', error.message);
    }
  }

  /**
   * Send notification to all admins
   * @param {Object} notification - Notification data
   */
  static sendToAdmins(notification) {
    try {
      const io = getIO();
      io.to('role:admin').emit('notification', {
        ...notification,
        timestamp: new Date().toISOString(),
      });
      console.log('[NOTIFICATION] Sent to admins:', notification.type);
    } catch (error) {
      console.error('[NOTIFICATION] Failed to send to admins:', error.message);
    }
  }

  /**
   * Send product moderation notification to seller
   * @param {String} userId - Seller user ID
   * @param {Object} productData - Product data
   * @param {String} status - approved or rejected
   * @param {String} note - Moderator note
   */
  static notifyProductModeration(userId, productData, status, note) {
    const notification = {
      type: `product_${status}`,
      title: status === 'approved' ? '✅ Product Approved' : '❌ Product Rejected',
      message:
        status === 'approved'
          ? `Your product "${productData.name}" has been approved and is now live!`
          : `Your product "${productData.name}" was rejected. ${note}`,
      data: {
        productId: productData._id,
        productName: productData.name,
        status,
        note: note || null,
      },
      priority: status === 'rejected' ? 'high' : 'normal',
    };

    this.sendToUser(userId, notification);
  }

  /**
   * Send seller application notification
   * @param {String} userId - Applicant user ID
   * @param {String} status - approved or rejected
   * @param {String} note - Moderator note
   */
  static notifySellerApplication(userId, status, note) {
    const notification = {
      type: `seller_application_${status}`,
      title:
        status === 'approved' ? '🎉 Seller Application Approved' : '❌ Seller Application Rejected',
      message:
        status === 'approved'
          ? 'Congratulations! Your seller application has been approved. You can now start selling products.'
          : `Your seller application was rejected. ${note}`,
      data: {
        status,
        note: note || null,
      },
      priority: 'high',
    };

    this.sendToUser(userId, notification);
  }

  /**
   * Send order status notification
   * @param {String} userId - User ID
   * @param {Object} orderData - Order data
   * @param {String} status - Order status
   */
  static notifyOrderStatus(userId, orderData, status) {
    const statusMessages = {
      confirmed: 'Your order has been confirmed and is being processed.',
      shipped: 'Your order has been shipped and is on its way!',
      delivered: 'Your order has been delivered. Enjoy your purchase!',
      cancelled: 'Your order has been cancelled.',
    };

    const notification = {
      type: 'order_status_update',
      title: `📦 Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: statusMessages[status] || `Your order status: ${status}`,
      data: {
        orderId: orderData._id,
        orderNumber: orderData.orderNumber,
        status,
      },
      priority: 'normal',
    };

    this.sendToUser(userId, notification);
  }

  /**
   * Send low stock alert to seller
   * @param {String} sellerId - Seller user ID
   * @param {Object} productData - Product data
   */
  static notifyLowStock(sellerId, productData) {
    const notification = {
      type: 'low_stock_alert',
      title: '⚠️ Low Stock Alert',
      message: `Your product "${productData.name}" is running low on stock (${productData.stock} remaining).`,
      data: {
        productId: productData._id,
        productName: productData.name,
        currentStock: productData.stock,
      },
      priority: 'high',
    };

    this.sendToUser(sellerId, notification);
  }

  /**
   * Send system notification to all users
   * @param {String} message - Notification message
   * @param {String} priority - Notification priority
   */
  static broadcastSystemNotification(message, priority = 'normal') {
    try {
      const io = getIO();
      const notification = {
        type: 'system_announcement',
        title: '📢 System Announcement',
        message,
        priority,
        timestamp: new Date().toISOString(),
      };

      io.emit('notification', notification);
      console.log('[NOTIFICATION] Broadcasted system notification');
    } catch (error) {
      console.error('[NOTIFICATION] Failed to broadcast:', error.message);
    }
  }
}

module.exports = NotificationService;
