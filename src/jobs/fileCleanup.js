const fs = require('fs').promises;
const path = require('path');
const cron = require('node-cron');
const logger = require('../config/logger');
const Product = require('../models/Product');
const Craft = require('../models/Craft');

/**
 * File Cleanup Service
 * Removes unused uploaded images that are not referenced in database
 */

const UPLOAD_DIR = path.join(__dirname, '../../uploads');
const MAX_FILE_AGE_DAYS = 30; // Remove files older than 30 days if unused

/**
 * Get all image URLs from database
 */
async function getDatabaseImageUrls() {
  try {
    const imageUrls = new Set();

    // Get product images
    const products = await Product.find({}, 'image').lean();
    products.forEach(product => {
      if (product.image?.url) {
        imageUrls.add(product.image.url);
      }
    });

    // Get craft images
    const crafts = await Craft.find({}, 'images').lean();
    crafts.forEach(craft => {
      if (craft.images && Array.isArray(craft.images)) {
        craft.images.forEach(img => {
          if (img.url) {
            imageUrls.add(img.url);
          }
        });
      }
    });

    logger.info(`Found ${imageUrls.size} images referenced in database`);
    return imageUrls;
  } catch (error) {
    logger.error('Error fetching database image URLs:', error);
    throw error;
  }
}

/**
 * Get all files in upload directory
 */
async function getUploadedFiles() {
  try {
    const files = await fs.readdir(UPLOAD_DIR);
    const fileStats = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(UPLOAD_DIR, file);
        const stats = await fs.stat(filePath);
        return {
          name: file,
          path: filePath,
          size: stats.size,
          mtime: stats.mtime,
          age: Date.now() - stats.mtime.getTime()
        };
      })
    );
    
    logger.info(`Found ${fileStats.length} files in uploads directory`);
    return fileStats;
  } catch (error) {
    logger.error('Error reading upload directory:', error);
    throw error;
  }
}

/**
 * Check if file URL is referenced in database
 */
function isFileReferenced(filename, databaseUrls) {
  // Check if any database URL contains this filename
  for (const url of databaseUrls) {
    if (url.includes(filename)) {
      return true;
    }
  }
  return false;
}

/**
 * Delete unused files
 */
async function deleteUnusedFiles() {
  try {
    logger.info('Starting file cleanup job...');
    const startTime = Date.now();

    // Get database references and uploaded files
    const databaseUrls = await getDatabaseImageUrls();
    const uploadedFiles = await getUploadedFiles();

    // Find files to delete
    const maxAge = MAX_FILE_AGE_DAYS * 24 * 60 * 60 * 1000; // Convert to milliseconds
    const filesToDelete = [];
    const stats = {
      total: uploadedFiles.length,
      referenced: 0,
      unreferenced: 0,
      tooNew: 0,
      deleted: 0,
      errors: 0
    };

    for (const file of uploadedFiles) {
      // Skip system files
      if (file.name.startsWith('.')) {
        continue;
      }

      // Check if file is referenced
      if (isFileReferenced(file.name, databaseUrls)) {
        stats.referenced++;
        continue;
      }

      // Check file age
      if (file.age < maxAge) {
        stats.tooNew++;
        logger.debug(`File ${file.name} is unreferenced but only ${Math.floor(file.age / (24 * 60 * 60 * 1000))} days old`);
        continue;
      }

      // File is unreferenced and old enough to delete
      stats.unreferenced++;
      filesToDelete.push(file);
    }

    // Delete the files
    for (const file of filesToDelete) {
      try {
        await fs.unlink(file.path);
        stats.deleted++;
        logger.info(`Deleted unused file: ${file.name} (${Math.floor(file.size / 1024)}KB, ${Math.floor(file.age / (24 * 60 * 60 * 1000))} days old)`);
      } catch (error) {
        stats.errors++;
        logger.error(`Failed to delete file ${file.name}:`, error);
      }
    }

    const duration = Date.now() - startTime;
    logger.info('File cleanup completed', {
      duration: `${duration}ms`,
      stats: {
        ...stats,
        spaceSaved: `${Math.floor(filesToDelete.reduce((sum, f) => sum + f.size, 0) / 1024)}KB`
      }
    });

    return stats;
  } catch (error) {
    logger.error('File cleanup job failed:', error);
    throw error;
  }
}

/**
 * Schedule file cleanup job
 * Runs daily at 2 AM
 */
function scheduleFileCleanup() {
  // Run every day at 2:00 AM
  const job = cron.schedule('0 2 * * *', async () => {
    try {
      logger.info('File cleanup job triggered by schedule');
      await deleteUnusedFiles();
    } catch (error) {
      logger.error('Scheduled file cleanup failed:', error);
    }
  }, {
    scheduled: true,
    timezone: "UTC"
  });

  logger.info('File cleanup job scheduled (daily at 2:00 AM UTC)');
  return job;
}

/**
 * Run cleanup immediately (for testing)
 */
async function runCleanupNow() {
  logger.info('Running file cleanup immediately...');
  return await deleteUnusedFiles();
}

module.exports = {
  scheduleFileCleanup,
  runCleanupNow,
  deleteUnusedFiles
};
