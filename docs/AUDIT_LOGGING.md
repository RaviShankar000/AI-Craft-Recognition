# Audit Logging System

## Overview
Comprehensive audit logging system that tracks all critical role-based actions performed by admins and sellers. This ensures accountability, compliance, and security monitoring.

## Features

### Tracked Actions

#### 1. Seller Management
- **Seller Application Approved** (High Severity)
  - Who: Admin
  - What: Approval of seller application
  - Tracked: Business name, applicant ID, review note
  
- **Seller Application Rejected** (Medium Severity)
  - Who: Admin
  - What: Rejection of seller application
  - Tracked: Business name, applicant ID, rejection reason

#### 2. Product Management
- **Product Created** (Low-Medium Severity)
  - Who: Seller/Admin
  - What: New product creation
  - Tracked: Product name, price, stock, moderation status
  
- **Product Updated** (Low Severity)
  - Who: Seller/Admin (owner only)
  - What: Product modifications
  - Tracked: Product name, field changes (old vs new values)
  
- **Product Deleted** (Medium Severity)
  - Who: Seller/Admin (owner only)
  - What: Product removal
  - Tracked: Product name, deleted by role

#### 3. Product Moderation
- **Product Approved** (High Severity)
  - Who: Admin
  - What: Product moderation approval
  - Tracked: Product name, seller ID, moderation note
  
- **Product Rejected** (High Severity)
  - Who: Admin
  - What: Product moderation rejection
  - Tracked: Product name, seller ID, rejection reason

#### 4. User Management
- **User Role Changed** (Critical Severity)
  - Who: Admin
  - What: User role modification (user ↔ admin ↔ seller)
  - Tracked: Target user email, old role, new role, reason
  
- **User Account Status Changed** (High Severity)
  - Who: Admin
  - What: Account activation/deactivation
  - Tracked: Target user email, status change, reason
  
- **User Deleted** (Critical Severity)
  - Who: Admin
  - What: User account deletion/deactivation
  - Tracked: Target user email, user role, reason

#### 5. Order Management
- **Order Status Changed** (Medium Severity)
  - Who: Admin
  - What: Order status update
  - Tracked: Order number, status change, total amount

## Audit Log Model

### Schema Fields

```javascript
{
  // Actor
  user: ObjectId,           // Who performed the action
  userName: String,
  userEmail: String,
  userRole: String,         // admin/seller/user
  
  // Action
  action: String,           // e.g., 'seller_application_approved'
  category: String,         // seller_management, product_management, etc.
  severity: String,         // low/medium/high/critical
  description: String,      // Human-readable description
  
  // Target
  targetResource: {
    type: String,          // User, Product, Order, SellerApplication
    id: ObjectId,
    identifier: String     // Email, product name, order number
  },
  
  // Context
  metadata: Object,        // Additional action-specific data
  ipAddress: String,
  userAgent: String,
  status: String,          // success/failure/pending
  errorMessage: String,    // If action failed
  
  // Timestamps
  createdAt: Date
}
```

### Severity Levels

- **Low**: Minor actions (product updates, routine operations)
- **Medium**: Significant actions (deletions, status changes)
- **High**: Critical administrative actions (approvals, moderations)
- **Critical**: Security-sensitive actions (role changes, account deletions)

### Categories

- `seller_management`: Seller application processes
- `product_management`: Product CRUD operations
- `order_management`: Order status and management
- `user_management`: User account operations
- `role_change`: Role modifications
- `moderation`: Content moderation actions
- `system`: System-level operations

## API Endpoints

All audit log endpoints require **admin authentication**.

### Get Audit Logs
```
GET /api/audit-logs
```

**Query Parameters:**
- `userId`: Filter by user who performed action
- `category`: Filter by category
- `action`: Filter by specific action
- `severity`: Filter by severity level
- `startDate`: Filter logs after this date
- `endDate`: Filter logs before this date
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 50)

**Response:**
```json
{
  "success": true,
  "message": "Audit logs retrieved successfully",
  "data": [...logs...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 250,
    "pages": 5
  }
}
```

