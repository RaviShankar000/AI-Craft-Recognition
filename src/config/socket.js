const { Server } = require('socket.io');
const { authenticateSocket } = require('../middleware/socketAuth');
const config = require('../config/env');

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
  });

  // Apply authentication middleware to all connections
  io.use(authenticateSocket);

  // Handle connections
  io.on('connection', socket => {
    console.log('[SOCKET] New authenticated connection:', {
      socketId: socket.id,
      userId: socket.userId,
      email: socket.userEmail,
      role: socket.userRole,
    });

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);

    // Join role-based rooms
    socket.join(`role:${socket.userRole}`);

    // Handle disconnection
    socket.on('disconnect', reason => {
      console.log('[SOCKET] User disconnected:', {
        socketId: socket.id,
        userId: socket.userId,
        email: socket.userEmail,
        reason,
      });
    });

    // Handle errors
    socket.on('error', error => {
      console.error('[SOCKET] Socket error:', {
        socketId: socket.id,
        userId: socket.userId,
        error: error.message,
      });
    });

    // Ping-pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });
  });

  console.log('[SOCKET] Socket.IO server initialized with JWT authentication');

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
