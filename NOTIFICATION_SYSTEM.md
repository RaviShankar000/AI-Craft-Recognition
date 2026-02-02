# Real-time Moderation Notifications

This feature provides real-time notifications to users when their products or seller applications are approved or rejected by admins.

## Features Implemented

### Commit 117: Backend Socket Emissions
- Emits socket events when admin approves/rejects products
- Emits socket events when admin approves/rejects seller applications
- Dual targeting: individual users + admin broadcast
- Events:
  - `moderation:product_approved`
  - `moderation:product_rejected`
  - `moderation:seller_approved`
  - `moderation:seller_rejected`
  - `moderation:product_status_changed` (admin only)
  - `moderation:seller_status_changed` (admin only)

### Commit 118: Frontend Notification System
- `useNotifications` hook for managing notifications
- `NotificationCenter` component with dropdown UI
- `NotificationService` backend service for structured notifications
- Real-time socket listeners for all moderation events
- Notification history (last 50)
- Mark as read/unread functionality
- Browser notification support (with permission)
- Sound notifications

### Commit 119: Toast Notifications
- `ToastProvider` context for global toast management
- Animated toast notifications (slide-in, fade-out)
- Auto-dismiss after 7 seconds
- Color-coded by type:
  - Green for approvals (success)
  - Red for rejections (error)
  - Orange for warnings
  - Blue for info
- Stacked notifications
- Mobile responsive

### Commit 120: Polling Fallback
- `usePollingFallback` hook for automatic polling when socket disconnects
- Polls every 15 seconds when offline
- `/api/notifications/updates` endpoint for polling
- `ConnectionStatus` indicator component
- Automatic recovery when socket reconnects
- Prevents duplicate notifications

## Usage

### Backend - Sending Notifications

```javascript
const NotificationService = require('./services/notificationService');

// Product moderation
NotificationService.notifyProductModeration(
  userId,
  { _id: productId, name: productName },
  'approved',
  'Great quality product!'
);

// Seller application
NotificationService.notifySellerApplication(
  userId,
  'approved',
  'Welcome to our platform!'
);

// Order status
NotificationService.notifyOrderStatus(
  userId,
  { _id: orderId, orderNumber: 'ORD-123' },
  'shipped'
);

// Low stock alert
NotificationService.notifyLowStock(
  sellerId,
  { _id: productId, name: productName, stock: 5 }
);

// System broadcast
NotificationService.broadcastSystemNotification(
  'System maintenance in 1 hour',
  'high'
);
```

### Frontend - Using Notifications

```jsx
import { useNotifications } from './hooks/useNotifications';
import NotificationCenter from './components/NotificationCenter';
import ConnectionStatus from './components/ConnectionStatus';

function App() {
  const { 
    notifications, 
    unreadCount, 
    isConnected, 
    isPolling 
  } = useNotifications();

  return (
    <div>
      <header>
        <NotificationCenter />
      </header>
      
      <ConnectionStatus 
        isConnected={isConnected} 
        isPolling={isPolling} 
      />
    </div>
  );
}
```

### Using Toasts

```jsx
import { useToast } from './components/ToastProvider';

function MyComponent() {
  const toast = useToast();

  const handleSuccess = () => {
    toast.success('Product created successfully!');
  };

  const handleError = () => {
    toast.error('Failed to create product');
  };

  const handleWarning = () => {
    toast.warning('Low stock warning', 10000); // 10 second duration
  };

  return (
    <div>
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleError}>Show Error</button>
      <button onClick={handleWarning}>Show Warning</button>
    </div>
  );
}
```

## API Endpoints

### GET /api/notifications/updates
Polling endpoint for fallback when socket disconnects.

**Query Parameters:**
- `since` (required): ISO timestamp of last poll

**Response:**
```json
{
  "success": true,
  "count": 2,
  "updates": [
    {
      "type": "product_approved",
      "title": "✅ Product Approved",
      "message": "Your product 'Handmade Vase' has been approved!",
      "data": {
        "productId": "...",
        "productName": "Handmade Vase",
        "status": "approved",
        "note": "Great quality!"
      },
      "timestamp": "2024-01-15T10:30:00.000Z",
      "priority": "normal"
    }
  ]
}
```

### GET /api/notifications/health
Health check endpoint.

## Configuration

### Polling Interval
Default: 15 seconds when disconnected

To change:
```jsx
const { isPolling } = usePollingFallback(socket, onUpdate, 30000); // 30 seconds
```

### Toast Duration
Default: 7 seconds (7000ms)

To change:
```jsx
toast.success('Message', 5000); // 5 seconds
```

### Notification History Limit
Default: 50 notifications

To change in `useNotifications.js`:
```javascript
.slice(0, 100) // Keep last 100
```

## Testing

1. **Test Real-time Notifications:**
   - Admin approves/rejects product
   - User should receive notification instantly
   - Toast should appear

2. **Test Polling Fallback:**
   - Disconnect network/socket
   - Connection status should show "Polling..."
   - Admin approves product
   - Within 15 seconds, notification should appear
   - Reconnect network
   - Should switch back to socket mode

3. **Test Browser Notifications:**
   - Grant notification permission
   - Approve/reject product
   - Browser notification should appear
   - Sound should play (if enabled)

## Troubleshooting

### Notifications not appearing
- Check socket connection: `isConnected` should be `true`
- Check browser console for errors
- Verify user is in correct room: `userId.toString()`
- Check backend logs for emission confirmations

### Polling not working
- Verify `/api/notifications/updates` endpoint responds
- Check authentication token is valid
- Verify `since` parameter is correct ISO timestamp
- Check browser console for polling errors

### Toasts not showing
- Verify `ToastProvider` wraps the app
- Check `useToast()` is called within provider
- Look for console errors in toast component

## Architecture

```
Backend:
  productController.js ──┐
  sellerController.js ────┼──> Socket.IO ──> Frontend
  notificationService.js ─┘

Frontend:
  SocketContext ──┐
  useNotifications ├──> NotificationCenter (UI)
  usePollingFallback ──> API (/api/notifications/updates)
  useToast ──> ToastContainer (UI)
```

## Future Enhancements

- [ ] Notification preferences (email, SMS, push)
- [ ] Notification categories/filters
- [ ] Mark multiple as read
- [ ] Export notification history
- [ ] Admin notification analytics
- [ ] Notification scheduling
- [ ] Rich media notifications (images, actions)
