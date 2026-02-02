# Socket Debug Logging

## Overview
Comprehensive debug logging system for Socket.IO events during development. Provides colorized console output, event statistics, performance metrics, and debugging utilities.

## Features

✅ **Colorized Console Output** - Easy-to-read color-coded logs
✅ **Event Tracking** - Statistics for all socket events
✅ **Performance Monitoring** - Track event handler execution time
✅ **Authorization Logging** - Debug role-based access control
✅ **Error Tracking** - Detailed error logging with stack traces
✅ **Room Management** - Track room joins/leaves
✅ **Automatic Stats** - Periodic statistics printing
✅ **Runtime Toggle** - Enable/disable logging via API

## Activation

### Automatic (Development)
Debug logging is **automatically enabled** in development mode (`NODE_ENV=development`).

### Manual (Production)
Enable in production by setting environment variable:
```bash
DEBUG_SOCKET=true
```

Or via Admin API:
```bash
POST /api/socket/debug/toggle
{
  "enabled": true
}
```

## Log Categories

### Connection Logs
**Prefix:** `[SOCKET:CONN]` (Green)

Tracks socket connections with user details:
```
[2026-02-02T10:30:45.123Z] [SOCKET:CONN] Middleware: Authentication in progress
{
  "socketId": "abc123",
  "userId": "507f1f77bcf86cd799439011",
  "userRole": "seller",
  "email": "seller@example.com",
  "connected": true,
  "rooms": ["user:507f1f77bcf86cd799439011", "role:seller"]
}
```

### Disconnection Logs
**Prefix:** `[SOCKET:DISC]` (Yellow)

Tracks disconnections with reason:
```
[2026-02-02T10:35:12.456Z] [SOCKET:DISC] Disconnected: transport close
{
  "socketId": "abc123",
  "userId": "507f1f77bcf86cd799439011",
  "userRole": "seller",
  "reason": "transport close"
}
```

### Event Emission Logs
**Prefix:** `[SOCKET:EMIT]` (Cyan)

Tracks server → client events:
```
[2026-02-02T10:30:50.789Z] [SOCKET:EMIT] connection:success -> abc123
{
  "event": "connection:success",
  "target": "abc123",
  "data": { "userId": "...", "message": "..." },
  "count": 1
}
```

### Event Reception Logs
**Prefix:** `[SOCKET:RECV]` (Blue)

Tracks client → server events:
```
[2026-02-02T10:31:05.234Z] [SOCKET:RECV] seller:product_create <- 507f1f77bcf86cd799439011
{
  "event": "seller:product_create",
  "from": { "socketId": "abc123", "userId": "...", ... },
  "data": { "name": "Handmade Vase", "price": 50 },
  "count": 3
}
```

### Authorization Logs
**Prefix:** `[SOCKET:AUTH]` (Green/Red)

Tracks role-based authorization checks:
```
[2026-02-02T10:31:06.123Z] [SOCKET:AUTH] AUTHORIZED - seller:product_create
{
  "event": "seller:product_create",
  "userId": "507f1f77bcf86cd799439011",
  "userRole": "seller",
  "requiredRoles": ["admin", "seller"],
  "authorized": true
}
```

Denied access:
```
[2026-02-02T10:31:10.456Z] [SOCKET:AUTH] DENIED - admin:broadcast
{
  "event": "admin:broadcast",
  "userId": "507f1f77bcf86cd799439011",
  "userRole": "seller",
  "requiredRoles": ["admin"],
  "authorized": false
}
```

### Validation Logs
**Prefix:** `[SOCKET:VALID]` (Green/Yellow)

Tracks data validation results:
```
[2026-02-02T10:31:07.789Z] [SOCKET:VALID] VALID - seller:product_create
{
  "event": "seller:product_create",
  "userId": "507f1f77bcf86cd799439011",
  "valid": true
}
```

Failed validation:
```
[2026-02-02T10:31:15.234Z] [SOCKET:VALID] INVALID - seller:product_create
{
  "event": "seller:product_create",
  "userId": "507f1f77bcf86cd799439011",
  "valid": false,
  "error": "Price exceeds maximum allowed for seller: 10000"
}
```

