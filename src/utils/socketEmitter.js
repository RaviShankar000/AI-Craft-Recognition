const { getIO } = require('../config/socket');

/**
 * Socket.IO Event Emitter Utilities
 * Helper functions for emitting events to users, roles, and rooms
 */

/**
 * Emit event to a specific user
 * @param {String} userId - Target user ID
 * @param {String} event - Event name
 * @param {Object} data - Event data
 */
const emitToUser = (userId, event, data) => {
  try {
    const io = getIO();
    io.to(`user:${userId}`).emit(event, data);
    console.log(`[SOCKET EMIT] Event '${event}' sent to user ${userId}`);
  } catch (error) {
    console.error('[SOCKET EMIT ERROR]', error.message);
  }
};

/**
 * Emit event to all users with a specific role
 * @param {String} role - Target role (admin, seller, user)
 * @param {String} event - Event name
 * @param {Object} data - Event data
 */
const emitToRole = (role, event, data) => {
  try {
    const io = getIO();
    io.to(`role:${role}`).emit(event, data);
    console.log(`[SOCKET EMIT] Event '${event}' sent to role '${role}'`);
  } catch (error) {
    console.error('[SOCKET EMIT ERROR]', error.message);
  }
};

/**
 * Emit event to all admins
 * @param {String} event - Event name
 * @param {Object} data - Event data
 */
const emitToAdmins = (event, data) => {
  emitToRole('admin', event, data);
};

/**
 * Emit event to all sellers
 * @param {String} event - Event name
 * @param {Object} data - Event data
 */
const emitToSellers = (event, data) => {
  emitToRole('seller', event, data);
};

/**
 * Emit event to all connected users (broadcast)
 * @param {String} event - Event name
 * @param {Object} data - Event data
 */
const emitToAll = (event, data) => {
  try {
    const io = getIO();
    io.emit(event, data);
    console.log(`[SOCKET EMIT] Event '${event}' broadcast to all users`);
  } catch (error) {
    console.error('[SOCKET EMIT ERROR]', error.message);
  }
};

/**
 * Emit event to a specific room
 * @param {String} room - Room name
 * @param {String} event - Event name
 * @param {Object} data - Event data
 */
const emitToRoom = (room, event, data) => {
  try {
    const io = getIO();
    io.to(room).emit(event, data);
    console.log(`[SOCKET EMIT] Event '${event}' sent to room '${room}'`);
  } catch (error) {
    console.error('[SOCKET EMIT ERROR]', error.message);
  }
};

/**
 * Get all connected sockets for a user
 * @param {String} userId - User ID
 * @returns {Promise<Array>} Array of socket IDs
 */
const getUserSockets = async userId => {
  try {
    const io = getIO();
    const sockets = await io.in(`user:${userId}`).fetchSockets();
    return sockets.map(socket => socket.id);
  } catch (error) {
    console.error('[SOCKET ERROR]', error.message);
    return [];
  }
};

/**
 * Check if user is currently connected
 * @param {String} userId - User ID
 * @returns {Promise<Boolean>}
 */
const isUserOnline = async userId => {
  const sockets = await getUserSockets(userId);
  return sockets.length > 0;
};

/**
 * Get count of connected users in a room
 * @param {String} room - Room name
 * @returns {Promise<Number>}
 */
const getRoomUserCount = async room => {
  try {
    const io = getIO();
    const sockets = await io.in(room).fetchSockets();
    return sockets.length;
  } catch (error) {
    console.error('[SOCKET ERROR]', error.message);
    return 0;
  }
};

/**
 * Disconnect all sockets for a user (e.g., when account is banned)
 * @param {String} userId - User ID
 * @param {String} reason - Disconnection reason
 */
const disconnectUser = async (userId, reason = 'User disconnected by admin') => {
  try {
    const io = getIO();
    const sockets = await io.in(`user:${userId}`).fetchSockets();

    for (const socket of sockets) {
      socket.emit('force_disconnect', { reason });
      socket.disconnect(true);
    }

    console.log(`[SOCKET] Disconnected user ${userId}: ${reason}`);
  } catch (error) {
    console.error('[SOCKET ERROR]', error.message);
  }
};

module.exports = {
  emitToUser,
  emitToRole,
  emitToAdmins,
  emitToSellers,
  emitToAll,
  emitToRoom,
  getUserSockets,
  isUserOnline,
  getRoomUserCount,
  disconnectUser,
};
