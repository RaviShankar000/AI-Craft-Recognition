# Socket Connection Lifecycle Handlers

## Overview
Comprehensive event handlers for Socket.IO connection lifecycle management including connection, disconnection, errors, and reconnection events.

## Files Created

### 1. Handler Module
**Location:** `src/handlers/socketHandlers.js`

Contains all lifecycle event handlers and connection management utilities.

## Event Handlers

### Connection Events

#### `handleConnection(socket)`
Handles new socket connections after successful authentication.

**Actions:**
- Logs connection details (socketId, userId, email, role)
- Tracks active connections per user
- Joins user to personal room (`user:{userId}`)
- Joins user to role-based room (`role:{role}`)
- Sends welcome message with connection details
- Notifies admins of new connections (monitoring)
- Creates audit log entry

**Emits to Client:**
```javascript
socket.emit('connection:success', {
  socketId: string,
  message: string,
  userId: string,
  userName: string,
  userRole: string,
  timestamp: number,
  activeConnections: number
});
```

#### `handleDisconnection(socket, reason)`
Handles socket disconnection and cleanup.

**Actions:**
- Logs disconnection details with reason
- Updates active connections tracking
- Notifies admins when user fully disconnects
- Creates audit log entry
- Translates technical reasons to user-friendly messages

**Disconnection Reasons:**
- `transport close` - Network connection lost
- `transport error` - Network error occurred
- `server namespace disconnect` - Server forced disconnection
- `client namespace disconnect` - Client initiated disconnect
- `ping timeout` - Client failed to respond to ping

### Error Handlers

#### `handleError(socket, error)`
Handles runtime socket errors.

**Actions:**
- Logs error with stack trace
- Emits error notification to client
- Creates audit log entry (medium severity)

**Emits to Client:**
```javascript
socket.emit('connection:error', {
  message: string,
  code: 'SOCKET_ERROR',
  timestamp: number
});
```

#### `handleConnectionError(socket, error)`
Handles errors that occur before successful connection.

**Actions:**
- Logs connection failure details
- Creates audit log entry (security category)

#### `handleAuthError(socket, error)`
Handles authentication failures.

**Actions:**
- Logs authentication error
- Sends auth error to client
- Forces disconnect after 1 second
- Creates high-severity audit log entry

**Emits to Client:**
```javascript
socket.emit('auth:error', {
  message: string,
  code: 'AUTH_ERROR',
  timestamp: number
});
```

#### `handleTimeout(socket)`
Handles connection timeout events.

**Actions:**
- Logs timeout warning
- Notifies client of timeout

**Emits to Client:**
```javascript
socket.emit('connection:timeout', {
  message: 'Connection timeout - please check your network',
  timestamp: number
});
```

### Reconnection Handlers

#### `handleReconnectAttempt(socket, attemptNumber)`
Handles reconnection attempt events.

**Actions:**
- Logs reconnection attempt details
- Notifies client of attempt in progress

**Emits to Client:**
```javascript
socket.emit('connection:reconnecting', {
  attemptNumber: number,
  message: string,
  timestamp: number
});
```

#### `handleReconnect(socket)`
Handles successful reconnection.

**Actions:**
- Logs successful reconnection
- Rejoins user to rooms (personal and role-based)
- Notifies client of successful reconnection
- Creates audit log entry

**Emits to Client:**
```javascript
socket.emit('connection:reconnected', {
  socketId: string,
  message: string,
  userId: string,
  userName: string,
  timestamp: number
});
```

### Utility Handlers

#### `handlePing(socket, data)`
Handles ping requests for connection health checks.

**Request:**
```javascript
socket.emit('ping', { timestamp: number });
```

**Response:**
```javascript
socket.emit('pong', {
  timestamp: number,        // Server response time
  clientTimestamp: number,  // Original client timestamp
  latency: number,          // Calculated latency (ms)
  socketId: string
});
```

## Connection Management Functions

### `getConnectionStats()`
Returns statistics about active connections.

**Returns:**
```javascript
{
  totalUsers: number,
  totalConnections: number,
  averageConnectionsPerUser: string,
  multipleConnectionUsers: [
    {
      userId: string,
      connectionCount: number
    }
  ],
  timestamp: string
}
```

### `getUserConnections(userId)`
Gets all active socket IDs for a specific user.

**Parameters:**
- `userId` (String) - User ID to check

**Returns:** Array of socket IDs

### `isUserConnected(userId)`
Checks if user has any active connections.

**Parameters:**
- `userId` (String) - User ID to check

**Returns:** Boolean

### `disconnectUser(io, userId, reason)`
Force disconnect all connections for a user.

**Parameters:**
- `io` (Object) - Socket.IO instance
- `userId` (String) - User ID to disconnect
- `reason` (String) - Reason for disconnection

**Actions:**
- Emits force_disconnect event to all user's sockets
- Disconnects all connections
- Creates high-severity audit log entry

**Emits to Client:**
```javascript
socket.emit('force_disconnect', {
  reason: string,
  message: string,
  timestamp: number
});
```

