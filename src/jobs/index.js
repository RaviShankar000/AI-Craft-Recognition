const logger = require('../config/logger');
const { scheduleFileCleanup } = require('./fileCleanup');

/**
 * Job Manager
 * Initializes and manages all background jobs
 */

const jobs = [];

/**
 * Initialize all scheduled jobs
 */
function initializeJobs() {
  try {
    logger.info('Initializing background jobs...');

    // File cleanup job
    const fileCleanupJob = scheduleFileCleanup();
    jobs.push({ name: 'fileCleanup', job: fileCleanupJob });
    logger.info('✓ File cleanup job initialized');

    logger.info(`All background jobs initialized (${jobs.length} jobs)`);
  } catch (error) {
    logger.error('Failed to initialize background jobs:', error);
    throw error;
  }
}

/**
 * Stop all jobs (for graceful shutdown)
 */
function stopAllJobs() {
  logger.info('Stopping background jobs...');
  jobs.forEach(({ name, job }) => {
    try {
      job.stop();
      logger.info(`✓ Stopped job: ${name}`);
    } catch (error) {
      logger.error(`Failed to stop job ${name}:`, error);
    }
  });
  logger.info('All background jobs stopped');
}

/**
 * Get job status
 */
function getJobStatus() {
  return jobs.map(({ name, job }) => ({
    name,
    running: job.running || false
  }));
}

module.exports = {
  initializeJobs,
  stopAllJobs,
  getJobStatus
};
