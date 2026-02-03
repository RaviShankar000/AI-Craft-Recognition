# Deployment Guide - AI Craft Recognition Platform

**Version:** 1.0.0  
**Target:** Production Environment

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Setup](#server-setup)
3. [Database Configuration](#database-configuration)
4. [Application Deployment](#application-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Environment Configuration](#environment-configuration)
7. [SSL/HTTPS Setup](#sslhttps-setup)
8. [Monitoring & Logging](#monitoring--logging)
9. [Backup Strategy](#backup-strategy)
10. [Post-Deployment Checklist](#post-deployment-checklist)

---

## Prerequisites

### System Requirements

**Server Specifications:**
- **OS:** Ubuntu 20.04 LTS or higher
- **CPU:** 2+ cores (4+ recommended)
- **RAM:** 4GB minimum (8GB recommended)
- **Storage:** 50GB SSD minimum
- **Network:** Static IP address

**Software Requirements:**
- Node.js 18.x or 20.x
- MongoDB 7.x
- Nginx (reverse proxy)
- PM2 (process manager)
- Git

---

## Server Setup

### 1. Initial Server Configuration

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git build-essential
```

### 2. Install Node.js

```bash
# Using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version
```

### 3. Install MongoDB

```bash
# Import MongoDB GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
  sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/mongodb-server-7.0.gpg

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | \
  sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install MongoDB
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify
sudo systemctl status mongod
```

### 4. Install PM2

```bash
sudo npm install -g pm2

# Enable PM2 startup
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER
```

### 5. Install Nginx

```bash
sudo apt install -y nginx

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## Database Configuration

### 1. Secure MongoDB

```bash
# Connect to MongoDB
mongosh

# Create admin user
use admin
db.createUser({
  user: "admin",
  pwd: "STRONG_PASSWORD_HERE",
  roles: ["userAdminAnyDatabase", "dbAdminAnyDatabase", "readWriteAnyDatabase"]
})

# Create application database and user
use craft-production
db.createUser({
  user: "craftapp",
  pwd: "APP_PASSWORD_HERE",
  roles: ["readWrite"]
})

exit
```

### 2. Enable Authentication

```bash
# Edit MongoDB config
sudo nano /etc/mongod.conf

# Add security section:
security:
  authorization: enabled

# Restart MongoDB
sudo systemctl restart mongod
```

### 3. Connection String

Update your connection string:
```
mongodb://craftapp:APP_PASSWORD_HERE@localhost:27017/craft-production
```

---

## Application Deployment

### 1. Clone Repository

```bash
# Create application directory
sudo mkdir -p /var/www
cd /var/www

# Clone from repository
sudo git clone https://github.com/your-org/craft-platform.git
sudo chown -R $USER:$USER craft-platform
cd craft-platform
```

### 2. Install Dependencies

```bash
# Backend dependencies
npm ci --production

# Frontend dependencies
cd frontend
npm ci --legacy-peer-deps
cd ..
```

### 3. Configure Environment

```bash
# Create production .env file
nano .env
```

Copy configuration from [Environment Configuration](#environment-configuration) section.

### 4. Build Frontend

```bash
cd frontend
npm run build
cd ..
```

### 5. Start Application with PM2

```bash
# Start backend
pm2 start server.js --name craft-backend \
  --node-args="--max-old-space-size=2048"

# Save PM2 process list
pm2 save

# Check status
pm2 status
pm2 logs craft-backend
```

---

## Frontend Deployment

### Option 1: Serve with Nginx (Recommended)

```bash
# Copy build files
sudo cp -r frontend/dist /var/www/craft-frontend

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/craft-platform
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Frontend
    root /var/www/craft-frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.IO
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/craft-platform /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Option 2: PM2 Serve (Alternative)

```bash
cd frontend
pm2 serve dist 3000 --spa --name craft-frontend
pm2 save
```

---

## Environment Configuration

### Production .env File

```bash
# ====================================
# PRODUCTION ENVIRONMENT VARIABLES
# ====================================

# Server Configuration
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Database
MONGODB_URI=mongodb://craftapp:PASSWORD@localhost:27017/craft-production

# JWT Authentication
JWT_SECRET=GENERATE_LONG_RANDOM_STRING_HERE
JWT_EXPIRE=7d

# CORS
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com

# AI Service
AI_SERVICE_URL=http://localhost:8080
AI_SERVICE_API_KEY=your-ai-service-api-key

# File Upload
UPLOAD_PATH=/var/www/craft-platform/uploads
MAX_FILE_SIZE=10485760

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@your-domain.com
SMTP_PASS=your-app-specific-password
SMTP_FROM=AI Craft Platform <noreply@your-domain.com>

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_DIR=/var/www/craft-platform/logs

# Session
SESSION_SECRET=GENERATE_ANOTHER_RANDOM_STRING

# Admin
ADMIN_EMAIL=admin@your-domain.com
```

**Generate Secrets:**
```bash
# Generate random strings for secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## SSL/HTTPS Setup

### Using Certbot (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Follow prompts and enter email for renewal notifications

# Test auto-renewal
sudo certbot renew --dry-run
```

**Certbot will automatically:**
- Obtain SSL certificates
- Configure Nginx for HTTPS
- Set up auto-renewal

### Manual SSL Configuration

If using custom certificates:

```bash
# Copy certificates
sudo cp your-certificate.crt /etc/ssl/certs/
sudo cp your-private-key.key /etc/ssl/private/

# Update Nginx configuration
sudo nano /etc/nginx/sites-available/craft-platform
```

Add SSL directives:
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/ssl/certs/your-certificate.crt;
    ssl_certificate_key /etc/ssl/private/your-private-key.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # ... rest of configuration
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## Monitoring & Logging

### 1. Application Monitoring

```bash
# View logs
pm2 logs craft-backend

# Monitor resources
pm2 monit

# Check application status
pm2 status
```

### 2. System Monitoring

```bash
# Install monitoring tools
sudo apt install -y htop iotop

# Check disk space
df -h

# Check memory
free -h

# Check CPU
htop
```

### 3. Log Rotation

```bash
# Configure PM2 log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 100M
pm2 set pm2-logrotate:retain 7
```

### 4. Uptime Monitoring

Set up external monitoring (recommended):
- **UptimeRobot:** https://uptimerobot.com
- **Pingdom:** https://www.pingdom.com
- **StatusCake:** https://www.statuscake.com

Monitor:
- Website availability
- API endpoints
- Response times

---

## Backup Strategy

### 1. Database Backups

```bash
# Create backup script
sudo nano /usr/local/bin/backup-mongodb.sh
```

**Backup Script:**
```bash
#!/bin/bash

BACKUP_DIR="/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
MONGODB_URI="mongodb://craftapp:PASSWORD@localhost:27017/craft-production"

mkdir -p $BACKUP_DIR

mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/$DATE"

# Keep only last 7 days of backups
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} +

echo "Backup completed: $BACKUP_DIR/$DATE"
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-mongodb.sh

# Schedule daily backups (cron)
crontab -e
```

Add cron job:
```
0 2 * * * /usr/local/bin/backup-mongodb.sh
```

### 2. Application Backups

```bash
# Backup uploads directory
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz /var/www/craft-platform/uploads

# Backup .env file
cp /var/www/craft-platform/.env /backups/env-backup-$(date +%Y%m%d).env
```

### 3. Remote Backup Storage

Upload backups to cloud storage (recommended):
```bash
# Example: AWS S3
aws s3 sync /backups s3://your-backup-bucket/craft-platform/
```

---

## Post-Deployment Checklist

### Security

- [ ] Firewall configured (UFW)
- [ ] SSH key authentication enabled
- [ ] Root login disabled
- [ ] MongoDB authentication enabled
- [ ] SSL/HTTPS configured
- [ ] Environment variables secured
- [ ] File permissions restricted

### Application

- [ ] Application starts successfully
- [ ] Frontend accessible
- [ ] API endpoints responding
- [ ] WebSocket connections working
- [ ] Database connection verified
- [ ] Email notifications working
- [ ] File uploads functional

### Monitoring

- [ ] PM2 process monitoring active
- [ ] Log rotation configured
- [ ] Uptime monitoring set up
- [ ] Error alerting configured
- [ ] Database backups scheduled
- [ ] SSL auto-renewal working

### Performance

- [ ] Nginx compression enabled
- [ ] Static files cached
- [ ] Database indexes created
- [ ] Rate limiting active
- [ ] CDN configured (if applicable)

### Documentation

- [ ] Admin credentials documented
- [ ] API endpoints tested
- [ ] Deployment runbook created
- [ ] Emergency contacts listed
- [ ] Rollback procedure documented

---

## Firewall Configuration

```bash
# Install UFW
sudo apt install -y ufw

# Allow SSH (IMPORTANT: Do this first!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## Rollback Procedure

If issues arise after deployment:

```bash
# 1. Stop application
pm2 stop craft-backend

# 2. Restore previous version
cd /var/www/craft-platform
git checkout <previous-commit-hash>

# 3. Reinstall dependencies
npm ci --production

# 4. Restart application
pm2 restart craft-backend

# 5. Verify
pm2 logs craft-backend
```

---

## Scaling Considerations

### Horizontal Scaling

For high traffic, consider:

1. **Load Balancer:** Nginx or HAProxy
2. **Multiple App Instances:** PM2 cluster mode
3. **Database Replication:** MongoDB replica sets
4. **Caching Layer:** Redis for sessions/cache
5. **CDN:** Cloudflare or AWS CloudFront

### Cluster Mode

```bash
# Start in cluster mode (uses all CPU cores)
pm2 start server.js -i max --name craft-backend-cluster
```

---

## Support

**Deployment Issues:**
- Email: devops@your-platform.com
- Phone: +1 (555) 123-4567 (24/7)

**Documentation:**
- Admin Guide: `/docs/ADMIN_GUIDE.md`
- API Docs: `/docs/API_DOCUMENTATION.md`

---

## Appendix

### Useful Commands

```bash
# Check application status
pm2 status
curl http://localhost:5000/health

# View recent logs
pm2 logs craft-backend --lines 100

# Restart application
pm2 restart craft-backend

# Check Nginx
sudo nginx -t
sudo systemctl status nginx

# Check MongoDB
sudo systemctl status mongod
mongosh --eval "db.adminCommand('ping')"

# Check disk space
df -h

# Check memory
free -h
```

### Troubleshooting

**Application won't start:**
```bash
# Check logs
pm2 logs craft-backend --err

# Check environment variables
pm2 env 0

# Test manually
cd /var/www/craft-platform
npm start
```

**Database connection failed:**
```bash
# Test connection
mongosh "mongodb://craftapp:PASSWORD@localhost:27017/craft-production"

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

---

**© 2026 AI Craft Recognition Platform. Deployment Guide v1.0.0**
