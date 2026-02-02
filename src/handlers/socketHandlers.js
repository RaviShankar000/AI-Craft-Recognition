const AuditLog = require('../models/AuditLog');

/**
 * Socket Event Handlers for Connection Lifecycle
 * Handles connection, disconnection, errors, and reconnection events
 */

/**
 * Track active connections per user
 */
const activeConnections = new Map();

/**
 * Handle new socket connection
 * @param {Object} socket - Socket instance
 */
const handleConnection = socket => {
  const { userId, userEmail, userRole, userName } = socket;

  console.log('[SOCKET] Connection established:', {
    socketId: socket.id,
    userId,
    email: userEmail,
    role: userRole,
    timestamp: new Date().toISOString(),
  });

  // Track connection count for user
  if (!activeConnections.has(userId)) {
    activeConnections.set(userId, new Set());
  }
  activeConnections.get(userId).add(socket.id);

  // Join user-specific room
  socket.join(`user:${userId}`);
  console.log(`[SOCKET] User ${userId} joined room: user:${userId}`);

  // Join role-based room
  socket.join(`role:${userRole}`);
  console.log(`[SOCKET] User ${userId} joined room: role:${userRole}`);

  // Send welcome message
  socket.emit('connection:success', {
    socketId: socket.id,
    message: 'Successfully connected to server',
    userId,
    userName,
    userRole,
    timestamp: Date.now(),
    activeConnections: activeConnections.get(userId).size,
  });

  // Notify admins of new connection (for monitoring)
  if (userRole !== 'admin') {
    socket.to('role:admin').emit('user:connected', {
      userId,
      userName,
      userEmail,
      userRole,
      socketId: socket.id,
      timestamp: Date.now(),
    });
  }

  // Log connection event for audit
  AuditLog.log({
    userId,
    action: 'socket:connected',
    category: 'system',
    severity: 'low',
    metadata: {
      socketId: socket.id,
      userRole,
      connectionCount: activeConnections.get(userId).size,
    },
  }).catch(err => {
    console.error('[SOCKET] Failed to log connection:', err.message);
  });
};

/**
 * Handle socket disconnection
 * @param {Object} socket - Socket instance
 * @param {String} reason - Disconnection reason
 */
const handleDisconnection = (socket, reason) => {
  const { userId, userEmail, userRole, userName } = socket;

  console.log('[SOCKET] Connection closed:', {
    socketId: socket.id,
    userId,
    email: userEmail,
    reason,
    timestamp: new Date().toISOString(),
  });

  // Remove from active connections
  if (activeConnections.has(userId)) {
    activeConnections.get(userId).delete(socket.id);
    if (activeConnections.get(userId).size === 0) {
      activeConnections.delete(userId);
      console.log(`[SOCKET] User ${userId} fully disconnected (no active connections)`);

      // Notify admins that user is completely offline
      socket.to('role:admin').emit('user:disconnected', {
        userId,
        userName,
        userEmail,
        userRole,
        reason,
        timestamp: Date.now(),
      });
    }
  }

  // Log disconnection reason details
  const disconnectionReasons = {
    'transport close': 'Network connection lost',
    'transport error': 'Network error occurred',
    'server namespace disconnect': 'Server forced disconnection',
    'client namespace disconnect': 'Client initiated disconnect',
    'ping timeout': 'Client failed to respond to ping',
  };

  const reasonDescription = disconnectionReasons[reason] || reason;
  console.log(`[SOCKET] Disconnection reason: ${reasonDescription}`);

  // Log disconnection event for audit
  AuditLog.log({
    userId,
    action: 'socket:disconnected',
    category: 'system',
    severity: 'low',
    metadata: {
      socketId: socket.id,
      reason: reasonDescription,
      userRole,
      remainingConnections: activeConnections.has(userId)
        ? activeConnections.get(userId).size
        : 0,
    },
  }).catch(err => {
    console.error('[SOCKET] Failed to log disconnection:', err.message);
  });
};

/**
 * Handle socket errors
 * @param {Object} socket - Socket instance
 * @param {Error} error - Error object
 */
