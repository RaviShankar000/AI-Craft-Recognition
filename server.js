const express = require('express');
const http = require('http');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./src/config/database');
const config = require('./src/config/env');
const { initializeSocket, setIO } = require('./src/config/socket');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with JWT authentication
const io = initializeSocket(server);
setIO(io); // Make io instance available globally

// Connect to MongoDB
connectDB().catch(err => {
  console.error('Failed to initialize database connection:', err);
});

// Middleware
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
const errorHandler = require('./src/middleware/errorHandler');
app.use(handleMulterError);
app.use(errorHandler);

// Start server with Socket.IO
server.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Socket.IO enabled with JWT authentication`);
});

module.exports = { app, server, io };
