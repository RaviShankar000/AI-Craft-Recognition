import React from 'react';
import { useNotifications } from '../hooks/useNotifications';
import './NotificationCenter.css';

const NotificationCenter = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAll,
  } = useNotifications();

  const [isOpen, setIsOpen] = React.useState(false);

  const toggleCenter = () => {
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Handle navigation based on notification type
    if (notification.type === 'product_approved' || notification.type === 'product_rejected') {
      // Navigate to product details
      window.location.href = `/products/${notification.data.productId}`;
    } else if (notification.type === 'seller_approved') {
      // Navigate to seller dashboard
      window.location.href = '/seller/dashboard';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'product_approved':
      case 'seller_approved':
        return '✅';
      case 'product_rejected':
      case 'seller_rejected':
        return '❌';
      case 'order_status_update':
        return '📦';
      case 'low_stock_alert':
        return '⚠️';
      case 'system_announcement':
        return '📢';
      case 'admin_product_status':
      case 'admin_seller_status':
        return '📋';
      default:
        return '🔔';
    }
  };

  const getNotificationClass = (notification) => {
    const classes = ['notification-item'];
    if (!notification.read) classes.push('unread');
    if (notification.priority === 'high') classes.push('high-priority');
    return classes.join(' ');
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="notification-center">
      {/* Notification Bell Button */}
      <button className="notification-bell" onClick={toggleCenter}>
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <>
          <div className="notification-overlay" onClick={() => setIsOpen(false)} />
          <div className="notification-dropdown">
            {/* Header */}
            <div className="notification-header">
              <h3>Notifications</h3>
              {notifications.length > 0 && (
                <div className="notification-actions">
                  <button className="btn-text" onClick={markAllAsRead}>
                    Mark all read
                  </button>
                  <button className="btn-text" onClick={clearAll}>
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* Notification List */}
            <div className="notification-list">
              {notifications.length === 0 ? (
                <div className="notification-empty">
                  <span className="empty-icon">📭</span>
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={getNotificationClass(notification)}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-icon">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="notification-content">
                      <div className="notification-title">{notification.title}</div>
                      <div className="notification-message">{notification.message}</div>
                      <div className="notification-time">
                        {formatTimestamp(notification.createdAt)}
                      </div>
                    </div>
                    <button
                      className="notification-close"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearNotification(notification.id);
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;
