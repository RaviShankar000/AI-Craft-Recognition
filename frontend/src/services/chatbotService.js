import apiClient from './api';

/**
 * Chatbot Service - Handles chatbot interactions
 */
class ChatbotService {
  /**
   * Send message to chatbot
   * @param {String} message - User message
   * @param {Object} context - Conversation context
   * @returns {Promise} Chatbot response
   */
  static async sendMessage(message, context = {}) {
    try {
      const response = await apiClient.post('/chatbot/message', {
        message,
        context,
      });

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Chatbot message error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to send message',
        message: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Get quick help topics
   * @returns {Promise} Quick help topics
   */
  static async getQuickHelp() {
    try {
      const response = await apiClient.get('/chatbot/quick-help');

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Get quick help error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get quick help',
      };
    }
  }

  /**
   * Get FAQs
   * @returns {Promise} List of FAQs
   */
  static async getFAQs() {
    try {
      const response = await apiClient.get('/chatbot/faqs');

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Get FAQs error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get FAQs',
      };
    }
  }

  /**
   * Get chatbot status
   * @returns {Promise} Chatbot status
   */
  static async getStatus() {
    try {
      const response = await apiClient.get('/chatbot/status');

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Get chatbot status error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get status',
      };
    }
  }

  /**
   * Validate message before sending
   * @param {String} message - Message to validate
   * @returns {Object} Validation result
   */
  static validateMessage(message) {
    if (!message || typeof message !== 'string') {
      return {
        valid: false,
        error: 'Message must be a string',
      };
    }

    const trimmed = message.trim();

    if (trimmed.length === 0) {
      return {
        valid: false,
        error: 'Message cannot be empty',
      };
    }

    if (trimmed.length > 1000) {
      return {
        valid: false,
        error: 'Message is too long (max 1000 characters)',
      };
    }

    return {
      valid: true,
      message: trimmed,
    };
  }
}

export default ChatbotService;
