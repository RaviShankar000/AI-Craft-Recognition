import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import PropTypes from 'prop-types';

const SocketContext = createContext(null);

/**
 * Socket.IO Context Provider
 * Manages Socket.IO connection with JWT authentication
 */
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    // Get token from localStorage
    const token = localStorage.getItem('token');

    if (!token) {
      console.log('[SOCKET] No token found, skipping connection');
      return;
    }

    // Socket.IO server URL
    const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    console.log('[SOCKET] Connecting to:', SOCKET_URL);

    // Create socket connection with JWT token
    const newSocket = io(SOCKET_URL, {
      auth: {
        token: token,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    // Connection successful
    newSocket.on('connect', () => {
      console.log('[SOCKET] Connected:', newSocket.id);
      setIsConnected(true);
      setConnectionError(null);
    });

    // Connection error
    newSocket.on('connect_error', (error) => {
      console.error('[SOCKET] Connection error:', error.message);
      setIsConnected(false);
      setConnectionError(error.message);

      // If authentication failed, clear token and reload
      if (
        error.message === 'Authentication token required' ||
        error.message === 'Authentication token expired' ||
        error.message === 'Invalid authentication token'
      ) {
        console.log('[SOCKET] Auth failed, clearing token');
        localStorage.removeItem('token');
        // Optionally redirect to login
        // window.location.href = '/login';
      }
    });

    // Disconnection
    newSocket.on('disconnect', (reason) => {
      console.log('[SOCKET] Disconnected:', reason);
      setIsConnected(false);

      if (reason === 'io server disconnect') {
        // Server forcefully disconnected (e.g., banned)
        console.log('[SOCKET] Server disconnected socket');
      }
    });

    // Force disconnect from server (admin action)
    newSocket.on('force_disconnect', ({ reason }) => {
      console.log('[SOCKET] Force disconnect:', reason);
      alert(`Connection closed: ${reason}`);
      newSocket.disconnect();
    });

    // Reconnection attempt
    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`[SOCKET] Reconnection attempt ${attemptNumber}`);
    });

    // Reconnection successful
    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`[SOCKET] Reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);
      setConnectionError(null);
    });

    // Reconnection failed
    newSocket.on('reconnect_failed', () => {
      console.error('[SOCKET] Reconnection failed');
      setConnectionError('Failed to reconnect to server');
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      console.log('[SOCKET] Cleaning up connection');
      newSocket.disconnect();
    };
  }, []); // Empty dependency array - only run once on mount

  // Provide socket instance and connection state
  const value = {
    socket,
    isConnected,
    connectionError,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

SocketProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Custom hook to use socket context
 * @returns {Object} { socket, isConnected, connectionError }
 */
export const useSocket = () => {
  const context = useContext(SocketContext);

  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }

  return context;
};

export default SocketContext;
