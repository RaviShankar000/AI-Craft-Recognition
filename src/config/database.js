const mongoose = require('mongoose');
const config = require('./env');

const connectDB = async () => {
  try {
    // Set mongoose options
    mongoose.set('strictQuery', false);

    // Connect to MongoDB
    const conn = await mongoose.connect(config.mongodbUri);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);

    // Handle connection events
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error(`❌ Mongoose connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  Mongoose disconnected from MongoDB');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('Mongoose connection closed due to app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error('Failed to connect to MongoDB. Please check your connection string and ensure MongoDB is running.');
    
    // Exit with failure in production, allow retry in development
    if (config.nodeEnv === 'production') {
      process.exit(1);
    } else {
      console.log('Continuing in development mode without database...');
    }
  }
};

module.exports = connectDB;
