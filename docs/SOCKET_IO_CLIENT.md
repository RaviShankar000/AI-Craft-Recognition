# Frontend Socket.IO Client Setup

## Overview
Socket.IO client implementation with React context for global socket access and JWT authentication.

## Installation

Socket.IO client is already installed:
```bash
npm install socket.io-client
```

## Architecture

### Files Structure
```
frontend/src/
├── context/
│   └── SocketContext.jsx    # Socket provider and context
├── hooks/
│   └── useSocket.js          # Custom socket hooks
└── components/
    ├── SocketStatus.jsx      # Connection status widget
    └── SocketStatus.css      # Widget styles
```

## Components

### 1. SocketContext Provider

Located at: `src/context/SocketContext.jsx`

**Features:**
- Automatic connection with JWT token from localStorage
- Reconnection logic with exponential backoff
- Connection state management
- Error handling for authentication failures
- Automatic cleanup on unmount

**Usage:**
```jsx
import { SocketProvider } from './context/SocketContext';

// Wrap your app with SocketProvider
<SocketProvider>
  <App />
</SocketProvider>
```

### 2. Custom Hooks

Located at: `src/hooks/useSocket.js`

#### useSocket()
Get socket instance and connection state:
```jsx
import { useSocket } from '../context/SocketContext';

function MyComponent() {
  const { socket, isConnected, connectionError } = useSocket();
  
  // Use socket...
}
```

#### useSocketEvent()
Listen to socket events with automatic cleanup:
```jsx
import { useSocketEvent } from '../hooks/useSocket';

function MyComponent() {
  useSocketEvent('order:created', (data) => {
    console.log('New order:', data);
    // Handle notification
  });
  
  return <div>Listening for orders...</div>;
}
```

#### useSocketEmit()
Emit events to server:
```jsx
import { useSocketEmit } from '../hooks/useSocket';

function MyComponent() {
  const emit = useSocketEmit();
  
  const sendMessage = () => {
    emit('chat:message', { 
      message: 'Hello!',
      recipient: 'user123'
    });
  };
  
  return <button onClick={sendMessage}>Send</button>;
}
```

#### useSocketStatus()
Get connection status only:
```jsx
import { useSocketStatus } from '../hooks/useSocket';

function StatusBar() {
  const { isConnected, connectionError } = useSocketStatus();
  
  return (
    <div>
      Status: {isConnected ? 'Online' : 'Offline'}
      {connectionError && <span>Error: {connectionError}</span>}
    </div>
  );
}
```

#### useSocketPing()
Test connection latency:
```jsx
import { useSocketPing } from '../hooks/useSocket';

function PingTest() {
  const ping = useSocketPing();
  
  return <button onClick={ping}>Test Connection</button>;
}
```

### 3. SocketStatus Component

Located at: `src/components/SocketStatus.jsx`

**Features:**
- Visual connection indicator (green/red)
- Socket ID display
- Connection error messages
- Ping test button
- Real-time notification display

**Already integrated in DashboardLayout** - appears in bottom-right corner.

## Configuration

### Environment Variables

Create `.env` file in frontend directory:
```env
VITE_API_URL=http://localhost:5000
```

If not set, defaults to `http://localhost:5000`.

### Connection Options

In `SocketContext.jsx`, the socket is configured with:
```javascript
{
  auth: { token },           // JWT token from localStorage
  reconnection: true,        // Enable auto-reconnection
  reconnectionDelay: 1000,   // Initial delay (1 second)
  reconnectionDelayMax: 5000,// Max delay (5 seconds)
  reconnectionAttempts: 5    // Max attempts before giving up
}
```

## Usage Examples

### 1. Real-Time Notifications

```jsx
import { useSocketEvent } from '../hooks/useSocket';
import { useState } from 'react';

function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  
  // Listen for new notifications
  useSocketEvent('notification:new', (data) => {
    setNotifications(prev => [data, ...prev]);
  });
  
  // Listen for order updates
  useSocketEvent('order:created', (data) => {
    alert(`New order #${data.orderNumber} created!`);
  });
  
  return (
    <div>
      {notifications.map(notif => (
        <div key={notif.id}>{notif.message}</div>
      ))}
    </div>
  );
}
```

### 2. Product Updates

```jsx
import { useSocketEvent } from '../hooks/useSocket';

function ProductDetails({ productId }) {
  const [product, setProduct] = useState(null);
  
  // Listen for product updates
  useSocketEvent('product:updated', (data) => {
    if (data.productId === productId) {
      setProduct(prev => ({ ...prev, ...data.changes }));
      alert('Product updated!');
    }
  });
  
  return <div>{/* Product UI */}</div>;
}
```

### 3. Chat Application

```jsx
import { useSocketEvent, useSocketEmit } from '../hooks/useSocket';
import { useState } from 'react';

