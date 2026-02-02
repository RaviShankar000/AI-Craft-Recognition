import { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';

/**
 * Custom hook to listen to socket events
 * Automatically handles cleanup on unmount
 * @param {String} event - Event name to listen to
 * @param {Function} callback - Callback function when event is received
 */
export const useSocketEvent = (event, callback) => {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on(event, callback);

    // Cleanup listener on unmount
    return () => {
      socket.off(event, callback);
    };
  }, [socket, event, callback]);
};

/**
 * Custom hook to emit socket events
 * @returns {Function} emit function
 */
export const useSocketEmit = () => {
  const { socket } = useSocket();

  const emit = (event, data) => {
    if (!socket) {
      console.warn('[SOCKET] Cannot emit - socket not connected');
      return;
    }

    socket.emit(event, data);
  };

  return emit;
};

/**
 * Custom hook for socket connection status
 * @returns {Object} { isConnected, connectionError }
 */
export const useSocketStatus = () => {
  const { isConnected, connectionError } = useSocket();
  return { isConnected, connectionError };
};

/**
 * Custom hook for ping/pong connection test
 * @returns {Function} ping function
 */
export const useSocketPing = () => {
  const { socket } = useSocket();

  const ping = () => {
    if (!socket) {
      console.warn('[SOCKET] Cannot ping - socket not connected');
      return;
    }

    const startTime = Date.now();
    socket.emit('ping');

    socket.once('pong', (data) => {
      const latency = Date.now() - startTime;
      console.log(`[SOCKET] Pong received - Latency: ${latency}ms`, data);
    });
  };

  return ping;
};
