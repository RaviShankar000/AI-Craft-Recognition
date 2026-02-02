const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/auth');
const {
  getConnectionStats,
  getUserConnections,
  isUserConnected,
  disconnectUser,
} = require('../handlers/socketHandlers');
const { getIO } = require('../config/socket');

/**
 * @route   GET /api/socket/stats
 * @desc    Get socket connection statistics (Admin only)
 * @access  Admin
 */
router.get('/stats', authenticateToken, authorizeRoles('admin'), (req, res) => {
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
router.get('/user/:userId', authenticateToken, authorizeRoles('admin'), (req, res) => {
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
router.post('/disconnect/:userId', authenticateToken, authorizeRoles('admin'), (req, res) => {
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
router.post('/broadcast', authenticateToken, authorizeRoles('admin'), (req, res) => {
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

module.exports = router;
