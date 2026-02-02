# Socket.IO Real-Time Communication

## Overview
Socket.IO server implementation with JWT authentication for secure real-time bidirectional communication between clients and server.

## Features

### 🔐 JWT Authentication
- All socket connections require valid JWT token
- Automatic user identification and role assignment
- Token validation on connection
- User context attached to every socket

### 👤 User Context
Each authenticated socket has:
- `socket.userId` - User MongoDB ID
- `socket.userEmail` - User email address
- `socket.userName` - User display name
- `socket.userRole` - User role (admin/seller/user)

### 🏠 Automatic Room Assignment
On connection, users are automatically joined to:
- **Personal room**: `user:${userId}` - For user-specific notifications
- **Role room**: `role:${userRole}` - For role-based broadcasts

## Architecture

### Files Structure
```
src/
├── config/
│   └── socket.js          # Socket.IO initialization
├── middleware/
│   └── socketAuth.js      # JWT authentication middleware
└── utils/
    └── socketEmitter.js   # Event emission helpers
```

## Installation

Socket.IO is already installed and configured:
```bash
npm install socket.io
```

## Configuration

### Server Setup (server.js)
```javascript
const { initializeSocket, setIO } = require('./src/config/socket');

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with authentication
const io = initializeSocket(server);
setIO(io);

// Start server
server.listen(port, () => {
  console.log('Server running with Socket.IO');
});
```

### CORS Configuration
Socket.IO uses the same CORS settings as the Express app:
```javascript
cors: {
  origin: config.corsOrigin,  // From environment variable
  methods: ['GET', 'POST'],
  credentials: true
}
```

## Client Connection

### Frontend Integration

#### Install Socket.IO Client
```bash
npm install socket.io-client
```

#### Connect with JWT Token
```javascript
import { io } from 'socket.io-client';

// Get JWT token from localStorage/context
const token = localStorage.getItem('token');

// Connect to server
const socket = io('http://localhost:5000', {
  auth: {
    token: token
  }
});

// Connection successful
socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

// Authentication error
socket.on('connect_error', (error) => {
  console.error('Connection failed:', error.message);
});

// Disconnection
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});
```

### Connection Events

#### Server → Client
- `connect` - Connection established
- `disconnect` - Connection closed
- `connect_error` - Authentication/connection failed
- `force_disconnect` - Admin forced disconnection
- `pong` - Response to ping (connection health check)

#### Client → Server
- `ping` - Health check request

## Authentication Middleware

### Required Authentication
```javascript
const { authenticateSocket } = require('../middleware/socketAuth');

io.use(authenticateSocket);
```

Rejects connections without valid JWT token.

### Optional Authentication
```javascript
const { optionalSocketAuth } = require('../middleware/socketAuth');

io.use(optionalSocketAuth);
```

Allows both authenticated and guest connections. Guest sockets have:
- `socket.userId = null`
- `socket.userRole = 'guest'`
- `socket.isAuthenticated = false`

### Role-Based Access
```javascript
const { requireRole } = require('../middleware/socketAuth');

// Admin-only namespace
const adminNamespace = io.of('/admin');
adminNamespace.use(authenticateSocket);
adminNamespace.use(requireRole('admin'));
```

## Event Emission Utilities

### Import
```javascript
const {
  emitToUser,
  emitToRole,
  emitToAdmins,
  emitToSellers,
  emitToAll,
  emitToRoom
} = require('../utils/socketEmitter');
```

### Usage Examples

#### Send to Specific User
```javascript
// Notify user about new order
emitToUser(userId, 'order:created', {
  orderId: order._id,
  orderNumber: order.orderNumber,
  message: 'Your order has been placed successfully'
});
```

#### Send to All Admins
```javascript
// Notify admins of new seller application
emitToAdmins('seller:application:new', {
  applicationId: application._id,
  businessName: application.businessName,
  applicantEmail: user.email
});
```

#### Send to All Sellers
```javascript
// Notify sellers of new product policy
emitToSellers('product:policy:updated', {
  message: 'Product moderation policy has been updated',
  effectiveDate: new Date()
});
```

#### Broadcast to All Users
```javascript
// System-wide announcement
emitToAll('system:announcement', {
  title: 'Scheduled Maintenance',
  message: 'System will be down for maintenance at 2 AM',
  priority: 'high'
});
```

#### Send to Custom Room
```javascript
// Product update notification to watchers
emitToRoom(`product:${productId}`, 'product:updated', {
  productId,
  changes: ['price', 'stock']
});
```

## Use Cases

### 1. Order Notifications
```javascript
// In orderController.js
const { emitToUser, emitToSellers } = require('../utils/socketEmitter');

// After order creation
emitToUser(order.user, 'order:created', {
  orderId: order._id,
  orderNumber: order.orderNumber,
  total: order.totalAmount
});

// Notify seller
emitToUser(product.seller, 'order:received', {
  orderId: order._id,
  productName: product.name
});
```

### 2. Product Moderation
```javascript
// In productController.js
const { emitToUser } = require('../utils/socketEmitter');

// Product approved
emitToUser(product.seller, 'product:approved', {
  productId: product._id,
  productName: product.name,
  message: 'Your product has been approved'
});
```