### `broadcastConnectionStats(io)`
Broadcasts connection statistics to all admins.

**Parameters:**
- `io` (Object) - Socket.IO instance

**Emits to Admins:**
```javascript
io.to('role:admin').emit('connection:stats', {
  totalUsers: number,
  totalConnections: number,
  averageConnectionsPerUser: string,
  multipleConnectionUsers: Array,
  timestamp: string
});
```

## Socket Configuration Updates

**Location:** `src/config/socket.js`

### Enhanced Configuration
```javascript
{
  cors: {
    origin: config.corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,        // 60 seconds
  pingInterval: 25000,       // 25 seconds
  connectTimeout: 45000,     // 45 seconds
  transports: ['websocket', 'polling']
}
```

### Registered Events
- `connection` - New connection
- `disconnect` - Disconnection
- `error` - Runtime errors
- `ping` - Health check requests
- `reconnect_attempt` - Reconnection attempts
- `reconnect` - Successful reconnection
- `auth_error` - Authentication failures
- `connect_timeout` - Connection timeout
- `disconnect_request` - Client disconnect request

### Auto-Broadcasting
Connection statistics are automatically broadcast to admins every 30 seconds.

## Admin API Endpoints

**Location:** `src/routes/socket.js`

### GET /api/socket/stats
Get connection statistics (Admin only).

**Response:**
```javascript
{
  success: true,
  data: {
    totalUsers: number,
    totalConnections: number,
    averageConnectionsPerUser: string,
    multipleConnectionUsers: Array,
    timestamp: string
  }
}
```

### GET /api/socket/user/:userId
Get connections for a specific user (Admin only).

**Response:**
```javascript
{
  success: true,
  data: {
    userId: string,
    isConnected: boolean,
    connectionCount: number,
    socketIds: Array<string>
  }
}
```

### POST /api/socket/disconnect/:userId
Force disconnect a user (Admin only).

**Request Body:**
```javascript
{
  reason: string  // Optional
}
```

**Response:**
```javascript
{
  success: true,
  message: string,
  data: {
    userId: string,
    reason: string
  }
}
```

### POST /api/socket/broadcast
Broadcast a message to all or specific room (Admin only).

**Request Body:**
```javascript
{
  event: string,     // Required - Event name
  data: any,         // Optional - Event data
  room: string       // Optional - Room name (if not provided, broadcasts to all)
}
```

**Response:**
```javascript
{
  success: true,
  message: string,
  data: {
    event: string,
    room: string,
    timestamp: number
  }
}
```

### GET /api/socket/health
Check socket server health (Public).

**Response:**
```javascript
{
  success: true,
  data: {
    status: 'healthy',
    socketServerRunning: boolean,
    totalUsers: number,
    totalConnections: number,
    // ... other stats
  }
}
```

## Audit Logging

All socket lifecycle events are logged to the audit system:

### Logged Events
- `socket:connected` - New connection (low severity)
- `socket:disconnected` - Disconnection (low severity)
- `socket:error` - Socket error (medium severity)
- `socket:connection_failed` - Connection failure (medium severity, security category)
- `socket:reconnected` - Successful reconnection (low severity)
- `socket:auth_failed` - Authentication failure (high severity, security category)
- `socket:force_disconnect` - Admin-forced disconnection (high severity, security category)

### Audit Log Structure
```javascript
{
  userId: string,
  action: string,
  category: 'system' | 'security',
  severity: 'low' | 'medium' | 'high' | 'critical',
  metadata: {
    socketId: string,
    userRole: string,
    errorMessage: string,
    // ... event-specific data
  }
}
```

## Frontend Integration

### Listening to Connection Events

```javascript
import { useSocketEvent } from '../hooks/useSocket';

function ConnectionMonitor() {
  // Listen for successful connection
  useSocketEvent('connection:success', (data) => {
    console.log('Connected:', data);
    toast.success(`Connected as ${data.userName}`);
  });
  
  // Listen for connection errors
  useSocketEvent('connection:error', (data) => {
    console.error('Connection error:', data);
    toast.error('Socket connection error');
  });
  
  // Listen for force disconnect
  useSocketEvent('force_disconnect', (data) => {
    console.warn('Force disconnected:', data.reason);
    alert(`Disconnected: ${data.message}`);
    window.location.href = '/login';
  });
  
  // Listen for reconnection events
  useSocketEvent('connection:reconnecting', (data) => {
    console.log('Reconnecting, attempt:', data.attemptNumber);
    toast.info(`Reconnecting... (attempt ${data.attemptNumber})`);
  });
  
  useSocketEvent('connection:reconnected', (data) => {
    console.log('Reconnected successfully');
    toast.success('Reconnected to server');
  });
  
  // Listen for auth errors
  useSocketEvent('auth:error', (data) => {
    console.error('Authentication error:', data);
    localStorage.removeItem('token');
    window.location.href = '/login';
  });
  
  return null;
}
```

### Admin Dashboard - Connection Stats

