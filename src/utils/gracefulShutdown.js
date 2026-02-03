const logger = require('../config/logger');

/**
 * Graceful Shutdown Handler
 * Handles SIGTERM and SIGINT signals to gracefully shutdown the server
 */
class GracefulShutdown {
  constructor(server, io, mongoose) {
    this.server = server;
    this.io = io;
    this.mongoose = mongoose;
    this.isShuttingDown = false;
    this.connections = new Set();

    // Track active connections
    this.server.on('connection', (connection) => {
      this.connections.add(connection);
      connection.on('close', () => {
        this.connections.delete(connection);
      });
    });
  }

  /**
   * Shutdown the server gracefully
   */
  async shutdown(signal) {
    if (this.isShuttingDown) {
      logger.warn('Shutdown already in progress...');
      return;
    }

    this.isShuttingDown = true;
    logger.info(`\n🛑 Received ${signal}, starting graceful shutdown...`);

    const shutdownTimeout = setTimeout(() => {
      logger.error('❌ Graceful shutdown timeout, forcing exit');
      process.exit(1);
    }, 30000); // 30 second timeout

    try {
      // Stop accepting new connections
      logger.info('1️⃣ Stopping server from accepting new connections...');
      await this.stopServer();

      // Close Socket.IO connections
      logger.info('2️⃣ Closing Socket.IO connections...');
      await this.closeSocketIO();

      // Close active HTTP connections
      logger.info('3️⃣ Closing active HTTP connections...');
      await this.closeConnections();

      // Close database connections
      logger.info('4️⃣ Closing database connections...');
      await this.closeDatabase();

      // Stop background jobs
      logger.info('5️⃣ Stopping background jobs...');
      await this.stopBackgroundJobs();

      clearTimeout(shutdownTimeout);
      logger.info('✅ Graceful shutdown completed successfully');
      process.exit(0);
    } catch (error) {
      clearTimeout(shutdownTimeout);
      logger.error('❌ Error during graceful shutdown:', error);
      process.exit(1);
    }
  }

  /**
   * Stop the HTTP server
   */
  stopServer() {
    return new Promise((resolve, reject) => {
      this.server.close((err) => {
        if (err) {
          logger.error('Error closing server:', err);
          return reject(err);
        }
        logger.info('✓ Server stopped accepting new connections');
        resolve();
      });
    });
  }

  /**
   * Close Socket.IO connections
   */
  async closeSocketIO() {
    return new Promise((resolve) => {
      if (!this.io) {
        return resolve();
      }

      const sockets = Array.from(this.io.sockets.sockets.values());
      logger.info(`  Disconnecting ${sockets.length} socket(s)...`);

      sockets.forEach((socket) => {
        socket.disconnect(true);
      });

      this.io.close(() => {
        logger.info('✓ Socket.IO connections closed');
        resolve();
      });

      // Force close after 5 seconds
      setTimeout(() => {
        logger.warn('⚠️ Force closing Socket.IO connections');
        resolve();
      }, 5000);
    });
  }

  /**
   * Close active HTTP connections
   */
  async closeConnections() {
    return new Promise((resolve) => {
      if (this.connections.size === 0) {
        logger.info('✓ No active HTTP connections to close');
        return resolve();
      }

      logger.info(`  Closing ${this.connections.size} HTTP connection(s)...`);

      this.connections.forEach((connection) => {
        connection.end();
        connection.destroy();
      });

      logger.info('✓ Active HTTP connections closed');
      resolve();
    });
  }

  /**
   * Close database connections
   */
  async closeDatabase() {
    try {
      if (!this.mongoose) {
        return;
      }

      await this.mongoose.connection.close();
      logger.info('✓ Database connections closed');
    } catch (error) {
      logger.error('Error closing database:', error);
      throw error;
    }
  }

  /**
   * Stop background jobs
   */
  async stopBackgroundJobs() {
    try {
      const { stopAllJobs } = require('../jobs');
      stopAllJobs();
      logger.info('✓ Background jobs stopped');
    } catch (error) {
      logger.error('Error stopping background jobs:', error);
      // Don't throw - jobs stopping failure shouldn't prevent shutdown
    }
  }

  /**
   * Setup signal handlers
   */
  setupHandlers() {
    // SIGTERM: termination signal (e.g., from Docker, Kubernetes)
    process.on('SIGTERM', () => {
      this.shutdown('SIGTERM');
    });

    // SIGINT: interrupt signal (Ctrl+C)
    process.on('SIGINT', () => {
      this.shutdown('SIGINT');
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('💥 Uncaught Exception:', error);
      this.shutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      this.shutdown('unhandledRejection');
    });

    logger.info('🛡️ Graceful shutdown handlers registered');
  }
}

/**
 * Initialize graceful shutdown
 */
const initGracefulShutdown = (server, io, mongoose) => {
  const gracefulShutdown = new GracefulShutdown(server, io, mongoose);
  gracefulShutdown.setupHandlers();
  return gracefulShutdown;
};

module.exports = { GracefulShutdown, initGracefulShutdown };
