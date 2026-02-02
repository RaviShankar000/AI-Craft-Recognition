const { Server } = require('socket.io');
const { authenticateSocket } = require('../middleware/socketAuth');
const config = require('../config/env');
const {
  handleConnection,
  handleDisconnection,
  handleError,
  handleConnectionError,
  handlePing,
  handleReconnectAttempt,
  handleReconnect,
  handleAuthError,
  handleTimeout,
  broadcastConnectionStats,
} = require('../handlers/socketHandlers');

/**
 * Initialize Socket.IO server with authentication
 * @param {Object} server - HTTP server instance
 * @returns {Object} Socket.IO server instance
 */
const initializeSocket = server => {
  const io = new Server(server, {
    cors: {
      origin: config.corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 45000,
    transports: ['websocket', 'polling'],
  });

  // Apply authentication middleware to all connections
  io.use(authenticateSocket);

  // Handle connection errors (before successful connection)
  io.engine.on('connection_error', err => {
    handleConnectionError(null, err);
  });

  // Handle connections
  io.on('connection', socket => {
    // Handle successful connection
    handleConnection(socket);

    // Handle disconnection
    socket.on('disconnect', reason => {
      handleDisconnection(socket, reason);
    });

    // Handle socket errors
    socket.on('error', error => {
      handleError(socket, error);
    });

    // Handle ping-pong for connection health
    socket.on('ping', data => {
      handlePing(socket, data);
    });

    // Handle reconnection attempts
    socket.on('reconnect_attempt', attemptNumber => {
      handleReconnectAttempt(socket, attemptNumber);
    });

    // Handle successful reconnection
    socket.on('reconnect', () => {
      handleReconnect(socket);
    });

    // Handle authentication errors
    socket.on('auth_error', error => {
      handleAuthError(socket, error);
    });

    // Handle connection timeout
    socket.on('connect_timeout', () => {
      handleTimeout(socket);
    });

    // Handle custom disconnect request
    socket.on('disconnect_request', () => {
      console.log('[SOCKET] Client requested disconnect:', socket.id);
      socket.disconnect(true);
    });
  });

  // Broadcast connection statistics to admins every 30 seconds
  setInterval(() => {
    broadcastConnectionStats(io);
  }, 30000);

  console.log('[SOCKET] Socket.IO server initialized with JWT authentication');
  console.log('[SOCKET] Connection lifecycle handlers registered');

  return io;
};

/**
 * Get Socket.IO instance
 * @returns {Object} Socket.IO server instance
 */
let ioInstance = null;

const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.IO not initialized. Call initializeSocket first.');
  }
  return ioInstance;
};

const setIO = io => {
  ioInstance = io;
};

module.exports = {
  initializeSocket,
  getIO,
  setIO,
};