```javascript
import { useSocketEvent } from '../hooks/useSocket';
import { useState } from 'react';

function AdminConnectionMonitor() {
  const [stats, setStats] = useState(null);
  const [newConnections, setNewConnections] = useState([]);
  
  // Listen for stats updates (every 30 seconds)
  useSocketEvent('connection:stats', (data) => {
    setStats(data);
  });
  
  // Listen for new user connections
  useSocketEvent('user:connected', (data) => {
    setNewConnections(prev => [data, ...prev].slice(0, 10));
  });
  
  // Listen for user disconnections
  useSocketEvent('user:disconnected', (data) => {
    console.log('User disconnected:', data.userName);
  });
  
  return (
    <div>
      <h3>Connection Statistics</h3>
      {stats && (
        <div>
          <p>Total Users: {stats.totalUsers}</p>
          <p>Total Connections: {stats.totalConnections}</p>
          <p>Avg per User: {stats.averageConnectionsPerUser}</p>
        </div>
      )}
      
      <h3>Recent Connections</h3>
      {newConnections.map(conn => (
        <div key={conn.socketId}>
          {conn.userName} ({conn.userRole})
        </div>
      ))}
    </div>
  );
}
```

## Testing

### Manual Testing

#### 1. Test Connection
```bash
# Login to application
# Check console for: [SOCKET] Connection established

# Check SocketStatus component shows:
# - Green indicator
# - Socket ID
# - "Connected" status
```

#### 2. Test Disconnection
```bash
# Close browser or disable network
# Should see reconnection attempts
# After max attempts, shows disconnected

# Check console for: [SOCKET] Connection closed
```

#### 3. Test Ping
```bash
# Click "Test Connection" button in SocketStatus
# Should see latency measurement
# Check console for round-trip time
```

#### 4. Test Admin Stats
```bash
# Login as admin
# GET /api/socket/stats
# Should return connection statistics
```

#### 5. Test Force Disconnect
```bash
# As admin: POST /api/socket/disconnect/:userId
# Target user should be immediately disconnected
# Should see force_disconnect event
```

### Automated Testing

```javascript
const io = require('socket.io-client');

describe('Socket Connection Lifecycle', () => {
  let socket;
  const token = 'valid-jwt-token';
  
  beforeEach(() => {
    socket = io('http://localhost:5000', {
      auth: { token }
    });
  });
  
  afterEach(() => {
    socket.disconnect();
  });
  
  test('should receive connection:success event', (done) => {
    socket.on('connection:success', (data) => {
      expect(data.socketId).toBeDefined();
      expect(data.userId).toBeDefined();
      done();
    });
  });
  
  test('should handle ping/pong', (done) => {
    const pingTime = Date.now();
    socket.emit('ping', { timestamp: pingTime });
    
    socket.on('pong', (data) => {
      expect(data.latency).toBeDefined();
      expect(data.latency).toBeGreaterThan(0);
      done();
    });
  });
  
  test('should receive force_disconnect', (done) => {
    socket.on('force_disconnect', (data) => {
      expect(data.reason).toBeDefined();
      expect(data.message).toBeDefined();
      done();
    });
    
    // Simulate admin action
    // ... trigger force disconnect
  });
});
```

## Monitoring & Debugging

### Console Logs
All events are logged with `[SOCKET]` prefix:
```
[SOCKET] Connection established: {...}
[SOCKET] User disconnected: {...}
[SOCKET] Socket error occurred: {...}
[SOCKET] Successfully reconnected: {...}
```

### Admin Dashboard
- Real-time connection count
- Active users list
- Connection/disconnection events
- Error monitoring

### Audit Logs
Query audit logs for socket events:
```bash
GET /api/audit-logs?category=system&action=socket:connected
GET /api/audit-logs?severity=high&category=security
```

## Security Considerations

### Authentication
- All connections require valid JWT token
- Authentication happens before connection event
- Failed auth immediately disconnects socket

### Authorization
- Admin-only endpoints protected with `authorizeRoles('admin')`
- Force disconnect requires admin privileges
- Broadcast requires admin privileges

### Rate Limiting
Socket admin endpoints use standard rate limiting:
- Protected by `authLimiter` (5 requests per 15 minutes)

### Audit Trail
- All connections/disconnections logged
- Security events (auth failures, force disconnects) flagged
- High-severity events for security incidents

## Performance

### Connection Tracking
- O(1) lookup for user connections (Map data structure)
- Efficient add/remove operations
- Memory cleanup on full disconnection

### Stats Broadcasting
- 30-second interval for admin updates
- Only admins receive broadcasts
- Minimal server overhead

### Audit Logging
- Async logging (non-blocking)
- Error handling prevents server crashes
- Batch operations for efficiency

## Future Enhancements

- [ ] Connection quality metrics (latency, packet loss)
- [ ] Geolocation tracking for connections
- [ ] Connection history analytics
- [ ] Alert system for suspicious patterns
- [ ] Rate limiting per user/socket
- [ ] Connection pooling optimization
- [ ] Heartbeat monitoring dashboard
- [ ] Automatic reconnection strategies
- [ ] Circuit breaker for failing connections