const handleError = (socket, error) => {
  const { userId, userEmail, userRole } = socket;

  console.error('[SOCKET] Socket error occurred:', {
    socketId: socket.id,
    userId,
    email: userEmail,
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  });

  // Emit error to client
  socket.emit('connection:error', {
    message: 'A socket error occurred',
    code: 'SOCKET_ERROR',
    timestamp: Date.now(),
  });

  // Log error event for audit
  AuditLog.log({
    userId,
    action: 'socket:error',
    category: 'system',
    severity: 'medium',
    metadata: {
      socketId: socket.id,
      errorMessage: error.message,
      errorStack: error.stack,
      userRole,
    },
  }).catch(err => {
    console.error('[SOCKET] Failed to log socket error:', err.message);
  });
};

/**
 * Handle connection errors (before successful connection)
 * @param {Object} socket - Socket instance
 * @param {Error} error - Error object
 */
const handleConnectionError = (socket, error) => {
  console.error('[SOCKET] Connection error:', {
    error: error.message,
    data: error.data,
    timestamp: new Date().toISOString(),
  });

  // Log failed connection attempt
  if (error.data?.userId) {
    AuditLog.log({
      userId: error.data.userId,
      action: 'socket:connection_failed',
      category: 'security',
      severity: 'medium',
      metadata: {
        errorMessage: error.message,
        errorData: error.data,
      },
    }).catch(err => {
      console.error('[SOCKET] Failed to log connection error:', err.message);
    });
  }
};

/**
 * Handle ping requests
 * @param {Object} socket - Socket instance
 * @param {Object} data - Ping data
 */
const handlePing = (socket, data = {}) => {
  const responseTime = Date.now();

  socket.emit('pong', {
    timestamp: responseTime,
    clientTimestamp: data.timestamp,
    latency: data.timestamp ? responseTime - data.timestamp : null,
    socketId: socket.id,
  });

  console.log('[SOCKET] Ping received from:', {
    socketId: socket.id,
    userId: socket.userId,
    clientTimestamp: data.timestamp,
    responseTimestamp: responseTime,
  });
};

/**
 * Handle reconnection attempts
 * @param {Object} socket - Socket instance
 * @param {Number} attemptNumber - Reconnection attempt number
 */
const handleReconnectAttempt = (socket, attemptNumber) => {
  const { userId, userEmail } = socket;

  console.log('[SOCKET] Reconnection attempt:', {
    socketId: socket.id,
    userId,
    email: userEmail,
    attemptNumber,
    timestamp: new Date().toISOString(),
  });

  // Notify user of reconnection attempt
  socket.emit('connection:reconnecting', {
    attemptNumber,
    message: 'Attempting to reconnect...',
    timestamp: Date.now(),
  });
};

/**
 * Handle successful reconnection
 * @param {Object} socket - Socket instance
 */
const handleReconnect = socket => {
  const { userId, userEmail, userName } = socket;

  console.log('[SOCKET] Successfully reconnected:', {
    socketId: socket.id,
    userId,
    email: userEmail,
    timestamp: new Date().toISOString(),
  });

  // Rejoin rooms
  socket.join(`user:${userId}`);
  socket.join(`role:${socket.userRole}`);

  // Notify user of successful reconnection
  socket.emit('connection:reconnected', {
    socketId: socket.id,
    message: 'Successfully reconnected to server',
    userId,
    userName,
    timestamp: Date.now(),
  });

  // Log reconnection event
  AuditLog.log({
    userId,
    action: 'socket:reconnected',
    category: 'system',
    severity: 'low',
    metadata: {
      socketId: socket.id,
      userRole: socket.userRole,
    },
  }).catch(err => {
    console.error('[SOCKET] Failed to log reconnection:', err.message);
  });
};

/**
 * Handle authentication errors
 * @param {Object} socket - Socket instance
 * @param {Object} error - Error details
 */
