# AI Craft Recognition Platform - API Documentation

**Version:** 1.0.0  
**Last Updated:** February 3, 2026

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
4. [Error Handling](#error-handling)
5. [Rate Limiting](#rate-limiting)
6. [Best Practices](#best-practices)

---

## Overview

The AI Craft Recognition Platform provides RESTful APIs for:
- AI-powered craft recognition from images
- Marketplace operations (products, orders)
- User management and authentication
- Real-time notifications via WebSocket

**Base URL:** `https://api.yourplatform.com/api/v1`  
**Alternative:** `https://api.yourplatform.com/api` (legacy, without version)

---

## Authentication

### Registration

**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Login

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Using the Token

Include the JWT token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## API Endpoints

### Craft Recognition

#### Get All Crafts

**Endpoint:** `GET /crafts`  
**Authentication:** Not required

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 20)
- `category` (string): Filter by category
- `search` (string): Search by name/description
- `origin` (string): Filter by origin country

**Example Request:**
```bash
curl -X GET "https://api.yourplatform.com/api/v1/crafts?category=Ceramics&limit=10"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Pottery",
      "description": "Traditional clay pottery",
      "category": "Ceramics",
      "origin": "India",
      "materials": ["clay", "water"],
      "techniques": ["wheel throwing", "glazing"],
      "images": ["https://..."]
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 45,
    "itemsPerPage": 10
  }
}
```

#### Recognize Craft from Image

**Endpoint:** `POST /ai/recognize`  
**Authentication:** Required  
**Content-Type:** `multipart/form-data`

**Request Body:**
```
image: [File]
```

**Example Request:**
```bash
curl -X POST "https://api.yourplatform.com/api/v1/ai/recognize" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@/path/to/craft.jpg"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "craftType": "Pottery",
    "confidence": 0.95,
    "details": {
      "category": "Ceramics",
      "techniques": ["wheel throwing"],
      "materials": ["clay"],
      "origin": "India"
    },
    "relatedProducts": [
      {
        "id": "507f1f77bcf86cd799439012",
        "name": "Handmade Clay Pot",
        "price": 45.99
      }
    ]
  }
}
```

### Marketplace

#### Get All Products

**Endpoint:** `GET /products`  
**Authentication:** Optional (shows more if authenticated)

**Query Parameters:**
- `page`, `limit`: Pagination
- `craft` (string): Filter by craft ID
- `minPrice`, `maxPrice` (number): Price range
- `sortBy` (string): `price`, `createdAt`, `popularity`
- `order` (string): `asc` or `desc`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Handmade Pottery Bowl",
      "description": "Beautiful ceramic bowl",
      "price": 45.99,
      "stock": 10,
      "craft": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Pottery"
      },
      "seller": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Jane Smith"
      },
      "images": ["https://..."],
      "status": "approved"
    }
  ]
}
```

#### Create Product (Seller/Admin Only)

**Endpoint:** `POST /products`  
**Authentication:** Required (seller or admin role)

**Request Body:**
```json
{
  "name": "Handmade Pottery Bowl",
  "description": "Beautiful ceramic bowl handcrafted with care",
  "price": 45.99,
  "stock": 10,
  "craft": "507f1f77bcf86cd799439011",
  "materials": ["clay", "glaze"],
  "dimensions": {
    "length": 10,
    "width": 10,
    "height": 5
  }
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Handmade Pottery Bowl",
    "status": "pending",
    "seller": "507f1f77bcf86cd799439014"
  }
}
```

### Orders

#### Create Order

**Endpoint:** `POST /orders`  
**Authentication:** Required

**Request Body:**
```json
{
  "items": [
    {
      "product": "507f1f77bcf86cd799439013",
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "paymentMethod": "credit_card"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "orderNumber": "ORD-2026-001",
    "total": 91.98,
    "status": "pending",
    "items": [...],
    "createdAt": "2026-02-03T10:30:00Z"
  }
}
```

#### Get User Orders

**Endpoint:** `GET /orders`  
**Authentication:** Required

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "orderNumber": "ORD-2026-001",
      "status": "shipped",
      "total": 91.98,
      "createdAt": "2026-02-03T10:30:00Z"
    }
  ]
}
```

---

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "error": "Error message description",
  "statusCode": 400
}
```

### Common Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required or failed |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

---

## Rate Limiting

API endpoints are rate-limited to ensure fair usage:

- **General API calls:** 100 requests per 15 minutes
- **Authentication:** 5 requests per 15 minutes
- **Image uploads:** 20 requests per 15 minutes

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1612345678
```

When limit is exceeded:
```json
{
  "success": false,
  "error": "Too many requests. Please try again later.",
  "statusCode": 429
}
```

---

## Best Practices

### 1. Error Handling

Always check the `success` field in responses:

```javascript
const response = await fetch('/api/v1/crafts');
const data = await response.json();

if (data.success) {
  // Handle success
  console.log(data.data);
} else {
  // Handle error
  console.error(data.error);
}
```

### 2. Pagination

Always use pagination for list endpoints:

```javascript
const page = 1;
const limit = 20;
const url = `/api/v1/products?page=${page}&limit=${limit}`;
```

### 3. Image Uploads

- Maximum file size: 10MB
- Supported formats: JPEG, PNG, WebP
- Compress images before upload for better performance

### 4. Token Management

- Store tokens securely (e.g., httpOnly cookies)
- Refresh tokens before expiration
- Never expose tokens in URLs or logs

### 5. WebSocket Connections

For real-time notifications:

```javascript
import io from 'socket.io-client';

const socket = io('https://api.yourplatform.com', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});

socket.on('notification', (data) => {
  console.log('New notification:', data);
});
```

---

## Support

For API support and questions:
- **Email:** api-support@yourplatform.com
- **Documentation:** https://docs.yourplatform.com
- **Status Page:** https://status.yourplatform.com

---

**© 2026 AI Craft Recognition Platform. All rights reserved.**
