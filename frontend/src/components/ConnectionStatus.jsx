import React from 'react';
import './ConnectionStatus.css';

const ConnectionStatus = ({ isConnected, isPolling }) => {
  if (isConnected && !isPolling) {
    return null; // Don't show indicator when connected normally
  }

  return (
    <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
      <div className="status-indicator">
        <span className="status-dot"></span>
        <span className="status-text">
          {isConnected ? 'Connected' : isPolling ? 'Polling for updates...' : 'Disconnected'}
        </span>
      </div>
    </div>
  );
};

export default ConnectionStatus;