### 3. Seller Application Updates
```javascript
// In sellerController.js
const { emitToUser, emitToAdmins } = require('../utils/socketEmitter');

// New application submitted
emitToAdmins('seller:application:new', {
  applicationId: application._id,
  businessName: application.businessName
});

// Application approved
emitToUser(application.user, 'seller:application:approved', {
  message: 'Your seller application has been approved!',
  businessName: application.businessName
});
```

### 4. Real-Time Chat
```javascript
// In chatController.js
socket.on('chat:message', async (data) => {
  const { recipientId, message } = data;
  
  // Save message to database
  const chatMessage = await ChatMessage.create({
    sender: socket.userId,
    recipient: recipientId,
    message
  });
  
  // Send to recipient
  emitToUser(recipientId, 'chat:message:new', {
    messageId: chatMessage._id,
    from: socket.userEmail,
    message,
    timestamp: chatMessage.createdAt
  });
});
```

### 5. Admin Dashboard Real-Time Stats
```javascript
// Periodic stats update to admin dashboard
setInterval(() => {
  const stats = await getRealtimeStats();
  emitToAdmins('dashboard:stats:update', stats);
}, 30000); // Every 30 seconds
```

## Advanced Features

### Check User Online Status
```javascript
const { isUserOnline } = require('../utils/socketEmitter');

const online = await isUserOnline(userId);
if (online) {
  // User is connected, send real-time notification
} else {
  // User is offline, queue notification or send email
}
```

### Get User's Active Connections
```javascript
const { getUserSockets } = require('../utils/socketEmitter');

const socketIds = await getUserSockets(userId);
console.log(`User has ${socketIds.length} active connections`);
```

### Force Disconnect User
```javascript
const { disconnectUser } = require('../utils/socketEmitter');

// Ban user or account deactivation
await disconnectUser(userId, 'Account has been suspended');
```

### Room User Count
```javascript
const { getRoomUserCount } = require('../utils/socketEmitter');

const count = await getRoomUserCount('role:admin');
console.log(`${count} admins currently online`);
```

## Event Naming Conventions

Use colon-separated namespaces:
- `resource:action` - e.g., `order:created`, `product:updated`
- `resource:action:detail` - e.g., `seller:application:approved`

### Standard Events
- `{resource}:created` - New resource created
- `{resource}:updated` - Resource updated
- `{resource}:deleted` - Resource deleted
- `{resource}:status:changed` - Status change
- `notification:new` - Generic notification
- `system:announcement` - System-wide message

## Security Considerations

### ✅ Implemented
- JWT token verification on connection
- User role attached to socket context
- Automatic room isolation by user ID
- Role-based event filtering
- Token expiration handling

### 🔐 Best Practices
1. **Always validate data** received from socket events
2. **Check permissions** before emitting sensitive data
3. **Rate limit** socket events to prevent spam
4. **Sanitize user input** in socket messages
5. **Log suspicious activity** for security monitoring

## Error Handling

### Connection Errors
```javascript
socket.on('connect_error', (error) => {
  if (error.message === 'Authentication token required') {
    // Redirect to login
  } else if (error.message === 'Authentication token expired') {
    // Refresh token and reconnect
  }
});
```

### Server-Side Error Handling
```javascript
socket.on('error', (error) => {
  console.error('[SOCKET ERROR]', error);
  socket.emit('error:message', {
    message: 'An error occurred',
    code: 'SOCKET_ERROR'
  });
});
```

## Performance Optimization

### Connection Pooling
- Reuse socket connections
- Implement reconnection logic with exponential backoff

### Event Throttling
```javascript
// Throttle rapid events
const throttle = require('lodash.throttle');

const throttledEmit = throttle((userId, event, data) => {
  emitToUser(userId, event, data);
}, 1000); // Max once per second
```

### Namespaces for Scaling
```javascript
// Separate heavy-traffic features
const chatNamespace = io.of('/chat');
const notificationNamespace = io.of('/notifications');
```

## Monitoring & Debugging

### Console Logs
All socket operations are logged with prefixes:
- `[SOCKET]` - Connection/disconnection events
- `[SOCKET AUTH]` - Authentication events
- `[SOCKET EMIT]` - Event emissions
- `[SOCKET ERROR]` - Error events

### Connection Info
```javascript
socket.on('connection', (socket) => {
  console.log({
    socketId: socket.id,
    userId: socket.userId,
    email: socket.userEmail,
    role: socket.userRole,
    connectedAt: new Date()
  });
});
```

## Testing

### Manual Testing
```javascript
// In browser console
const socket = io('http://localhost:5000', {
  auth: { token: 'your-jwt-token' }
});

socket.on('connect', () => console.log('Connected'));
socket.emit('ping');
socket.on('pong', (data) => console.log('Pong:', data));
```

### Integration Testing
```javascript
const io = require('socket.io-client');

describe('Socket.IO', () => {
  it('should authenticate with valid token', (done) => {
    const socket = io('http://localhost:5000', {
      auth: { token: validToken }
    });
    
    socket.on('connect', () => {
      expect(socket.connected).toBe(true);
      socket.disconnect();
      done();
    });
  });
});
```

## Future Enhancements

- [ ] Redis adapter for horizontal scaling
- [ ] Message queue for offline user notifications
- [ ] Typing indicators for chat
- [ ] Presence detection (online/away/offline)
- [ ] Socket event rate limiting
- [ ] Encrypted socket communication
- [ ] Socket analytics dashboard
