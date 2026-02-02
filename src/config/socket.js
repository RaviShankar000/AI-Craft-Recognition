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
const { registerSecureEvent, getEventsForRole } = require('../middleware/socketEventAuth');
const { logger, createLoggingMiddleware, printStats } = require('../utils/socketDebugLogger');

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

  // Apply logging middleware (must be first for complete logging)
  io.use(createLoggingMiddleware());

  // Apply authentication middleware to all connections
  io.use(authenticateSocket);

  // Handle connection errors (before successful connection)
  io.engine.on('connection_error', err => {
    logger.error(null, 'connection_error', err);
    handleConnectionError(null, err);
  });

  // Handle connections
  io.on('connection', socket => {
    // Handle successful connection
    handleConnection(socket);

    // Send available events to client based on role
    socket.emit('events:available', {
      events: getEventsForRole(socket.userRole),
      role: socket.userRole,
    });

    // Handle disconnection
    socket.on('disconnect', reason => {
      handleDisconnection(socket, reason);
    });

    // Handle socket errors
    socket.on('error', error => {
      handleError(socket, error);
    });

    // Public events (available to all authenticated users)
    registerSecureEvent(socket, 'ping', data => {
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
    registerSecureEvent(socket, 'disconnect_request', () => {
      console.log('[SOCKET] Client requested disconnect:', socket.id);
      socket.disconnect(true);
    });

    // Admin-only events
    registerSecureEvent(socket, 'admin:broadcast', (data, callback) => {
      const { event, payload, room } = data;

      if (!event) {
        if (callback) callback({ error: 'Event name required' });
        return;
      }

      if (room) {
        io.to(room).emit(event, payload);
      } else {
        io.emit(event, payload);
      }

      console.log('[SOCKET] Admin broadcast:', { event, room, admin: socket.userEmail });
      if (callback) callback({ success: true });
    });

    registerSecureEvent(socket, 'admin:stats', (data, callback) => {
      const stats = require('../handlers/socketHandlers').getConnectionStats();
      if (callback) callback({ success: true, data: stats });
    });

    registerSecureEvent(socket, 'admin:force_disconnect', (data, callback) => {
      const { userId, reason } = data;
      const { disconnectUser } = require('../handlers/socketHandlers');

      disconnectUser(io, userId, reason || 'Disconnected by admin');

      console.log('[SOCKET] Admin force disconnect:', {
        targetUser: userId,
        admin: socket.userEmail,
        reason,
      });

      if (callback) callback({ success: true });
    });

    // Seller events
    registerSecureEvent(socket, 'seller:product_create', (data, callback) => {
      console.log('[SOCKET] Seller product create:', {
        seller: socket.userEmail,
        product: data.name,
      });

      // Notify admins of new product
      socket.to('role:admin').emit('seller:product:new', {
        sellerId: socket.userId,
        sellerName: socket.userName,
        product: data,
        timestamp: Date.now(),
      });

      if (callback) callback({ success: true, message: 'Product creation initiated' });
    });

    registerSecureEvent(socket, 'seller:product_update', (data, callback) => {
      const { productId, changes } = data;

      console.log('[SOCKET] Seller product update:', {
        seller: socket.userEmail,
        productId,
      });

      // Notify product viewers of update
      socket.to(`product:${productId}`).emit('product:updated', {
        productId,
        changes,
        timestamp: Date.now(),
      });

      if (callback) callback({ success: true });
    });

    registerSecureEvent(socket, 'seller:order_status_update', (data, callback) => {
      const { orderId, status } = data;

      console.log('[SOCKET] Seller order status update:', {
        seller: socket.userEmail,
        orderId,
        status,
      });

      // Notify order owner
      // This would need to fetch order and emit to the buyer
      socket.emit('order:status:changed', {
        orderId,
        newStatus: status,
        timestamp: Date.now(),
      });

      if (callback) callback({ success: true });
    });

    // User events (all authenticated users)
    registerSecureEvent(socket, 'user:cart_update', (data, callback) => {
      console.log('[SOCKET] Cart updated:', { userId: socket.userId });

      // Emit back to user's other sessions
      socket.to(`user:${socket.userId}`).emit('cart:synced', {
        cart: data.cart,
        timestamp: Date.now(),
      });

      if (callback) callback({ success: true });
    });

    registerSecureEvent(socket, 'user:order_create', (data, callback) => {
      console.log('[SOCKET] Order created:', {
        userId: socket.userId,
        orderNumber: data.orderNumber,
      });

      // Notify admins of new order
      socket.to('role:admin').emit('order:new', {
        userId: socket.userId,
        userName: socket.userName,
        order: data,
        timestamp: Date.now(),
      });

      if (callback) callback({ success: true, message: 'Order created successfully' });
    });

    // Chat events
    registerSecureEvent(socket, 'chat:message', (data, callback) => {
      const { recipientId, message, roomId } = data;

      console.log('[SOCKET] Chat message:', {
        from: socket.userId,
        to: recipientId,
        room: roomId,
      });

      if (recipientId) {
        // Direct message
        socket.to(`user:${recipientId}`).emit('chat:message:new', {
          from: socket.userId,
          fromName: socket.userName,
          message,
          timestamp: Date.now(),
        });
      } else if (roomId) {
        // Room message
        socket.to(roomId).emit('chat:message:new', {
          from: socket.userId,
          fromName: socket.userName,
          message,
          roomId,
          timestamp: Date.now(),
        });
      }

      if (callback) callback({ success: true });
    });

    registerSecureEvent(socket, 'chat:typing', (data, callback) => {
      const { recipientId, isTyping } = data;

      if (recipientId) {
        socket.to(`user:${recipientId}`).emit('chat:typing:status', {
          from: socket.userId,
          fromName: socket.userName,
          isTyping,
        });
      }

      if (callback) callback({ success: true });
    });

    registerSecureEvent(socket, 'chat:join_room', (data, callback) => {
      const { roomId } = data;

      socket.join(roomId);
      console.log(`[SOCKET] User ${socket.userId} joined chat room: ${roomId}`);

      socket.to(roomId).emit('chat:user:joined', {
        userId: socket.userId,
        userName: socket.userName,
        roomId,
      });

      if (callback) callback({ success: true });
    });

    registerSecureEvent(socket, 'chat:leave_room', (data, callback) => {
      const { roomId } = data;

      socket.leave(roomId);
      console.log(`[SOCKET] User ${socket.userId} left chat room: ${roomId}`);

      socket.to(roomId).emit('chat:user:left', {
        userId: socket.userId,
        userName: socket.userName,
        roomId,
      });

      if (callback) callback({ success: true });
    });

    // Notification events
    registerSecureEvent(socket, 'notification:read', (data, callback) => {
      const { notificationId } = data;

      console.log('[SOCKET] Notification read:', {
        userId: socket.userId,
        notificationId,
      });

      if (callback) callback({ success: true });
    });
  });

  // Broadcast connection statistics to admins every 30 seconds
  setInterval(() => {
    broadcastConnectionStats(io);
  }, 30000);

  // Print socket statistics every 5 minutes in development
  if (config.nodeEnv === 'development') {
    setInterval(() => {
      printStats();
    }, 300000); // 5 minutes
  }

  console.log('[SOCKET] Socket.IO server initialized with JWT authentication');
  console.log('[SOCKET] Connection lifecycle handlers registered');
  logger.info('Socket.IO server initialized', {
    environment: config.nodeEnv,
    debugLogging: process.env.DEBUG_SOCKET === 'true' || config.nodeEnv === 'development',
  });

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
