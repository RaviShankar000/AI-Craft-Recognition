const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import the actual User model
const User = require('../src/models/User');

async function createDemoUsers() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-craft-recognition';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Define all demo accounts
    const demoAccounts = [
      { email: 'user@demo.com', name: 'Demo User', password: 'user123', role: 'user' },
      { email: 'seller@demo.com', name: 'Demo Seller', password: 'seller123', role: 'seller' },
      { email: 'admin@demo.com', name: 'Demo Admin', password: 'admin123', role: 'admin' },
      { email: 'superadmin@demo.com', name: 'Demo Super Admin', password: 'super123', role: 'super_admin' }
    ];

    // Delete existing demo accounts
    const emails = demoAccounts.map(acc => acc.email);
    const deleteResult = await User.deleteMany({ email: { $in: emails } });
    if (deleteResult.deletedCount > 0) {
      console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing demo accounts`);
    }

    // Hash passwords and create accounts
    const salt = await bcrypt.genSalt(10);
    const usersToCreate = [];
    
    for (const account of demoAccounts) {
      const hashedPassword = await bcrypt.hash(account.password, salt);
      
      usersToCreate.push({
        name: account.name,
        email: account.email,
        password: hashedPassword,
        role: account.role,
        isActive: true,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Use insertMany to bypass pre-save hooks (password already hashed)
    await User.insertMany(usersToCreate);
    
    // Log created accounts
    for (const account of demoAccounts) {
      console.log(`✅ Created ${account.role.toUpperCase().replace('_', ' ')} account`);
      console.log(`   Email: ${account.email}`);
      console.log(`   Password: ${account.password}`);
    }

    console.log('\n🎉 Demo accounts are ready to use!');
    
  } catch (error) {
    console.error('❌ Error creating demo users:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

createDemoUsers();
