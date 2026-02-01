# Seller Application Workflow - Testing Guide

## Overview
The seller application system allows users to apply for seller status, which requires admin approval before the user's role is upgraded to 'seller'.

## Architecture

### Models
- **SellerApplication**: Stores seller applications with business details, status (pending/approved/rejected), and review information
- **User**: Has role field (user/admin/seller)

### Routes

#### User Routes (`/api/seller`)
- `POST /api/seller/apply` - Submit seller application
- `GET /api/seller/application/status` - Check application status
- `DELETE /api/seller/application` - Cancel pending application

#### Admin Routes (`/api/admin/seller-applications`)
- `GET /api/admin/seller-applications/stats` - Get application statistics
- `GET /api/admin/seller-applications/pending` - List pending applications
- `GET /api/admin/seller-applications` - List all applications (with filters)
- `PATCH /api/admin/seller-applications/:id/approve` - Approve application
- `PATCH /api/admin/seller-applications/:id/reject` - Reject application

## Workflow

### 1. User Application
**Request:** `POST /api/seller/apply`
```json
{
  "businessName": "Craft Masters LLC",
  "businessDescription": "Traditional handicrafts and artisan products",
  "contactPhone": "+1-555-0123",
  "businessAddress": {
    "street": "123 Main Street",
    "city": "Springfield",
    "state": "IL",
    "zipCode": "62701",
    "country": "USA"
  },
  "taxId": "12-3456789",
  "websiteUrl": "https://craftmasters.com"
}
```

**Headers:**
```
Authorization: Bearer <user-jwt-token>
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Seller application submitted successfully. You will be notified once reviewed.",
  "data": {
    "_id": "...",
    "user": "...",
    "businessName": "Craft Masters LLC",
    "status": "pending",
    "createdAt": "..."
  }
}
```

### 2. Check Application Status
**Request:** `GET /api/seller/application/status`

**Headers:**
```
Authorization: Bearer <user-jwt-token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "status": "pending",
    "businessName": "Craft Masters LLC",
    "reviewNote": null,
    "reviewedBy": null,
    "createdAt": "..."
  }
}
```

### 3. Admin Reviews Application

#### List Pending Applications
**Request:** `GET /api/admin/seller-applications/pending`

**Headers:**
```
Authorization: Bearer <admin-jwt-token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "...",
      "user": {
        "_id": "...",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "businessName": "Craft Masters LLC",
      "status": "pending",
      "createdAt": "..."
    }
  ]
}
```

#### Approve Application
**Request:** `PATCH /api/admin/seller-applications/:id/approve`

**Headers:**
```
Authorization: Bearer <admin-jwt-token>
```

**Body:** (optional)
```json
{
  "note": "All documents verified. Business looks legitimate."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Seller application approved successfully. User role updated to seller.",
  "data": {
    "_id": "...",
    "status": "approved",
    "reviewNote": "All documents verified. Business looks legitimate.",
    "reviewedBy": "...",
    "reviewedAt": "..."
  }
}
```

**What Happens:**
1. SellerApplication status changes to 'approved'
2. User's role automatically changes to 'seller'
3. User can now access seller-specific features

#### Reject Application
**Request:** `PATCH /api/admin/seller-applications/:id/reject`

**Headers:**
```
Authorization: Bearer <admin-jwt-token>
```

**Body:** (required)
```json
{
  "note": "Tax ID could not be verified. Please provide valid documentation."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Seller application rejected",
  "data": {
    "_id": "...",
    "status": "rejected",
    "reviewNote": "Tax ID could not be verified. Please provide valid documentation.",
    "reviewedBy": "...",
    "reviewedAt": "..."
  }
}
```

**User Can Reapply:**
After rejection, the user can fix issues and reapply. The system will update the existing rejected application back to 'pending' status.

## Security Features

### 1. Role Escalation Prevention
- Users cannot specify role during registration (always 'user')
- Users cannot modify their own role via profile update
- Only admin can approve applications and change roles
- Role changes are logged for security auditing

### 2. Application Validation
- Cannot apply if already have pending application
- Cannot apply if already a seller or admin
- All business information validated
- Complete address required

### 3. Admin-Only Access
- All approval/rejection endpoints protected by `authorize('admin')`
- User can only view their own application
- Admin can view all applications

## Testing Steps

### Step 1: Create Test User
```bash
# Register a new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Seller",
    "email": "seller@test.com",
    "password": "password123"
  }'
# Save the JWT token
```

### Step 2: Submit Seller Application
```bash
curl -X POST http://localhost:5000/api/seller/apply \
  -H "Authorization: Bearer <user-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Test Crafts",
    "businessDescription": "Testing seller application",
    "contactPhone": "+1-555-0100",
    "businessAddress": {
      "street": "123 Test St",
      "city": "Test City",
      "state": "TS",
      "zipCode": "12345",
      "country": "USA"
    },
    "taxId": "12-3456789"
  }'
```

### Step 3: Create Admin User
```bash
# Use the seed script
ADMIN_EMAIL=admin@test.com ADMIN_PASSWORD=admin123 node scripts/seedAdmin.js

# Login as admin
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "admin123"
  }'
# Save the admin JWT token
```

### Step 4: Admin Approves Application
```bash
# Get pending applications
curl -X GET http://localhost:5000/api/admin/seller-applications/pending \
  -H "Authorization: Bearer <admin-token>"

# Copy the application ID and approve it
curl -X PATCH http://localhost:5000/api/admin/seller-applications/<app-id>/approve \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "note": "Approved for testing"
  }'
```

### Step 5: Verify User Role Changed
```bash
# Get user profile
curl -X GET http://localhost:5000/api/users/me \
  -H "Authorization: Bearer <user-token>"

# Should show role: "seller"
```

## Error Cases

### Duplicate Application
```json
{
  "success": false,
  "error": "You already have a pending seller application"
}
```

### Missing Required Fields
```json
{
  "success": false,
  "error": "Please provide all required business information"
}
```

### Incomplete Address
```json
{
  "success": false,
  "error": "Please provide complete business address"
}
```

### Reject Without Note
```json
{
  "success": false,
  "error": "Please provide a reason for rejection"
}
```

### Application Not Found
```json
{
  "success": false,
  "error": "No seller application found"
}
```

## Database Structure

### SellerApplication Schema
```javascript
{
  user: ObjectId (ref: User),
  businessName: String (required),
  businessDescription: String (required),
  contactPhone: String (required),
  businessAddress: {
    street: String (required),
    city: String (required),
    state: String (required),
    zipCode: String (required),
    country: String (default: 'USA')
  },
  taxId: String,
  websiteUrl: String,
  status: String (enum: pending/approved/rejected, default: pending),
  reviewNote: String,
  reviewedBy: ObjectId (ref: User),
  reviewedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes
- `{ status: 1, createdAt: -1 }` - For efficient admin queries

## Methods

### Instance Methods
- `approve(adminId, note)` - Approves application and updates user role to 'seller'
- `reject(adminId, note)` - Rejects application with required note

### Static Methods
- `findPending()` - Returns all pending applications with user populated

## Next Steps

1. **Frontend Integration**
   - Create seller application form
   - Show application status to users
   - Admin dashboard for reviewing applications

2. **Email Notifications**
   - Send email when application is submitted
   - Notify user when approved/rejected
   - Alert admin of new applications

3. **Document Uploads**
   - Allow uploading business documents
   - Verify identity documents
   - Store file references

4. **Analytics**
   - Track application approval rates
   - Monitor time to review
   - Seller performance metrics
