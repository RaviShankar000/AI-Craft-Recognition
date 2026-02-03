# Administrator Guide - AI Craft Recognition Platform

**Version:** 1.0.0  
**For:** System Administrators and Platform Managers

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Admin Access](#admin-access)
3. [User Management](#user-management)
4. [Content Moderation](#content-moderation)
5. [System Monitoring](#system-monitoring)
6. [Configuration Management](#configuration-management)
7. [Troubleshooting](#troubleshooting)
8. [Security Best Practices](#security-best-practices)

---

## System Overview

### Architecture

The platform consists of:
- **Backend API:** Node.js/Express server
- **Frontend:** React application
- **Database:** MongoDB
- **Real-time:** Socket.IO for live updates
- **AI Service:** Craft recognition microservice

### Technology Stack

- **Runtime:** Node.js 18.x or 20.x
- **Framework:** Express 5.x
- **Database:** MongoDB 7.x
- **Frontend:** React 19.x with Vite
- **Authentication:** JWT tokens

---

## Admin Access

### Creating Admin Account

Use the seed script to create the first admin:

```bash
npm run seed:admin
```

This creates an admin account with:
- **Email:** admin@platform.com
- **Password:** (randomly generated, shown in console)
- **Role:** admin

**⚠️ IMPORTANT:** Change the password immediately after first login!

### Admin Dashboard Access

1. Navigate to: `https://your-platform.com/admin`
2. Login with admin credentials
3. You'll have access to:
   - User management
   - Product moderation
   - Analytics dashboard
   - System settings

### Admin Privileges

Admins can:
- ✅ Manage all users (view, edit, deactivate)
- ✅ Moderate products (approve, reject)
- ✅ Manage craft database (create, edit, delete)
- ✅ View system analytics
- ✅ Access audit logs
- ✅ Configure system settings

---

## User Management

### Viewing Users

**Dashboard:** Navigate to **Users** section

**API Endpoint:**
```bash
curl -X GET "https://api.yourplatform.com/api/v1/admin/users" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### User Roles

| Role | Permissions |
|------|-------------|
| **user** | Browse products, make purchases |
| **seller** | Create/manage own products |
| **admin** | Full system access |

### Managing User Accounts

#### Promote User to Seller

```bash
curl -X PATCH "https://api.yourplatform.com/api/v1/admin/users/{userId}" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "seller"}'
```

#### Deactivate User

```bash
curl -X PATCH "https://api.yourplatform.com/api/v1/admin/users/{userId}" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"active": false}'
```

#### Reset User Password

From admin dashboard:
1. Go to Users → Select user
2. Click "Reset Password"
3. New password sent to user's email

### Handling Violations

For policy violations:
1. Review user activity in audit logs
2. Issue warning via notification system
3. Temporary suspension (deactivate account)
4. Permanent ban if severe

---

## Content Moderation

### Product Approval Workflow

1. Seller submits product → Status: **pending**
2. Admin reviews product details and images
3. Admin action:
   - **Approve:** Product goes live
   - **Reject:** Seller notified with reason

### Approving Products

**Via Dashboard:**
1. Navigate to **Products** → **Pending**
2. Review product details
3. Click **Approve** or **Reject**

**Via API:**
```bash
# Approve
curl -X PATCH "https://api.yourplatform.com/api/v1/products/{productId}/approve" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Reject
curl -X PATCH "https://api.yourplatform.com/api/v1/products/{productId}/reject" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Images do not meet quality standards"}'
```

### Moderation Guidelines

**Approve if:**
- ✅ High-quality product images
- ✅ Accurate descriptions
- ✅ Fair pricing
- ✅ Complies with platform policies

**Reject if:**
- ❌ Poor quality images
- ❌ Misleading descriptions
- ❌ Prohibited items
- ❌ Copyright violations
- ❌ Duplicate listings

### Managing Craft Database

Only admins can modify the craft database:

```bash
# Add new craft
curl -X POST "https://api.yourplatform.com/api/v1/crafts" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Woodcarving",
    "description": "Traditional wood carving",
    "category": "Woodwork",
    "origin": "Global",
    "materials": ["wood", "tools"]
  }'
```

---

## System Monitoring

### Analytics Dashboard

Access at: `https://your-platform.com/admin/analytics`

**Key Metrics:**
- Active users (daily, weekly, monthly)
- Product listings (total, pending, approved)
- Order volume and revenue
- Craft recognition usage
- API request rates

### Real-time Monitoring

The admin dashboard shows:
- 🟢 **Online Users:** Current active users
- 📊 **Live Orders:** Orders in the last hour
- 🔔 **Pending Reviews:** Products awaiting moderation
- ⚠️ **System Alerts:** Critical issues

### Logs and Audit Trail

**Application Logs:**
```bash
# View logs
tail -f logs/combined.log

# Error logs only
tail -f logs/error.log
```

**Audit Logs:**
All admin actions are logged:
- User modifications
- Product approvals/rejections
- System configuration changes

Access via: **Admin Dashboard → Audit Logs**

### Performance Metrics

Monitor server health:

```bash
# CPU and memory usage
pm2 status

# Database connection
mongosh --eval "db.adminCommand('serverStatus')"

# API response times
# Check logs/combined.log for request durations
```

---

## Configuration Management

### Environment Variables

Critical settings in `.env`:

```bash
# Server
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/craft-production

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRE=7d

# AI Service
AI_SERVICE_URL=http://ai-service:8080
AI_SERVICE_API_KEY=your-ai-api-key

# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**⚠️ SECURITY:** Never commit `.env` to version control!

### Feature Flags

Toggle features without code changes:

**Admin Dashboard → Settings → Features**

Available flags:
- `ENABLE_VOICE_SEARCH` - Voice input for craft search
- `ENABLE_REAL_TIME_CHAT` - Chatbot feature
- `MAINTENANCE_MODE` - Disable public access
- `SELLER_AUTO_APPROVE` - Skip product moderation

### Rate Limiting

Adjust in `src/middleware/rateLimiter.js`:

```javascript
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
```

### File Upload Limits

Configure in `src/middleware/upload.js`:

```javascript
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});
```

---

## Troubleshooting

### Common Issues

#### 1. Server Won't Start

**Symptoms:** Application crashes on startup

**Checks:**
```bash
# Check Node version
node --version  # Should be 18.x or 20.x

# Check MongoDB connection
mongosh "mongodb://localhost:27017"

# Verify environment variables
cat .env | grep -v "^#"

# Check port availability
lsof -i :5000
```

#### 2. Database Connection Failed

**Solution:**
```bash
# Check MongoDB status
sudo systemctl status mongod

# Start MongoDB if stopped
sudo systemctl start mongod

# Check connection string
echo $MONGODB_URI
```

#### 3. High CPU Usage

**Investigation:**
```bash
# Check process
pm2 monit

# Profile application
node --prof server.js
```

**Common causes:**
- Unoptimized database queries
- Memory leaks
- High traffic without rate limiting

#### 4. Products Not Appearing

**Checklist:**
- [ ] Product status is "approved"
- [ ] Seller account is active
- [ ] Product has valid craft reference
- [ ] Cache cleared (if using caching)

#### 5. WebSocket Connection Issues

**Debug:**
```javascript
// Check Socket.IO logs
// Enable debug mode in .env
DEBUG=socket.io* npm start
```

### Emergency Procedures

#### Take Site Offline (Maintenance Mode)

```bash
# Quick method - stop server
pm2 stop craft-backend

# Graceful - enable maintenance mode
# Set in .env or admin dashboard:
MAINTENANCE_MODE=true
```

#### Rollback Deployment

```bash
# If using PM2
pm2 reload craft-backend

# If using Docker
docker-compose down
docker-compose up -d --force-recreate
```

#### Database Backup

```bash
# Backup
mongodump --uri="mongodb://localhost:27017/craft-production" \
  --out=/backups/$(date +%Y%m%d)

# Restore
mongorestore --uri="mongodb://localhost:27017/craft-production" \
  /backups/20260203
```

---

## Security Best Practices

### 1. Access Control

- ✅ Use strong admin passwords (min 12 characters)
- ✅ Enable 2FA for admin accounts
- ✅ Limit admin access to trusted IPs
- ✅ Regularly audit admin accounts
- ✅ Remove inactive admin accounts

### 2. Data Protection

- ✅ Encrypt sensitive data at rest
- ✅ Use HTTPS only (no HTTP)
- ✅ Regular database backups (daily)
- ✅ Secure backup storage
- ✅ PII handling compliance (GDPR)

### 3. System Updates

```bash
# Check for vulnerabilities
npm audit

# Update dependencies
npm update

# Major version updates
npm outdated
```

### 4. Monitoring

- ✅ Set up uptime monitoring (e.g., UptimeRobot)
- ✅ Configure error alerting (email/Slack)
- ✅ Monitor disk space
- ✅ Track failed login attempts
- ✅ Review audit logs weekly

### 5. Incident Response

**If security breach detected:**

1. **Immediate Actions:**
   - Take affected systems offline
   - Change all admin passwords
   - Revoke all JWT tokens
   - Review audit logs

2. **Investigation:**
   - Identify breach vector
   - Assess data exposure
   - Document timeline

3. **Recovery:**
   - Patch vulnerabilities
   - Restore from clean backup
   - Notify affected users
   - Report if required by law

4. **Prevention:**
   - Implement additional security measures
   - Update incident response plan
   - Train team on lessons learned

---

## Support Contacts

**For Production Issues:**
- **Email:** admin-support@yourplatform.com
- **Phone:** +1 (555) 123-4567
- **On-call:** Available 24/7

**For Technical Questions:**
- **Developer Docs:** https://docs.yourplatform.com
- **API Reference:** https://api.yourplatform.com/docs
- **GitHub Issues:** https://github.com/your-org/platform/issues

---

## Appendix

### Useful Commands

```bash
# Server management
pm2 start server.js --name craft-backend
pm2 stop craft-backend
pm2 restart craft-backend
pm2 logs craft-backend

# Database
mongosh craft-production
db.users.countDocuments()
db.products.find({status: "pending"}).count()

# Logs
tail -f logs/combined.log
grep "ERROR" logs/combined.log | tail -20

# Backup
./scripts/backup-database.sh
```

### Admin API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/admin/users` | GET | List all users |
| `/admin/users/:id` | PATCH | Update user |
| `/admin/products/pending` | GET | Pending products |
| `/admin/analytics` | GET | System analytics |
| `/admin/audit-logs` | GET | Audit trail |

---

**© 2026 AI Craft Recognition Platform. Administrator Guide v1.0.0**
