# Rate Limiting Configuration

## Overview
Rate limiting has been implemented across all user-facing APIs to prevent abuse and ensure fair resource usage. The system uses `express-rate-limit` to track requests by IP address.

## Rate Limiting Tiers

### 1. Authentication Endpoints (Strictest)
**Limit:** 5 requests per 15 minutes
**Applied to:**
- POST /api/auth/register
- POST /api/auth/login

**Purpose:** Prevent brute force attacks and credential stuffing

### 2. AI/Resource-Intensive Operations
**Limit:** 10 requests per 15 minutes
**Applied to:**
- POST /api/ai/predict (craft recognition)

**Purpose:** Prevent abuse of expensive AI computation resources

### 3. Update/Mutation Operations
**Limit:** 20 requests per 15 minutes
**Applied to:**
- PUT /api/users/me (profile updates)
- POST /api/cart/items (add to cart)
- PUT /api/cart/items/:productId (update cart)
- DELETE /api/cart/items/:productId (remove from cart)
- DELETE /api/cart (clear cart)
- POST /api/checkout/validate
- POST /api/checkout/apply-discount
- POST /api/checkout (process checkout)
- POST /api/orders/:id/cancel
- POST /api/products (create product)
- PUT /api/products/:id (update product)
- DELETE /api/products/:id (delete product)
- PATCH /api/products/:id/stock (update stock)

**Purpose:** Prevent rapid-fire updates and spam operations

### 4. Chat/Speech Services
**Limit:** 30 requests per 15 minutes
**Applied to:**
- POST /api/chatbot/message
- POST /api/speech/transcribe

**Purpose:** Prevent abuse of AI-powered conversational features

### 5. General API Access (Most Lenient)
**Limit:** 100 requests per 15 minutes
**Applied to:**
- GET /api/users/me (view profile)
- GET /api/cart (view cart)
- POST /api/cart/sync (sync cart)
- GET /api/checkout/summary
- GET /api/orders (list orders)
- GET /api/orders/track/:orderNumber
- GET /api/orders/:id (view order)
- GET /api/products (list products)
- GET /api/products/:id (view product)
- GET /api/products/craft/:craftId (products by craft)
- GET /api/crafts (list crafts)
- GET /api/crafts/:id (view craft)
- GET /api/crafts/voice-search
- GET /api/chatbot/quick-help
- GET /api/chatbot/faqs
- GET /api/chatbot/status
- GET /api/speech/status

**Purpose:** Allow reasonable browsing while preventing DOS attacks

## Response Format

When rate limit is exceeded, clients receive a 429 (Too Many Requests) response:

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "message": "You have made too many requests. Please try again after 15 minutes.",
  "retryAfter": "15 minutes"
}
```

## Headers

Rate limit information is provided in response headers:
- `RateLimit-Limit`: Maximum number of requests allowed
- `RateLimit-Remaining`: Number of requests remaining
- `RateLimit-Reset`: Time when the rate limit resets (Unix timestamp)

## Implementation Details

### Middleware Location
`src/middleware/rateLimiter.js`

### Available Limiters
- `authLimiter`: For authentication endpoints (5/15min)
- `aiLimiter`: For AI services (10/15min)
- `updateLimiter`: For mutation operations (20/15min)
- `chatLimiter`: For chat/speech services (30/15min)
- `apiLimiter`: For general API access (100/15min)

### Usage Example
```javascript
const { authLimiter, apiLimiter } = require('../middleware/rateLimiter');

// Apply to specific route
router.post('/login', authLimiter, validateLogin, login);
router.get('/products', apiLimiter, getAllProducts);
```

## Configuration

All rate limiters use:
- **Window:** 15 minutes (900,000 ms)
- **Tracking:** By IP address
- **Headers:** Standard RateLimit-* headers (no legacy X-RateLimit-*)
- **Behavior:** Counts both successful and failed requests

## Benefits

1. **Security:** Prevents brute force attacks on authentication
2. **Fairness:** Ensures resources are shared among users
3. **Cost Control:** Limits expensive AI operations
4. **Stability:** Prevents DOS attacks
5. **Performance:** Reduces server overload

## Future Enhancements

Consider implementing:
- User-based rate limiting (track by user ID when authenticated)
- Dynamic rate limits based on user role (premium users get higher limits)
- Redis-based distributed rate limiting for multi-server deployments
- Whitelist for trusted IPs
- Stricter limits during high-traffic periods
