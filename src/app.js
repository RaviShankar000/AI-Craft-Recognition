/**
 * Express Application Configuration
 * Separated from server.js for testing purposes
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();
const { corsOptions } = require('./src/config/cors');
const logger = require('./src/config/logger');

const app = express();

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS Configuration
app.use(cors(corsOptions));

// Body Parser Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request Logging Middleware
const requestLogger = require('./src/middleware/requestLogger');
app.use(requestLogger);

// Sanitization Middleware
const { sanitizeInput } = require('./src/middleware/sanitize');
app.use(sanitizeInput);

// API Versioning Middleware
const apiVersion = require('./src/middleware/apiVersion');
app.use(apiVersion);

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API Routes
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const craftRoutes = require('./src/routes/craftRoutes');
const productRoutes = require('./src/routes/productRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const sellerRoutes = require('./src/routes/sellerRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const cartRoutes = require('./src/routes/cartRoutes');
const chatbotRoutes = require('./src/routes/chatbotRoutes');
const aiRoutes = require('./src/routes/aiRoutes');
const speechRoutes = require('./src/routes/speechRoutes');
const uploadRoutes = require('./src/routes/uploadRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const auditLogRoutes = require('./src/routes/auditLogRoutes');
const checkoutRoutes = require('./src/routes/checkoutRoutes');

// Mount routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/crafts', craftRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/seller', sellerRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/chatbot', chatbotRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/speech', speechRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/audit', auditLogRoutes);
app.use('/api/v1/checkout', checkoutRoutes);

// Legacy routes (without version prefix)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/crafts', craftRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/speech', speechRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit', auditLogRoutes);
app.use('/api/checkout', checkoutRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
  });
});

// Global Error Handler
const errorHandler = require('./src/middleware/errorHandler');
app.use(errorHandler);

module.exports = app;
