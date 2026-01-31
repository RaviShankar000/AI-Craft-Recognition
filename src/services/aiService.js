const axios = require('axios');
const FormData = require('form-data');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';

/**
 * AI Service - Handles communication with Flask AI microservice
 */
class AIService {
  /**
   * Check if AI service is healthy
   */
  static async checkHealth() {
    try {
      const response = await axios.get(`${AI_SERVICE_URL}/health`, {
        timeout: 5000,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
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
    try {
      // Validate file object
      if (!file || !file.buffer) {
        return {
          success: false,
          error: 'Invalid file object',
          message: 'File buffer is missing',
        };
      }

      // Create form data with the image file
      const formData = new FormData();
      
      // Append buffer with proper metadata
      formData.append('image', file.buffer, {
        filename: file.originalname || 'image.jpg',
        contentType: file.mimetype || 'image/jpeg',
        knownLength: file.size,
      });

      // Send request to Flask AI service
      const response = await axios.post(`${AI_SERVICE_URL}/predict`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 30000, // 30 seconds timeout for prediction
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      if (error.response) {
        // AI service returned an error
        return {
          success: false,
          error: error.response.data.error || 'AI service error',
          message: error.response.data.message,
          status: error.response.status,
        };
      } else if (error.request) {
        // No response from AI service
        return {
          success: false,
          error: 'AI service unavailable',
          message: 'Could not connect to AI service',
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
