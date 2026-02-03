const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('./src/config/database');
const config = require('./src/config/env');
const { corsOptions, handleCORSError, logCORSRequest } = require('./src/config/cors');
const { initializeSocket, setIO } = require('./src/config/socket');
const { initGracefulShutdown } = require('./src/utils/gracefulShutdown');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with JWT authentication
const io = initializeSocket(server);
setIO(io); // Make io instance available globally

// Connect to MongoDB
connectDB().catch(err => {
  console.error('Failed to initialize database connection:', err);
});

// Security Middleware
// Helmet helps secure Express apps by setting various HTTP headers
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
  crossOriginEmbedderPolicy: false, // Allow embedding for uploads
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin resources
}));

// CORS Middleware - Strict environment-based policy
app.use(logCORSRequest); // Log CORS requests
app.use(cors(corsOptions)); // Apply CORS policy

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Input Sanitization Middleware - Must come after body parsing
const { sanitizeAll } = require('./src/middleware/sanitize');
app.use(sanitizeAll);

// Request logging middleware
const { requestLogger, skipLogging } = require('./src/middleware/requestLogger');
const { maskResponseMiddleware } = require('./src/utils/maskSensitiveData');

// Mask sensitive data in responses
app.use(maskResponseMiddleware);

// Skip logging for health checks and static files
app.use(skipLogging(['/health', '/uploads', '/socket.io']));

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Routes
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const craftRoutes = require('./src/routes/craftRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const productRoutes = require('./src/routes/productRoutes');
const cartRoutes = require('./src/routes/cartRoutes');
const checkoutRoutes = require('./src/routes/checkoutRoutes');
const uploadRoutes = require('./src/routes/uploadRoutes');
const aiRoutes = require('./src/routes/aiRoutes');
const speechRoutes = require('./src/routes/speechRoutes');
const chatbotRoutes = require('./src/routes/chatbotRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const sellerRoutes = require('./src/routes/sellerRoutes');
const auditLogRoutes = require('./src/routes/auditLogRoutes');
const socketRoutes = require('./src/routes/socket');
const notificationRoutes = require('./src/routes/notificationRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/crafts', craftRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/speech', speechRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/socket', socketRoutes);
app.use('/api/notifications', notificationRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to AI Craft Recognition API' });
});

// Health check route
app.get('/health', (req, res) => {
  const dbStatus = require('mongoose').connection.readyState;
  const dbStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: dbStatusMap[dbStatus] || 'unknown',
  });
});

// Error handling middleware
const handleMulterError = require('./src/middleware/multerErrorHandler');
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handlers (must be last)
app.use(handleCORSError); // CORS error handler
app.use(handleMulterError);
app.use(errorHandler);

// Start server with Socket.IO
server.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Socket.IO enabled with JWT authentication`);
});

// Initialize graceful shutdown handlers
initGracefulShutdown(server, io, mongoose);

module.exports = { app, server, io };
