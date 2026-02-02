import { useEffect, useState, useCallback, useContext } from 'react';
import { SocketContext } from '../context/SocketContext';
import { useToast } from '../components/ToastProvider';
import { usePollingFallback } from './usePollingFallback';

/**
 * Custom hook to handle real-time notifications
 */
export const useNotifications = () => {
  const { socket } = useContext(SocketContext);
  const toast = useToast();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Add a new notification
  const addNotification = useCallback((notification) => {
    const notificationWithId = {
      ...notification,
      id: Date.now() + Math.random(),
      read: false,
      createdAt: new Date().toISOString(),
    };

    setNotifications((prev) => [notificationWithId, ...prev].slice(0, 50)); // Keep last 50
    setUnreadCount((prev) => prev + 1);

    // Show toast notification
    const toastType = notification.type?.includes('approved') ? 'success' : 
                     notification.type?.includes('rejected') ? 'error' : 
                     notification.priority === 'high' ? 'warning' : 'info';
    
    toast[toastType](notification.message, 7000);

    // Play notification sound (optional)
    playNotificationSound();

    // Show browser notification if permitted
    showBrowserNotification(notification);
  }, [toast]);

  // Mark notification as read
  const markAsRead = useCallback((notificationId) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  }, []);

  // Clear a notification
  const clearNotification = useCallback((notificationId) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));
    setUnreadCount((prev) => {
      const notif = notifications.find((n) => n.id === notificationId);
      return notif && !notif.read ? Math.max(0, prev - 1) : prev;
    });
  }, [notifications]);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Sound playback failed (user interaction required)
      });
    } catch (error) {
      // Audio not available
    }
  };

  // Show browser notification
  const showBrowserNotification = (notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(notification.title || 'New Notification', {
          body: notification.message,
          icon: '/logo.png',
          badge: '/logo.png',
          tag: notification.type,
        });
      } catch (error) {
        // Browser notification failed
      }
    }
  };

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      } catch (error) {
        return false;
      }
    }
    return Notification.permission === 'granted';
  }, []);

  // Listen to socket events
  useEffect(() => {
    if (!socket) return;

    // Generic notification event
    const handleNotification = (notification) => {
      console.log('[NOTIFICATION] Received:', notification);
      addNotification(notification);
    };

    // Product moderation events
    const handleProductApproved = (data) => {
      addNotification({
        type: 'product_approved',
        title: '✅ Product Approved',
        message: `Your product "${data.productName}" has been approved and is now live!`,
        data,
        priority: 'normal',
      });
    };

    const handleProductRejected = (data) => {
      addNotification({
        type: 'product_rejected',
        title: '❌ Product Rejected',
        message: `Your product "${data.productName}" was rejected. ${data.note || ''}`,
        data,
        priority: 'high',
      });
    };

    // Seller application events
    const handleSellerApproved = (data) => {
      addNotification({
        type: 'seller_approved',
        title: '🎉 Seller Application Approved',
        message: 'Congratulations! You can now start selling products.',
        data,
        priority: 'high',
      });
    };

    const handleSellerRejected = (data) => {
      addNotification({
        type: 'seller_rejected',
        title: '❌ Seller Application Rejected',
        message: `Your seller application was rejected. ${data.note || ''}`,
        data,
        priority: 'high',
      });
    };

    // Admin events (status changes)
    const handleProductStatusChanged = (data) => {
      addNotification({
        type: 'admin_product_status',
        title: '📋 Product Status Changed',
        message: `Product "${data.productName}" was ${data.status} by ${data.moderator}`,
        data,
        priority: 'normal',
      });
    };

    const handleSellerStatusChanged = (data) => {
      addNotification({
        type: 'admin_seller_status',
        title: '📋 Seller Status Changed',
        message: `Seller application was ${data.status} by ${data.moderator}`,
        data,
        priority: 'normal',
      });
    };

    // Register all listeners
    socket.on('notification', handleNotification);
    socket.on('moderation:product_approved', handleProductApproved);
    socket.on('moderation:product_rejected', handleProductRejected);
    socket.on('moderation:seller_approved', handleSellerApproved);
    socket.on('moderation:seller_rejected', handleSellerRejected);
    socket.on('moderation:product_status_changed', handleProductStatusChanged);
    socket.on('moderation:seller_status_changed', handleSellerStatusChanged);

    // Cleanup
    return () => {
      socket.off('notification', handleNotification);
      socket.off('moderation:product_approved', handleProductApproved);
      socket.off('moderation:product_rejected', handleProductRejected);
      socket.off('moderation:seller_approved', handleSellerApproved);
      socket.off('moderation:seller_rejected', handleSellerRejected);
      socket.off('moderation:product_status_changed', handleProductStatusChanged);
      socket.off('moderation:seller_status_changed', handleSellerStatusChanged);
    };
  }, [socket, addNotification]);

  // Set up polling fallback
  const { isPolling, isConnected } = usePollingFallback(socket, addNotification, 15000);

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAll,
    requestNotificationPermission,
    isPolling,
    isConnected,
  };
};

export default useNotifications;
