const axios = require('axios');
const FormData = require('form-data');
const http = require('http');
const https = require('https');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';

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
  timeout: 30000,
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
      console.error('AI service health check failed:', error.message);
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

      console.log(`Sending image to AI service: ${file.originalname} (${(file.size / 1024).toFixed(2)}KB)`);

      // Create form data with the image file
      const formData = new FormData();
      
      // Append buffer with proper metadata
      formData.append('image', file.buffer, {
        filename: file.originalname || 'image.jpg',
        contentType: file.mimetype || 'image/jpeg',
        knownLength: file.size,
      });

      // Send request to Flask AI service with retry logic
      const response = await aiClient.post('/predict', formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });

      const duration = Date.now() - startTime;
      console.log(`AI prediction completed in ${duration}ms`);

      return {
        success: true,
        data: response.data,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`AI prediction failed after ${duration}ms:`, error.message);
      
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
          message: 'Could not connect to AI service. Please ensure the service is running.',
        };
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        return {
          success: false,
          error: 'Request timeout',
          message: 'AI service took too long to respond. Please try again.',
        };
      } else {
        // Other error
        return {
          success: false,
          error: 'Request error',
          message: error.message,
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