### Error Logs
**Prefix:** `[SOCKET:ERROR]` (Red)

Tracks errors with stack traces:
```
[2026-02-02T10:31:20.567Z] [SOCKET:ERROR] seller:product_create - Database connection failed
{
  "event": "seller:product_create",
  "from": { "socketId": "abc123", ... },
  "error": {
    "message": "Database connection failed",
    "stack": "Error: Database connection failed\n    at ...",
    "code": "ECONNREFUSED"
  },
  "errorCount": 1
}
```

### Room Logs
**Prefix:** `[SOCKET:ROOM]` (Magenta)

Tracks room operations:
```
[2026-02-02T10:30:46.123Z] [SOCKET:ROOM] JOIN - user:507f1f77bcf86cd799439011
{
  "action": "JOIN",
  "room": "user:507f1f77bcf86cd799439011",
  "userId": "507f1f77bcf86cd799439011",
  "socketId": "abc123"
}
```

### Broadcast Logs
**Prefix:** `[SOCKET:BCAST]` (Bright Cyan)

Tracks broadcast operations:
```
[2026-02-02T10:32:00.123Z] [SOCKET:BCAST] notification:new -> role:admin
{
  "event": "notification:new",
  "target": "role:admin",
  "data": { "message": "New seller application" }
}
```

### Performance Logs
**Prefix:** `[SOCKET:PERF]` (Green/Yellow/Red)

Tracks event handler execution time:
```
[2026-02-02T10:31:08.456Z] [SOCKET:PERF] seller:product_create - 45ms
{
  "operation": "seller:product_create",
  "duration": "45ms",
  "success": true
}
```

Slow operation (>500ms):
```
[2026-02-02T10:31:25.789Z] [SOCKET:PERF] chat:message - 1.25s
{
  "operation": "chat:message",
  "duration": "1250ms",
  "success": true
}
```

## Statistics

### Event Statistics
Automatically tracked for all events:
- Total events processed
- Events per minute
- Event counts by type
- Error counts by event
- Top 10 most used events

### Accessing Statistics

#### Console (Development)
Statistics are automatically printed every 5 minutes in development:
```
═══════════════════════════════════════════════════
           SOCKET EVENT STATISTICS
═══════════════════════════════════════════════════

Uptime: 10.5m
Total Events: 245
Events/Minute: 23.33

Top Events:
  1. ping: 50
  2. seller:product_create: 25
  3. chat:message: 20
  4. user:cart_update: 18
  5. notification:read: 15

Errors:
  seller:product_create: 2
  chat:message: 1

═══════════════════════════════════════════════════
```

#### Admin API
```bash
GET /api/socket/debug/stats
Authorization: Bearer {admin_token}
```

Response:
```json
{
  "success": true,
  "data": {
    "uptime": "10.5m",
    "totalEvents": 245,
    "eventsPerMinute": "23.33",
    "eventCounts": {
      "ping": 50,
      "seller:product_create": 25,
      "chat:message": 20
    },
    "errorCounts": {
      "seller:product_create": 2,
      "chat:message": 1
    },
    "topEvents": [
      { "event": "ping", "count": 50 },
      { "event": "seller:product_create", "count": 25 }
    ],
    "debugEnabled": true
  }
}
```

## Admin API Endpoints

### GET /api/socket/debug/stats
Get socket debug statistics.

**Access:** Admin only

**Response:**
```json
{
  "success": true,
  "data": {
    "uptime": "10.5m",
    "totalEvents": 245,
    "eventsPerMinute": "23.33",
    "eventCounts": {},
    "errorCounts": {},
    "topEvents": [],
    "debugEnabled": true
  }
}
```

### POST /api/socket/debug/reset
Reset debug statistics.

**Access:** Admin only

**Response:**
```json
{
  "success": true,
  "message": "Debug statistics reset successfully"
}
```

### POST /api/socket/debug/toggle
Enable or disable debug logging at runtime.

**Access:** Admin only

