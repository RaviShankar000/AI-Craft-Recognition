# Scripts Directory

This directory contains utility scripts for database seeding, migrations, and administrative tasks.

## Available Scripts

### Admin Bootstrap Script (`seedAdmin.js`)

Creates a default admin user from environment variables. Safe to run multiple times (idempotent).

#### Usage

1. **Set environment variables:**
   ```bash
   ADMIN_NAME="Admin User"
   ADMIN_EMAIL="admin@example.com"
   ADMIN_PASSWORD="SecurePassword123"
   ```

2. **Run the script:**
   ```bash
   # Using npm
   npm run seed:admin

   # Or directly
   node scripts/seedAdmin.js

   # Or with inline environment variables
   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=SecurePass123 npm run seed:admin
   ```

#### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ADMIN_NAME` | No | "System Administrator" | Full name of the admin user |
| `ADMIN_EMAIL` | Yes | - | Email address for admin login |
| `ADMIN_PASSWORD` | Yes | - | Admin password (min 6 characters) |

#### Features

- ✅ Idempotent (safe to run multiple times)
- ✅ Checks if admin already exists
- ✅ Updates existing user to admin role if needed
- ✅ Validates password strength
- ✅ Provides detailed feedback

#### Security Notes

⚠️ **IMPORTANT:**
- Never commit actual admin credentials to version control
- Use strong passwords in production (min 12 characters recommended)
- Change the default admin password immediately after first login
- Consider using secrets management (AWS Secrets Manager, HashiCorp Vault, etc.) for production
- Rotate admin passwords regularly

#### Examples

**Create admin with default name:**
```bash
ADMIN_EMAIL=admin@company.com ADMIN_PASSWORD=SecurePass123 npm run seed:admin
```

**Create admin with custom name:**
```bash
ADMIN_NAME="John Doe" ADMIN_EMAIL=john@company.com ADMIN_PASSWORD=StrongPass456 npm run seed:admin
```

**Production deployment with secrets:**
```bash
# Load from secrets manager and run
export ADMIN_EMAIL=$(aws secretsmanager get-secret-value --secret-id admin-email --query SecretString --output text)
export ADMIN_PASSWORD=$(aws secretsmanager get-secret-value --secret-id admin-password --query SecretString --output text)
npm run seed:admin
```

## Adding New Scripts

When adding new scripts to this directory:

1. Add documentation to this README
2. Add npm script alias in `package.json`
3. Include error handling and logging
4. Make scripts idempotent when possible
5. Document all environment variables
6. Add security notes for sensitive operations