### Get Audit Log by ID
```
GET /api/audit-logs/:id
```

### Get Audit Log Statistics
```
GET /api/audit-logs/stats
```

**Query Parameters:**
- `startDate`: Start date for statistics
- `endDate`: End date for statistics

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 500,
    "byCategory": {
      "seller_management": 50,
      "product_management": 200,
      "moderation": 100,
      ...
    },
    "bySeverity": {
      "low": 200,
      "medium": 150,
      "high": 100,
      "critical": 50
    },
    "byRole": {
      "admin": 300,
      "seller": 200
    },
    "byStatus": {
      "success": 490,
      "failure": 10
    }
  }
}
```

### Get User Audit Logs
```
GET /api/audit-logs/user/:userId
```

**Query Parameters:**
- `page`: Page number
- `limit`: Results per page

### Get Recent Critical Logs
```
GET /api/audit-logs/critical/recent
```

**Query Parameters:**
- `limit`: Number of logs (default: 20)

Returns most recent logs with high or critical severity.

## Usage

### In Controllers

```javascript
const { logProductCreated } = require('../utils/auditLogger');

// After successful product creation
await logProductCreated(req.user, product, req);
```

### Available Logging Functions

```javascript
const {
  createAuditLog,                    // Generic audit log creation
  logSellerApplicationApproved,      // Seller approval
  logSellerApplicationRejected,      // Seller rejection
  logProductCreated,                 // Product creation
  logProductUpdated,                 // Product update
  logProductDeleted,                 // Product deletion
  logProductModerated,               // Product moderation
  logOrderStatusChanged,             // Order status change
  logUserRoleChanged,                // User role change
  logUserAccountStatusChanged,       // Account status change
  logUserDeleted,                    // User deletion
  logFailedAction,                   // Failed action attempt
} = require('../utils/auditLogger');
```

## Console Logging

All audit logs are also printed to console for real-time monitoring:

```
[AUDIT LOG] product_management - product_created: {
  user: 'seller@example.com',
  role: 'seller',
  severity: 'low',
  target: 'Handmade Ceramic Vase'
}
```

## Best Practices

### 1. Always Log Critical Actions
- User role changes
- Account deletions
- Seller approvals/rejections
- Product moderation decisions

### 2. Include Context
- Always pass the `req` object for IP and user agent tracking
- Provide descriptive action names and descriptions
- Include relevant metadata

### 3. Error Handling
- Audit logging failures don't break the main operation
- Errors are logged to console but don't throw exceptions
- Failed audit logs are tracked with `status: 'failure'`

### 4. Data Retention
- Consider implementing log rotation or archival
- Monitor database size as audit logs accumulate
- Set up indexes for efficient querying

### 5. Security
- Audit logs are immutable (no update/delete endpoints)
- Only admins can view audit logs
- Include IP address and user agent for security analysis

## Performance Considerations

### Indexes
The AuditLog model includes optimized indexes:
- `user + createdAt` - User activity timeline
- `category + createdAt` - Category filtering
- `action + createdAt` - Action filtering
- `severity + createdAt` - Severity filtering
- `createdAt` - Chronological queries

### Async Logging
Audit logging is asynchronous and doesn't block the main operation. If logging fails, the original action still succeeds.

## Monitoring & Alerting

### Suggested Alerts

1. **High Volume of Critical Actions**
   - Alert if >10 critical actions in 1 hour

2. **Failed Actions**
   - Alert on repeated failures by same user

3. **Unusual Patterns**
   - Off-hours admin activity
   - Multiple role changes in short time
   - Bulk deletions

4. **Security Events**
   - Failed login attempts (if tracked)
   - Unauthorized access attempts
   - Privilege escalation attempts

## Future Enhancements

- [ ] Export audit logs to CSV/JSON
- [ ] Real-time audit log streaming
- [ ] Advanced search and filtering UI
- [ ] Automatic anomaly detection
- [ ] Integration with SIEM systems
- [ ] Compliance report generation
- [ ] Log retention policies
- [ ] Audit log encryption at rest