**Request:**
```json
{
  "enabled": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Debug logging enabled",
  "data": {
    "debugEnabled": true
  }
}
```

## Usage in Code

### Import Logger
```javascript
const { logger } = require('../utils/socketDebugLogger');
```

### Log Connection
```javascript
logger.connection(socket, 'User authenticated successfully', {
  additionalData: 'value'
});
```

### Log Event Emission
```javascript
logger.emit('notification:new', 'role:admin', {
  message: 'New notification'
});
```

### Log Event Reception
```javascript
logger.receive(socket, 'chat:message', {
  message: 'Hello!'
});
```

### Log Authorization
```javascript
logger.auth(socket, 'admin:broadcast', true, ['admin']);
```

### Log Validation
```javascript
logger.validation(socket, 'seller:product_create', false, 'Price too high');
```

### Log Errors
```javascript
logger.error(socket, 'seller:product_create', error, {
  additionalContext: 'value'
});
```

### Log Room Operations
```javascript
logger.room(socket, 'JOIN', 'chat:room123');
logger.room(socket, 'LEAVE', 'chat:room123');
```

### Log Broadcasts
```javascript
logger.broadcast('notification:new', 'all', { message: 'Hello' });
```

### Log Performance
```javascript
const startTime = Date.now();
// ... perform operation
const duration = Date.now() - startTime;
logger.performance('database_query', duration);
```

### General Logging
```javascript
logger.info('Server started');
logger.warn('High memory usage');
logger.debug('Processing request');
```

## Performance Monitoring

### Wrap Handler with Performance Logging
```javascript
const { withPerformanceLogging } = require('../utils/socketDebugLogger');

const handler = withPerformanceLogging('seller:product_create', async (data) => {
  // Handler code...
  // Automatically logs execution time
});
```

### Color Coding
- **Green** (<500ms): Good performance
- **Yellow** (500-1000ms): Moderate performance
- **Red** (>1000ms): Slow performance

## Automatic Middleware

### Logging Middleware
Automatically logs all incoming and outgoing events:

```javascript
const { createLoggingMiddleware } = require('../utils/socketDebugLogger');

io.use(createLoggingMiddleware());
```

This middleware:
- Logs all incoming events (client → server)
- Logs all outgoing events (server → client)
- Excludes ping/pong events to reduce noise
- Automatically applied in socket configuration

## Data Truncation

Large data objects are automatically truncated to keep logs readable:
- Strings longer than 100 characters: `"long string content..."`
- Objects with large JSON: `{"key":"value",...`

## Environment Variables

### DEBUG_SOCKET
Enable debug logging:
```bash
# .env file
DEBUG_SOCKET=true
```

### NODE_ENV
Debug logging automatically enabled when:
```bash
NODE_ENV=development
```

## Log Colors

### Available Colors
- **Black**: Dim text
- **Red**: Errors, failed operations
- **Green**: Success, connections, authorized
- **Yellow**: Warnings, disconnections, validation failures
- **Blue**: Event reception
- **Magenta**: Room operations
- **Cyan**: Event emission
- **White**: General info
- **Dim**: Timestamps, secondary info
- **Bright**: Emphasis

## Best Practices

### 1. Use Appropriate Log Levels
```javascript
// Connection events
logger.connection(socket, 'User connected');

// Regular events
logger.receive(socket, eventName, data);

// Errors
logger.error(socket, eventName, error);

// Performance critical
logger.performance('operation', duration);
```

### 2. Include Relevant Context
```javascript
logger.error(socket, 'database_query', error, {
  query: 'SELECT * FROM users',
  params: { userId: '123' }
});
```

### 3. Avoid Logging Sensitive Data
```javascript
// Bad
logger.receive(socket, 'auth:login', {
  password: 'secret123'
});

// Good
logger.receive(socket, 'auth:login', {
  email: 'user@example.com'
  // password omitted
});
```

### 4. Use Performance Logging for Slow Operations
```javascript
const { withPerformanceLogging } = require('../utils/socketDebugLogger');

const slowHandler = withPerformanceLogging('database_query', async () => {
  // Database operation
});
```

