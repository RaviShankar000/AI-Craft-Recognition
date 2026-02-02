/**
 * ============================================================================
 * ADMIN BOOTSTRAP SCRIPT
 * ============================================================================
 *
 * This script creates a default admin user from environment variables.
 * It's designed to be idempotent (safe to run multiple times).
 *
 * USAGE:
 * ------
 * 1. Set environment variables:
 *    ADMIN_NAME=Admin User
 *    ADMIN_EMAIL=admin@example.com
 *    ADMIN_PASSWORD=SecurePassword123
 *
 * 2. Run the script:
 *    node scripts/seedAdmin.js
 *
 * 3. Or with npm script:
 *    npm run seed:admin
 *
 * ENVIRONMENT VARIABLES:
 * ----------------------
 * ADMIN_NAME     - Full name of the admin user (default: "System Administrator")
 * ADMIN_EMAIL    - Email address for admin login (required)
 * ADMIN_PASSWORD - Secure password for admin (required, min 6 chars)
 *
 * SECURITY NOTES:
 * ---------------
 * - Never commit actual admin credentials to version control
 * - Use strong passwords in production
 * - Consider using secrets management for production deployments
 * - Change default admin password immediately after first login
 *
 * ============================================================================
 */

require('dotenv').config();
const User = require('../src/models/User');
const connectDB = require('../src/config/database');

/**
 * Seed admin user
 */
const seedAdmin = async () => {
  try {
    console.log('🔧 Admin Bootstrap Script Starting...\n');

    // Connect to database
    console.log('📡 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected\n');

    // Get admin credentials from environment
    const adminName = process.env.ADMIN_NAME || 'System Administrator';
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    // Validate required environment variables
    if (!adminEmail) {
      console.error('❌ Error: ADMIN_EMAIL environment variable is required');
      console.log('\nUsage:');
      console.log(
        '  ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=SecurePass123 node scripts/seedAdmin.js'
      );
      process.exit(1);
    }

    if (!adminPassword) {
      console.error('❌ Error: ADMIN_PASSWORD environment variable is required');
      console.log('\nUsage:');
      console.log(
        '  ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=SecurePass123 node scripts/seedAdmin.js'
      );
      process.exit(1);
    }

    if (adminPassword.length < 6) {
      console.error('❌ Error: ADMIN_PASSWORD must be at least 6 characters long');
      process.exit(1);
    }

    // Check if admin already exists
    console.log(`🔍 Checking if admin user exists (${adminEmail})...`);
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists\n');
      console.log('User Details:');
      console.log(`  ID:     ${existingAdmin._id}`);
      console.log(`  Name:   ${existingAdmin.name}`);
      console.log(`  Email:  ${existingAdmin.email}`);
      console.log(`  Role:   ${existingAdmin.role}`);
      console.log(`  Active: ${existingAdmin.isActive}`);
      console.log(`  Created: ${existingAdmin.createdAt}\n`);

      // Update to admin role if not already
      if (existingAdmin.role !== 'admin') {
        console.log('🔄 Updating user role to admin...');
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log('✅ User role updated to admin\n');
      } else {
        console.log('✨ User is already an admin. No changes needed.\n');
      }
    } else {
      // Create new admin user
      console.log('🆕 Creating new admin user...\n');

      const admin = await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        isActive: true,
      });

      console.log('✅ Admin user created successfully!\n');
      console.log('Admin Details:');
      console.log(`  ID:     ${admin._id}`);
      console.log(`  Name:   ${admin.name}`);
      console.log(`  Email:  ${admin.email}`);
      console.log(`  Role:   ${admin.role}`);
      console.log(`  Active: ${admin.isActive}\n`);

      console.log('🔐 Login Credentials:');
      console.log(`  Email:    ${adminEmail}`);
      console.log(`  Password: ${adminPassword}`);
      console.log('\n⚠️  IMPORTANT: Change the admin password after first login!\n');
    }

    console.log('🎉 Admin bootstrap completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during admin bootstrap:', error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  }
};

/**
 * Handle unhandled promise rejections
 */
process.on('unhandledRejection', err => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Run the seed script
seedAdmin();
