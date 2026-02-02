const config = require('../config/env');

/**
 * Socket Debug Logger
 * Provides detailed logging for socket events during development
 */

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',

  // Foreground colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  // Background colors
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
};

// Enable debug logging in development or when DEBUG_SOCKET env var is set
const isDebugEnabled = config.nodeEnv === 'development' || process.env.DEBUG_SOCKET === 'true';

// Track event statistics
const eventStats = {
  totalEvents: 0,
  eventCounts: {},
  errorCounts: {},
  startTime: Date.now(),
};

/**
 * Format timestamp for logs
 */
const getTimestamp = () => {
  const now = new Date();
  return now.toISOString();
};

/**
 * Format duration in milliseconds to human-readable format
 */
const formatDuration = ms => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}m`;
};

/**
 * Truncate large objects for cleaner logs
 */
const truncateData = (data, maxLength = 100) => {
  if (typeof data === 'string' && data.length > maxLength) {
    return data.substring(0, maxLength) + '...';
  }

  if (typeof data === 'object' && data !== null) {
    const str = JSON.stringify(data);
    if (str.length > maxLength) {
      return JSON.stringify(data, null, 0).substring(0, maxLength) + '...';
    }
  }

  return data;
};

/**
 * Format socket info for logging
 */
const formatSocketInfo = socket => {
  return {
    socketId: socket.id,
    userId: socket.userId || 'anonymous',
    userRole: socket.userRole || 'none',
    email: socket.userEmail || 'N/A',
    connected: socket.connected,
    rooms: Array.from(socket.rooms || []),
  };
};

/**
 * Log with color and formatting
 */
const colorLog = (level, color, prefix, message, data = null) => {
  if (!isDebugEnabled && level !== 'error') return;

  const timestamp = getTimestamp();
  const coloredPrefix = `${color}${prefix}${colors.reset}`;

  const logMessage = `${colors.dim}[${timestamp}]${colors.reset} ${coloredPrefix} ${message}`;

  console.log(logMessage);

  if (data) {
    console.log(`${colors.dim}${JSON.stringify(data, null, 2)}${colors.reset}`);
  }
};

/**
 * Debug log levels
 */
const logger = {
  /**
   * Log connection events
   */
  connection: (socket, message, data = null) => {
    colorLog('info', colors.green, '[SOCKET:CONN]', message, {
      ...formatSocketInfo(socket),
      ...data,
    });
  },

  /**
   * Log disconnection events
   */
  disconnection: (socket, reason, data = null) => {
    colorLog('info', colors.yellow, '[SOCKET:DISC]', `Disconnected: ${reason}`, {
      ...formatSocketInfo(socket),
      ...data,
    });
  },

  /**
   * Log event emissions (server -> client)
   */
  emit: (eventName, target, data = null) => {
    eventStats.totalEvents++;
    eventStats.eventCounts[eventName] = (eventStats.eventCounts[eventName] || 0) + 1;

    const truncatedData = truncateData(data);
    colorLog('info', colors.cyan, '[SOCKET:EMIT]', `${eventName} -> ${target}`, {
      event: eventName,
      target,
      data: truncatedData,
      count: eventStats.eventCounts[eventName],
    });
  },

  /**
   * Log event reception (client -> server)
   */
  receive: (socket, eventName, data = null) => {
    eventStats.totalEvents++;
    eventStats.eventCounts[eventName] = (eventStats.eventCounts[eventName] || 0) + 1;

    const truncatedData = truncateData(data);
    colorLog(
      'info',
      colors.blue,
      '[SOCKET:RECV]',
      `${eventName} <- ${socket.userId || socket.id}`,
      {
        event: eventName,
        from: formatSocketInfo(socket),
        data: truncatedData,
        count: eventStats.eventCounts[eventName],
      }
    );
  },

  /**
   * Log authorization checks
   */
  auth: (socket, eventName, authorized, requiredRoles = []) => {
    const color = authorized ? colors.green : colors.red;
    const status = authorized ? 'AUTHORIZED' : 'DENIED';

    colorLog('info', color, '[SOCKET:AUTH]', `${status} - ${eventName}`, {
      event: eventName,
      userId: socket.userId,
      userRole: socket.userRole,
      requiredRoles,
      authorized,
    });
  },

  /**
   * Log validation results
   */
  validation: (socket, eventName, valid, error = null) => {
    const color = valid ? colors.green : colors.yellow;
    const status = valid ? 'VALID' : 'INVALID';

    colorLog('info', color, '[SOCKET:VALID]', `${status} - ${eventName}`, {
      event: eventName,
      userId: socket.userId,
      valid,
      error,
    });
  },

  /**
   * Log errors
   */
  error: (socket, eventName, error, context = null) => {
    eventStats.errorCounts[eventName] = (eventStats.errorCounts[eventName] || 0) + 1;

    colorLog('error', colors.red, '[SOCKET:ERROR]', `${eventName} - ${error.message}`, {
      event: eventName,
      from: socket ? formatSocketInfo(socket) : 'N/A',
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code,
      },
      context,
      errorCount: eventStats.errorCounts[eventName],
    });
  },

  /**
   * Log room operations
   */
  room: (socket, action, roomName, data = null) => {
    colorLog('info', colors.magenta, '[SOCKET:ROOM]', `${action} - ${roomName}`, {
      action,
      room: roomName,
      userId: socket.userId,
      socketId: socket.id,
      ...data,
    });
  },

  /**
   * Log broadcast operations
   */
  broadcast: (eventName, target, data = null) => {
    const truncatedData = truncateData(data);
    colorLog('info', colors.cyan + colors.bright, '[SOCKET:BCAST]', `${eventName} -> ${target}`, {
      event: eventName,
      target,
      data: truncatedData,
    });
  },

  /**
   * Log performance metrics
   */
  performance: (operation, duration, data = null) => {
    const color = duration > 1000 ? colors.red : duration > 500 ? colors.yellow : colors.green;

    colorLog('info', color, '[SOCKET:PERF]', `${operation} - ${formatDuration(duration)}`, {
      operation,
      duration: `${duration}ms`,
      ...data,
    });
  },

  /**
   * Log general info
   */
  info: (message, data = null) => {
    colorLog('info', colors.white, '[SOCKET:INFO]', message, data);
  },

  /**
   * Log warnings
   */
  warn: (message, data = null) => {
    colorLog('warn', colors.yellow + colors.bright, '[SOCKET:WARN]', message, data);
  },

  /**
   * Log debug information
   */
  debug: (message, data = null) => {
    colorLog('debug', colors.dim, '[SOCKET:DEBUG]', message, data);
  },
};

/**
 * Get event statistics
 */
const getStats = () => {
  const uptime = Date.now() - eventStats.startTime;
  const eventsPerMinute = (eventStats.totalEvents / (uptime / 60000)).toFixed(2);

  return {
    uptime: formatDuration(uptime),
    totalEvents: eventStats.totalEvents,
    eventsPerMinute,
    eventCounts: { ...eventStats.eventCounts },
    errorCounts: { ...eventStats.errorCounts },
    topEvents: Object.entries(eventStats.eventCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([event, count]) => ({ event, count })),
  };
};

/**
 * Reset statistics
 */
const resetStats = () => {
  eventStats.totalEvents = 0;
  eventStats.eventCounts = {};
  eventStats.errorCounts = {};
  eventStats.startTime = Date.now();
  logger.info('Statistics reset');
};

/**
 * Print statistics to console
 */
const printStats = () => {
  const stats = getStats();

  console.log(
    '\n' +
      colors.cyan +
      colors.bright +
      '═══════════════════════════════════════════════════' +
      colors.reset
  );
  console.log(colors.cyan + colors.bright + '           SOCKET EVENT STATISTICS' + colors.reset);
  console.log(
    colors.cyan +
      colors.bright +
      '═══════════════════════════════════════════════════' +
      colors.reset +
      '\n'
  );

  console.log(`${colors.white}Uptime:${colors.reset} ${stats.uptime}`);
  console.log(`${colors.white}Total Events:${colors.reset} ${stats.totalEvents}`);
  console.log(`${colors.white}Events/Minute:${colors.reset} ${stats.eventsPerMinute}\n`);

  if (stats.topEvents.length > 0) {
    console.log(colors.green + 'Top Events:' + colors.reset);
    stats.topEvents.forEach(({ event, count }, index) => {
      console.log(`  ${index + 1}. ${event}: ${count}`);
    });
    console.log('');
  }

  const errorCount = Object.values(stats.errorCounts).reduce((sum, count) => sum + count, 0);
  if (errorCount > 0) {
    console.log(colors.red + 'Errors:' + colors.reset);
    Object.entries(stats.errorCounts)
      .sort(([, a], [, b]) => b - a)
      .forEach(([event, count]) => {
        console.log(`  ${event}: ${count}`);
      });
    console.log('');
  }

  console.log(
    colors.cyan +
      colors.bright +
      '═══════════════════════════════════════════════════' +
      colors.reset +
      '\n'
  );
};

/**
 * Create a middleware to log all socket events
 */
const createLoggingMiddleware = () => {
  return (socket, next) => {
    if (!isDebugEnabled) return next();

    logger.connection(socket, 'Middleware: Authentication in progress');

    // Log all incoming events
    const originalOnevent = socket.onevent;
    socket.onevent = function (packet) {
      const [eventName, data] = packet.data || [];

      if (eventName && !eventName.startsWith('ping') && !eventName.startsWith('pong')) {
        logger.receive(socket, eventName, data);
      }

      originalOnevent.call(this, packet);
    };

    // Log all outgoing events
    const originalEmit = socket.emit;
    socket.emit = function (eventName, ...args) {
      if (eventName && !eventName.startsWith('ping') && !eventName.startsWith('pong')) {
        logger.emit(eventName, socket.id, args[0]);
      }

      return originalEmit.apply(this, [eventName, ...args]);
    };

    next();
  };
};

/**
 * Wrap event handler with performance logging
 */
const withPerformanceLogging = (eventName, handler) => {
  return async function (...args) {
    if (!isDebugEnabled) {
      return handler.apply(this, args);
    }

    const startTime = Date.now();

    try {
      const result = await handler.apply(this, args);
      const duration = Date.now() - startTime;

      logger.performance(eventName, duration, {
        success: true,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.performance(eventName, duration, {
        success: false,
        error: error.message,
      });

      throw error;
    }
  };
};

/**
 * Enable or disable debug logging at runtime
 */
const setDebugEnabled = enabled => {
  process.env.DEBUG_SOCKET = enabled ? 'true' : 'false';
  logger.info(`Debug logging ${enabled ? 'enabled' : 'disabled'}`);
};

/**
 * Check if debug logging is enabled
 */
const isEnabled = () => isDebugEnabled;

module.exports = {
  logger,
  getStats,
  resetStats,
  printStats,
  createLoggingMiddleware,
  withPerformanceLogging,
  setDebugEnabled,
  isEnabled,
  colors,
};
