const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getConnectionStats,
  getUserConnections,
  isUserConnected,
  disconnectUser,
} = require('../handlers/socketHandlers');
const {
  getAllEventRoleMappings,
  getEventsForRole,
  addEventRoleMapping,
  removeEventRoleMapping,
} = require('../middleware/socketEventAuth');
const { getStats, resetStats, setDebugEnabled, isEnabled } = require('../utils/socketDebugLogger');
const { getIO } = require('../config/socket');

/**
 * @route   GET /api/socket/stats
 * @desc    Get socket connection statistics (Admin only)
 * @access  Admin
 */
router.get('/stats', protect, authorize('admin'), (req, res) => {
  try {
    const stats = getConnectionStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('[SOCKET API] Error getting connection stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve connection statistics',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/socket/user/:userId
 * @desc    Get connections for a specific user (Admin only)
 * @access  Admin
 */
router.get('/user/:userId', protect, authorize('admin'), (req, res) => {
  try {
    const { userId } = req.params;
    const connections = getUserConnections(userId);
    const isConnected = isUserConnected(userId);

    res.json({
      success: true,
      data: {
        userId,
        isConnected,
        connectionCount: connections.length,
        socketIds: connections,
      },
    });
  } catch (error) {
    console.error('[SOCKET API] Error getting user connections:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user connections',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/socket/disconnect/:userId
 * @desc    Force disconnect a user (Admin only)
 * @access  Admin
 */
router.post('/disconnect/:userId', protect, authorize('admin'), (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    if (!isUserConnected(userId)) {
      return res.status(404).json({
        success: false,
        message: 'User is not currently connected',
      });
    }

    const io = getIO();
    disconnectUser(io, userId, reason || 'Disconnected by admin');

    res.json({
      success: true,
      message: 'User disconnected successfully',
      data: {
        userId,
        reason: reason || 'Disconnected by admin',
      },
    });
  } catch (error) {
    console.error('[SOCKET API] Error disconnecting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect user',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/socket/broadcast
 * @desc    Broadcast a message to all connected users (Admin only)
 * @access  Admin
 */
router.post('/broadcast', protect, authorize('admin'), (req, res) => {
  try {
    const { event, data, room } = req.body;

    if (!event) {
      return res.status(400).json({
        success: false,
        message: 'Event name is required',
      });
    }

    const io = getIO();

    if (room) {
      // Broadcast to specific room
      io.to(room).emit(event, data);
      console.log(`[SOCKET API] Broadcasted ${event} to room: ${room}`);
    } else {
      // Broadcast to all
      io.emit(event, data);
      console.log(`[SOCKET API] Broadcasted ${event} to all users`);
    }

    res.json({
      success: true,
      message: 'Message broadcasted successfully',
      data: {
        event,
        room: room || 'all',
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    console.error('[SOCKET API] Error broadcasting message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to broadcast message',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/socket/health
 * @desc    Check socket server health
 * @access  Public
 */
router.get('/health', (req, res) => {
  try {
    const io = getIO();
    const stats = getConnectionStats();

    res.json({
      success: true,
      data: {
        status: 'healthy',
        socketServerRunning: !!io,
        ...stats,
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Socket server not available',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/socket/events
 * @desc    Get all event-role mappings (Admin only)
 * @access  Admin
 */
router.get('/events', protect, authorize('admin'), (req, res) => {
  try {
    const mappings = getAllEventRoleMappings();

    res.json({
      success: true,
      data: {
        mappings,
        totalEvents: Object.keys(mappings).length,
      },
    });
  } catch (error) {
    console.error('[SOCKET API] Error getting event mappings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve event mappings',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/socket/events/role/:role
 * @desc    Get events available for a specific role (Admin only)
 * @access  Admin
 */
router.get('/events/role/:role', protect, authorize('admin'), (req, res) => {
  try {
    const { role } = req.params;

    if (!['admin', 'seller', 'user'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be: admin, seller, or user',
      });
    }

    const events = getEventsForRole(role);

    res.json({
      success: true,
      data: {
        role,
        events,
        count: events.length,
      },
    });
  } catch (error) {
    console.error('[SOCKET API] Error getting events for role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve events for role',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/socket/events/mapping
 * @desc    Add or update event role mapping (Admin only)
 * @access  Admin
 */
router.post('/events/mapping', protect, authorize('admin'), (req, res) => {
  try {
    const { eventName, roles } = req.body;

    if (!eventName || !roles) {
      return res.status(400).json({
        success: false,
        message: 'Event name and roles are required',
      });
    }

    addEventRoleMapping(eventName, roles);

    res.json({
      success: true,
      message: 'Event role mapping added successfully',
      data: {
        eventName,
        roles,
      },
    });
  } catch (error) {
    console.error('[SOCKET API] Error adding event mapping:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add event mapping',
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/socket/events/mapping/:eventName
 * @desc    Remove event role mapping (Admin only)
 * @access  Admin
 */
router.delete(
  '/events/mapping/:eventName',
  protect,
  authorize('admin'),
  (req, res) => {
    try {
      const { eventName } = req.params;

      removeEventRoleMapping(eventName);

      res.json({
        success: true,
        message: 'Event role mapping removed successfully',
        data: {
          eventName,
        },
      });
    } catch (error) {
      console.error('[SOCKET API] Error removing event mapping:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove event mapping',
        error: error.message,
      });
    }
  }
);

/**
 * @route   GET /api/socket/debug/stats
 * @desc    Get socket debug statistics (Admin only)
 * @access  Admin
 */
router.get('/debug/stats', protect, authorize('admin'), (req, res) => {
  try {
    const stats = getStats();

    res.json({
      success: true,
      data: {
        ...stats,
        debugEnabled: isEnabled(),
      },
    });
  } catch (error) {
    console.error('[SOCKET API] Error getting debug stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve debug statistics',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/socket/debug/reset
 * @desc    Reset socket debug statistics (Admin only)
 * @access  Admin
 */
router.post('/debug/reset', protect, authorize('admin'), (req, res) => {
  try {
    resetStats();

    res.json({
      success: true,
      message: 'Debug statistics reset successfully',
    });
  } catch (error) {
    console.error('[SOCKET API] Error resetting debug stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset debug statistics',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/socket/debug/toggle
 * @desc    Toggle debug logging on/off (Admin only)
 * @access  Admin
 */
router.post('/debug/toggle', protect, authorize('admin'), (req, res) => {
  try {
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'enabled field must be a boolean',
      });
    }

    setDebugEnabled(enabled);

    res.json({
      success: true,
      message: `Debug logging ${enabled ? 'enabled' : 'disabled'}`,
      data: {
        debugEnabled: enabled,
      },
    });
  } catch (error) {
    console.error('[SOCKET API] Error toggling debug logging:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle debug logging',
      error: error.message,
    });
  }
});

module.exports = router;