### 5. Reset Stats Periodically
In production, reset stats periodically to prevent memory growth:
```javascript
// Every 24 hours
setInterval(() => {
  resetStats();
}, 24 * 60 * 60 * 1000);
```

## Troubleshooting

### Issue: Logs Not Appearing

**Check 1:** Verify DEBUG_SOCKET is set:
```bash
echo $DEBUG_SOCKET
```

**Check 2:** Verify NODE_ENV:
```bash
echo $NODE_ENV
```

**Check 3:** Enable via API:
```bash
POST /api/socket/debug/toggle
{ "enabled": true }
```

### Issue: Too Many Logs

**Solution 1:** Disable in production:
```bash
DEBUG_SOCKET=false
```

**Solution 2:** Filter events in middleware:
```javascript
// Exclude specific events
if (!eventName.startsWith('ping')) {
  logger.receive(socket, eventName, data);
}
```

### Issue: Performance Impact

Debug logging has minimal impact:
- ~0.1ms per log call
- Automatic data truncation
- Conditional execution (dev only)

To minimize impact:
- Disable in production
- Use `withPerformanceLogging` sparingly
- Avoid logging in tight loops

## Testing

### Enable Debug in Tests
```javascript
const { setDebugEnabled } = require('../utils/socketDebugLogger');

beforeAll(() => {
  setDebugEnabled(true);
});

afterAll(() => {
  setDebugEnabled(false);
});
```

### Check Statistics in Tests
```javascript
const { getStats, resetStats } = require('../utils/socketDebugLogger');

test('event is tracked', async () => {
  // Emit event
  socket.emit('test:event', { data: 'test' });
  
  // Check stats
  const stats = getStats();
  expect(stats.eventCounts['test:event']).toBe(1);
  
  // Clean up
  resetStats();
});
```

## Performance Tips

1. **Auto-enabled in development** - No configuration needed
2. **Minimal overhead** - Logs only in dev mode by default
3. **Truncated data** - Large objects automatically shortened
4. **Colored output** - Easy to scan visually
5. **Event filtering** - Ping/pong excluded by default
6. **Stats tracking** - Minimal memory footprint
7. **Periodic stats** - Auto-print every 5 minutes in dev

## Security Considerations

### Sensitive Data
Never log:
- Passwords
- JWT tokens
- API keys
- Credit card numbers
- Personal identification numbers

### Production
Disable debug logging in production:
```bash
NODE_ENV=production
DEBUG_SOCKET=false
```

### Admin Access
Debug statistics and toggle endpoints are admin-only:
- `GET /api/socket/debug/stats` - Admin only
- `POST /api/socket/debug/reset` - Admin only
- `POST /api/socket/debug/toggle` - Admin only

## Example Output

```
[2026-02-02T10:30:45.123Z] [SOCKET:CONN] User authenticated successfully
{
  "socketId": "abc123",
  "userId": "507f1f77bcf86cd799439011",
  "userRole": "seller",
  "connected": true
}

[2026-02-02T10:30:46.123Z] [SOCKET:ROOM] JOIN - user:507f1f77bcf86cd799439011

[2026-02-02T10:31:05.234Z] [SOCKET:RECV] seller:product_create <- 507f1f77bcf86cd799439011

[2026-02-02T10:31:06.123Z] [SOCKET:AUTH] AUTHORIZED - seller:product_create

[2026-02-02T10:31:07.789Z] [SOCKET:VALID] VALID - seller:product_create

[2026-02-02T10:31:08.456Z] [SOCKET:PERF] seller:product_create - 45ms

[2026-02-02T10:31:09.123Z] [SOCKET:EMIT] seller:product:new -> role:admin
```

## Future Enhancements

- [ ] Export logs to file
- [ ] Integration with logging services (Winston, Bunyan)
- [ ] WebSocket for real-time log streaming to admin dashboard
- [ ] Log filtering by user/role
- [ ] Custom log formatters
- [ ] Log rotation
- [ ] Performance profiling
- [ ] Memory usage tracking
