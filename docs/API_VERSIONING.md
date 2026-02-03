# API Versioning Guide

## Overview

The AI Craft Recognition API uses URL-based versioning to ensure backward compatibility and smooth transitions between API versions.

## Current Version

**v1** - Current stable version

Base URL: `/api/v1`

## Version Format

All API endpoints follow this pattern:
```
/api/v{version}/{resource}
```

Examples:
- `/api/v1/auth/login`
- `/api/v1/products`
- `/api/v1/users/me`

## Backward Compatibility

For backward compatibility, legacy `/api/*` routes automatically redirect to `/api/v1/*` using HTTP 307 (Temporary Redirect), preserving the request method and body.

**Legacy URL:**
```
POST /api/auth/login
```

**Automatically redirects to:**
```
POST /api/v1/auth/login
```

⚠️ **Important:** Update your client applications to use versioned URLs (`/api/v1/*`) as the redirect mechanism may be removed in future releases.

## Version Lifecycle

### 1. **Active** (v1)
- Current stable version
- Receives new features and bug fixes
- Fully supported

### 2. **Deprecated** (None currently)
- Still functional but no longer recommended
- Receives critical security fixes only
- Marked with deprecation headers

### 3. **Sunset** (None currently)
- No longer available
- Returns 410 Gone status

## Making Versioned Requests

### Example: Login Request

```bash
# Using v1 (recommended)
curl -X POST https://api.example.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# Legacy (will redirect to v1)
curl -X POST https://api.example.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

### Example: Get Products

```bash
# Using v1
GET /api/v1/products

# Legacy (will redirect)
GET /api/products
```

## Version Migration

When a new API version is released:

1. **Announcement** - New version is announced with migration guide
2. **Parallel Support** - Both versions run simultaneously for transition period
3. **Deprecation** - Old version is marked as deprecated (typically 6 months)
4. **Sunset** - Old version is removed (typically 12 months after new version)

## Breaking Changes

Breaking changes are only introduced in new major versions. Examples of breaking changes:

- Removing endpoints
- Changing response structure
- Modifying required fields
- Changing authentication methods
- Altering error codes

## Non-Breaking Changes

Non-breaking changes can be added to existing versions:

- Adding new optional fields
- Adding new endpoints
- Adding new query parameters
- Expanding enum values
- Bug fixes

## Version Headers

All API responses include version information:

```http
HTTP/1.1 200 OK
X-API-Version: v1
Content-Type: application/json
```

Deprecated versions also include:

```http
HTTP/1.1 200 OK
X-API-Version: v1
X-API-Deprecated: true
X-API-Sunset-Date: 2026-12-31
Warning: 299 - "This API version is deprecated and will be sunset on 2026-12-31"
Content-Type: application/json
```

## Version-Specific Features

### V1 Features

- JWT authentication
- Rate limiting
- Input validation
- NoSQL injection prevention
- CORS security
- Request sanitization
- Helmet security headers
- Graceful error handling
- Request logging
- Sensitive data masking

## Best Practices

1. **Always use versioned URLs** in production
2. **Monitor deprecation headers** to stay informed
3. **Test against new versions** before migration
4. **Use feature flags** for gradual rollouts
5. **Cache version responses** to reduce overhead
6. **Subscribe to API updates** for version announcements

## Future Versions

Planning for v2 (TBD):
- GraphQL support
- Enhanced search capabilities
- Real-time subscriptions
- Advanced analytics

## Support

For questions about API versioning:
- Email: api-support@example.com
- Documentation: https://docs.example.com/api
- Status Page: https://status.example.com

## Changelog

### v1.0.0 (Current)
- Initial release
- Complete RESTful API
- Authentication & authorization
- Product management
- Order processing
- AI craft recognition
- Speech-to-text
- Chatbot integration
- Admin dashboard
- Seller management

---

Last Updated: February 3, 2026
