const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

const config = {
  // Server Configuration
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database Configuration
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-craft-recognition',

  // CORS Configuration
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  // Multiple CORS origins support (comma-separated in .env)
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:5173', 'http://localhost:3000'],

  // API Keys
  openaiApiKey: process.env.OPENAI_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,

  // JWT Configuration
  jwtSecret: process.env.JWT_SECRET,
  jwtExpire: process.env.JWT_EXPIRE || '30d',
};

// Validate required environment variables
const validateConfig = () => {
  const required = ['mongodbUri'];

  const missing = required.filter(key => !config[key.replace(/([A-Z])/g, '_$1').toLowerCase()]);

  if (missing.length > 0 && config.nodeEnv === 'production') {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

validateConfig();

module.exports = config;
