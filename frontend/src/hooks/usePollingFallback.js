import { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';

/**
 * Hook to handle polling fallback when socket disconnects
 * @param {Object} socket - Socket.IO client instance
 * @param {Function} onUpdate - Callback when new data is received
 * @param {Number} interval - Polling interval in milliseconds (default: 15000 = 15s)
 */
export const usePollingFallback = (socket, onUpdate, interval = 15000) => {
  const [isPolling, setIsPolling] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const pollingTimerRef = useRef(null);
  const lastPollTimeRef = useRef(null);

  // Check socket connection status
  const checkConnection = useCallback(() => {
    if (!socket) return false;
    return socket.connected;
  }, [socket]);

  // Fetch updates from server
  const fetchUpdates = useCallback(async () => {
    try {
      const since = lastPollTimeRef.current || new Date(Date.now() - 60000).toISOString();
      
      const response = await axios.get('/api/notifications/updates', {
        params: { since },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.data.success && response.data.updates) {
        // Process each update
        response.data.updates.forEach((update) => {
          onUpdate(update);
        });

        // Update last poll time
        lastPollTimeRef.current = new Date().toISOString();
      }
    } catch (error) {
      console.error('[POLLING] Failed to fetch updates:', error.message);
    }
  }, [onUpdate]);

  // Start polling
  const startPolling = useCallback(() => {
    if (isPolling) return;

    console.log('[POLLING] Starting fallback polling');
    setIsPolling(true);

    // Immediate fetch
    fetchUpdates();

    // Set up interval
    pollingTimerRef.current = setInterval(() => {
      fetchUpdates();
    }, interval);
  }, [isPolling, fetchUpdates, interval]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (!isPolling) return;

    console.log('[POLLING] Stopping fallback polling');
    setIsPolling(false);

    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
  }, [isPolling]);

  // Monitor socket connection
  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      console.log('[SOCKET] Connected');
      setIsConnected(true);
      stopPolling();
    };

    const handleDisconnect = () => {
      console.log('[SOCKET] Disconnected');
      setIsConnected(false);
      startPolling();
    };

    const handleConnectError = (error) => {
      console.error('[SOCKET] Connection error:', error.message);
      setIsConnected(false);
      startPolling();
    };

    // Check initial connection status
    if (checkConnection()) {
      setIsConnected(true);
      stopPolling();
    } else {
      setIsConnected(false);
      startPolling();
    }

    // Set up listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    // Cleanup
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      stopPolling();
    };
  }, [socket, checkConnection, startPolling, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    isPolling,
    isConnected,
    startPolling,
    stopPolling,
    fetchUpdates,
  };
};

export default usePollingFallback;
