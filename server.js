const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./src/config/database');
const config = require('./src/config/env');

const app = express();

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
const uploadRoutes = require('./src/routes/uploadRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/crafts', craftRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);

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

// Start server
app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
});

module.exports = app;