function ChatRoom() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const emit = useSocketEmit();
  
  // Listen for incoming messages
  useSocketEvent('chat:message:new', (data) => {
    setMessages(prev => [...prev, data]);
  });
  
  const sendMessage = () => {
    emit('chat:message', {
      message: input,
      recipientId: 'user123'
    });
    setInput('');
  };
  
  return (
    <div>
      <div className="messages">
        {messages.map(msg => (
          <div key={msg.messageId}>{msg.message}</div>
        ))}
      </div>
      <input 
        value={input} 
        onChange={(e) => setInput(e.target.value)}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
```

### 4. Order Status Updates

```jsx
import { useSocketEvent } from '../hooks/useSocket';
import { useEffect, useState } from 'react';

function OrderTracking({ orderId }) {
  const [status, setStatus] = useState('pending');
  
  useSocketEvent('order:status:changed', (data) => {
    if (data.orderId === orderId) {
      setStatus(data.newStatus);
      // Show toast notification
      toast.success(`Order status: ${data.newStatus}`);
    }
  });
  
  return (
    <div>
      <h3>Order Status: {status}</h3>
    </div>
  );
}
```

### 5. Admin Dashboard Real-Time Stats

```jsx
import { useSocketEvent } from '../hooks/useSocket';
import { useState } from 'react';

function AdminDashboard() {
  const [stats, setStats] = useState({});
  
  // Listen for stats updates (sent every 30 seconds)
  useSocketEvent('dashboard:stats:update', (data) => {
    setStats(data);
  });
  
  // Listen for new seller applications
  useSocketEvent('seller:application:new', (data) => {
    alert(`New seller application: ${data.businessName}`);
  });
  
  return (
    <div>
      <h2>Real-Time Stats</h2>
      <div>Total Orders: {stats.totalOrders}</div>
      <div>Active Users: {stats.activeUsers}</div>
    </div>
  );
}
```

## Authentication Flow

### 1. Login Flow
```jsx
// In your login component
const handleLogin = async (credentials) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });
  
  const { token } = await response.json();
  
  // Save token to localStorage
  localStorage.setItem('token', token);
  
  // Refresh page to initialize socket connection
  window.location.href = '/dashboard';
};
```

### 2. Logout Flow
```jsx
// In your logout component
import { useSocket } from '../context/SocketContext';

function LogoutButton() {
  const { socket } = useSocket();
  
  const handleLogout = () => {
    // Disconnect socket
    if (socket) {
      socket.disconnect();
    }
    
    // Clear token
    localStorage.removeItem('token');
    
    // Redirect to login
    window.location.href = '/login';
  };
  
  return <button onClick={handleLogout}>Logout</button>;
}
```

## Event Naming Conventions

Follow the same conventions as backend:

### Standard Events
- `{resource}:created` - New resource
- `{resource}:updated` - Resource updated
- `{resource}:deleted` - Resource deleted
- `{resource}:status:changed` - Status change

### Examples
- `order:created`
- `product:updated`
- `seller:application:approved`
- `notification:new`

## Error Handling

### Connection Errors

The SocketContext automatically handles:
- **No token**: Skips connection, shows "Not Initialized"
- **Token expired**: Clears token, optionally redirects to login
- **Invalid token**: Clears token, shows error
- **Network error**: Shows error, attempts reconnection

### Manual Error Handling

```jsx
import { useSocket } from '../context/SocketContext';

function MyComponent() {
  const { socket, connectionError } = useSocket();
  
  if (connectionError) {
    return (
      <div className="error">
        Failed to connect: {connectionError}
        <button onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }
  
  return <div>Connected!</div>;
}
```

## Performance Optimization

### 1. Memoize Callbacks

```jsx
import { useCallback } from 'react';
import { useSocketEvent } from '../hooks/useSocket';

function MyComponent() {
  // Memoize callback to prevent re-subscription
  const handleNotification = useCallback((data) => {
    console.log('Notification:', data);
  }, []);
  
  useSocketEvent('notification:new', handleNotification);
}
```

### 2. Conditional Event Listeners

```jsx
function ProductPage({ productId }) {
  // Only listen when productId exists
  useSocketEvent(
    'product:updated',
    (data) => {
      if (data.productId === productId) {
        // Update product
      }
    },
    !!productId // Only subscribe if productId exists
  );
}
```

### 3. Throttle Frequent Updates

```jsx
import { throttle } from 'lodash';
import { useSocketEvent } from '../hooks/useSocket';

function LiveStats() {
  // Throttle stats updates to once per second
  const handleStatsUpdate = useCallback(
    throttle((data) => {
      setStats(data);
    }, 1000),
    []
  );
  
  useSocketEvent('stats:update', handleStatsUpdate);
}
```

## Debugging

### Console Logs

All socket operations are logged with `[SOCKET]` prefix:
- `[SOCKET] Connecting to: http://localhost:5000`
- `[SOCKET] Connected: abc123xyz`
- `[SOCKET] Disconnected: transport close`
- `[SOCKET] Notification received: {...}`

### Chrome DevTools

1. Open DevTools → Network tab
2. Filter by "WS" (WebSocket)
3. Click on socket connection
4. View frames (messages) being sent/received

### Manual Testing

Open browser console:
```javascript
// Access socket from context (if exposed)
window.socket.emit('ping');
window.socket.on('pong', (data) => console.log('Pong:', data));
```

## Common Issues

### Issue: Socket Not Connecting
**Solution:** Check if token exists in localStorage:
```javascript
console.log('Token:', localStorage.getItem('token'));
```

### Issue: Events Not Received
**Solution:** Verify event name matches backend:
```javascript
// Check in browser console
socket.onAny((event, ...args) => {
  console.log('Event received:', event, args);
});
```

### Issue: Multiple Connections
**Solution:** Ensure SocketProvider is only mounted once at app root level.

## Testing

### Mock Socket for Tests

```jsx
import { jest } from '@jest/globals';

// Mock SocketContext
jest.mock('../context/SocketContext', () => ({
  useSocket: () => ({
    socket: {
      emit: jest.fn(),
      on: jest.fn(),
      off: jest.fn()
    },
    isConnected: true,
    connectionError: null
  })
}));
```

## Future Enhancements

- [ ] Offline queue for failed emissions
- [ ] Typing indicators for chat
- [ ] Presence detection (online/away)
- [ ] Sound notifications
- [ ] Desktop notifications API
- [ ] Toast notification integration
- [ ] Connection quality indicator
- [ ] Message encryption
