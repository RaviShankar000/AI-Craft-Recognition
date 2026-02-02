import { useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useSocketEvent, useSocketPing } from '../hooks/useSocket';
import './SocketStatus.css';

/**
 * Socket Connection Status Component
 * Displays real-time connection status and allows testing
 */
const SocketStatus = () => {
  const { socket, isConnected, connectionError } = useSocket();
  const ping = useSocketPing();
  const [notifications, setNotifications] = useState([]);

  // Listen to test notification event
  useSocketEvent('notification:new', (data) => {
    console.log('[SOCKET] Notification received:', data);
    setNotifications((prev) => [
      { ...data, timestamp: new Date().toLocaleTimeString() },
      ...prev.slice(0, 4), // Keep only last 5 notifications
    ]);
  });

  // Test ping function
  const handlePing = () => {
    ping();
  };

  if (!socket) {
    return (
      <div className="socket-status offline">
        <span className="status-indicator"></span>
        <span>Socket: Not Initialized (No Token)</span>
      </div>
    );
  }

  return (
    <div className="socket-status-container">
      <div className={`socket-status ${isConnected ? 'online' : 'offline'}`}>
        <span className="status-indicator"></span>
        <span>Socket: {isConnected ? 'Connected' : 'Disconnected'}</span>
        {isConnected && socket && <span className="socket-id">({socket.id})</span>}
      </div>

      {connectionError && (
        <div className="connection-error">
          <span>⚠️ {connectionError}</span>
        </div>
      )}

      {isConnected && (
        <div className="socket-actions">
          <button onClick={handlePing} className="ping-button">
            Test Connection (Ping)
          </button>
        </div>
      )}

      {notifications.length > 0 && (
        <div className="notifications-list">
          <h4>Recent Notifications:</h4>
          {notifications.map((notif, index) => (
            <div key={index} className="notification-item">
              <span className="notif-time">{notif.timestamp}</span>
              <span className="notif-message">{notif.message || JSON.stringify(notif)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SocketStatus;
