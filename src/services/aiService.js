const axios = require('axios');
const FormData = require('form-data');
const http = require('http');
const https = require('https');
const logger = require('../config/logger');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';
const AI_TIMEOUT = parseInt(process.env.AI_TIMEOUT) || 15000; // 15 seconds default
const ENABLE_FALLBACK = process.env.ENABLE_AI_FALLBACK !== 'false'; // Default true

// Create axios instance with connection pooling and keep-alive
const httpAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 30000,
  maxSockets: 50,
  maxFreeSockets: 10,
});

const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 30000,
  maxSockets: 50,
  maxFreeSockets: 10,
});

const aiClient = axios.create({
  baseURL: AI_SERVICE_URL,
  timeout: AI_TIMEOUT,
  httpAgent,
  httpsAgent,
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
});

/**
 * AI Service - Handles communication with Flask AI microservice
 */
class AIService {
  /**
   * Fallback prediction when AI service is unavailable
   * Returns a generic response indicating the service is down
   */
  static getFallbackResponse(file) {
    logger.warn('Using AI service fallback response', {
      filename: file.originalname,
      size: file.size
    });

    return {
      success: true,
      fallback: true,
      data: {
        predictions: [],
        confidence: 0,
        craftType: 'Unknown',
        message: 'AI service is temporarily unavailable. Your image has been received and will be processed later.',
        processingMode: 'fallback'
      },
      warning: 'AI service unavailable - fallback response used'
    };
  }

  /**
   * Check if AI service is healthy
   */
  static async checkHealth() {
    try {
      const response = await aiClient.get('/health', {
        timeout: 5000,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      logger.error('AI service health check failed:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send image to AI service for prediction
   * @param {Object} file - Multer file object
   * @returns {Promise} Prediction results
   */
  static async predictCraft(file) {
    const startTime = Date.now();

    try {
      // Validate file object
      if (!file || !file.buffer) {
        return {
          success: false,
          error: 'Invalid file object',
          message: 'File buffer is missing',
        };
      }

      // Validate file size (16MB limit)
      const MAX_SIZE = 16 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        return {
          success: false,
          error: 'File too large',
          message: `File size must be less than ${MAX_SIZE / 1024 / 1024}MB`,
        };
      }

      console.log(
        `Sending image to AI service: ${file.originalname} (${(file.size / 1024).toFixed(2)}KB)`
      );

      // Create form data with the image file
      const formData = new FormData();

      // Append buffer with proper metadata
      formData.append('image', file.buffer, {
        filename: file.originalname || 'image.jpg',
        contentType: file.mimetype || 'image/jpeg',
        knownLength: file.size,
      });

      // Send request to Flask AI service with timeout
      const response = await aiClient.post('/predict', formData, {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: AI_TIMEOUT,
      });

      const duration = Date.now() - startTime;
      logger.info('AI prediction completed', {
        filename: file.originalname,
        duration: `${duration}ms`,
        confidence: response.data.confidence
      });

      return {
        success: true,
        data: response.data,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`AI prediction failed after ${duration}ms:`, {
        error: error.message,
        code: error.code,
        filename: file.originalname
      });

      // Check if fallback is enabled
      if (ENABLE_FALLBACK && (
        error.code === 'ECONNREFUSED' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ECONNABORTED' ||
        error.code === 'ENOTFOUND'
      )) {
        logger.warn('AI service unavailable, using fallback', {
          errorCode: error.code,
          timeout: AI_TIMEOUT
        });
        return this.getFallbackResponse(file);
      }

      if (error.response) {
        // AI service returned an error
        return {
          success: false,
          error: error.response.data.error || 'AI service error',
          message: error.response.data.message || error.message,
          status: error.response.status,
        };
      } else if (error.code === 'ECONNREFUSED') {
        return {
          success: false,
          error: 'AI service unavailable',
          message: 'Could not connect to AI service. The service may be down or unreachable.',
          code: 'SERVICE_UNAVAILABLE'
        };
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        return {
          success: false,
          error: 'Request timeout',
          message: `AI service did not respond within ${AI_TIMEOUT / 1000} seconds. Please try again with a smaller image.`,
          code: 'TIMEOUT'
        };
      } else if (error.code === 'ENOTFOUND') {
        return {
          success: false,
          error: 'AI service not found',
          message: 'AI service URL is not configured correctly.',
          code: 'NOT_FOUND'
        };
      } else {
        // Other error
        return {
          success: false,
          error: 'Request error',
          message: error.message,
          code: error.code
        };
      }
    }
  }

  /**
   * Predict craft from buffer (for internal use)
   * @param {Buffer} buffer - Image buffer
   * @param {String} filename - Original filename
   * @param {String} mimetype - File mime type
   * @returns {Promise} Prediction results
   */
  static async predictFromBuffer(buffer, filename, mimetype) {
    const file = {
      buffer,
      originalname: filename,
      mimetype,
    };
    return this.predictCraft(file);
  }
}

module.exports = AIService;