const handleAuthError = (socket, error) => {
  console.error('[SOCKET] Authentication error:', {
    socketId: socket.id,
    error: error.message,
    timestamp: new Date().toISOString(),
  });

  // Send auth error to client
  socket.emit('auth:error', {
    message: error.message || 'Authentication failed',
    code: 'AUTH_ERROR',
    timestamp: Date.now(),
  });

  // Force disconnect after auth error
  setTimeout(() => {
    socket.disconnect(true);
  }, 1000);

  // Log authentication failure
  AuditLog.log({
    userId: null,
    action: 'socket:auth_failed',
    category: 'security',
    severity: 'high',
    metadata: {
      socketId: socket.id,
      errorMessage: error.message,
    },
  }).catch(err => {
    console.error('[SOCKET] Failed to log auth error:', err.message);
  });
};

/**
 * Handle timeout errors
 * @param {Object} socket - Socket instance
 */
const handleTimeout = socket => {
  const { userId, userEmail } = socket;

  console.warn('[SOCKET] Connection timeout:', {
    socketId: socket.id,
    userId,
    email: userEmail,
    timestamp: new Date().toISOString(),
  });

  socket.emit('connection:timeout', {
    message: 'Connection timeout - please check your network',
    timestamp: Date.now(),
  });
};

/**
 * Get active connection statistics
 * @returns {Object} Connection statistics
 */
const getConnectionStats = () => {
  const totalUsers = activeConnections.size;
  const totalConnections = Array.from(activeConnections.values()).reduce(
    (sum, connections) => sum + connections.size,
    0
  );

  const multipleConnectionUsers = Array.from(activeConnections.entries())
    .filter(([_, connections]) => connections.size > 1)
    .map(([userId, connections]) => ({
      userId,
      connectionCount: connections.size,
    }));

  return {
    totalUsers,
    totalConnections,
    averageConnectionsPerUser: totalUsers > 0 ? (totalConnections / totalUsers).toFixed(2) : 0,
    multipleConnectionUsers,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Get active connections for a specific user
 * @param {String} userId - User ID
 * @returns {Array} Array of socket IDs
 */
const getUserConnections = userId => {
  if (!activeConnections.has(userId)) {
    return [];
  }
  return Array.from(activeConnections.get(userId));
};

/**
 * Check if user is currently connected
 * @param {String} userId - User ID
 * @returns {Boolean} True if user has active connections
 */
const isUserConnected = userId => {
  return activeConnections.has(userId) && activeConnections.get(userId).size > 0;
};

/**
 * Disconnect all connections for a specific user
 * @param {Object} io - Socket.IO instance
 * @param {String} userId - User ID
 * @param {String} reason - Reason for disconnection
 */
const disconnectUser = (io, userId, reason = 'Admin action') => {
  const connections = getUserConnections(userId);

  connections.forEach(socketId => {
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      socket.emit('force_disconnect', {
        reason,
        message: 'You have been disconnected by the server',
        timestamp: Date.now(),
      });
      socket.disconnect(true);
    }
  });

  console.log(`[SOCKET] Disconnected all connections for user ${userId}: ${reason}`);

  // Log forced disconnection
  AuditLog.log({
    userId,
    action: 'socket:force_disconnect',
    category: 'security',
    severity: 'high',
    metadata: {
      reason,
      disconnectedConnections: connections.length,
    },
  }).catch(err => {
    console.error('[SOCKET] Failed to log forced disconnection:', err.message);
  });
};

/**
 * Broadcast connection statistics to admins
 * @param {Object} io - Socket.IO instance
 */
const broadcastConnectionStats = io => {
  const stats = getConnectionStats();
  io.to('role:admin').emit('connection:stats', stats);
  console.log('[SOCKET] Broadcasted connection stats to admins:', stats);
};

module.exports = {
  handleConnection,
  handleDisconnection,
  handleError,
  handleConnectionError,
  handlePing,
  handleReconnectAttempt,
  handleReconnect,
  handleAuthError,
  handleTimeout,
  getConnectionStats,
  getUserConnections,
  isUserConnected,
  disconnectUser,
  broadcastConnectionStats,
};
