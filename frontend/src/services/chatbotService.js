import apiClient from './api';

/**
 * Chatbot Service - Handles chatbot interactions with streaming support
 */
class ChatbotService {
  /**
   * Send message to chatbot (HTTP fallback - use streaming for real-time)
   * @param {String} message - User message
   * @param {Object} context - Conversation context
   * @returns {Promise} Chatbot response
   */
  static async sendMessage(message, context = {}) {
    try {
      const userId = localStorage.getItem('userId') || 'anonymous';
      
      const response = await apiClient.post('/chatbot/message', {
        message,
        context,
        userId,
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
   * Set up chatbot streaming event listeners
   * @param {Object} socket - Socket.IO instance
   * @param {Object} callbacks - Event callbacks
   * @returns {Function} Cleanup function to remove listeners
   */
  static setupStreamingListeners(socket, callbacks = {}) {
    const {
      onStarted = () => {},
      onToken = () => {},
      onCompleted = () => {},
      onError = () => {},
    } = callbacks;

    // Chatbot started event
    const handleStarted = (data) => {
      console.log('Chatbot started:', data);
      onStarted(data);
    };

    // Token streaming event
    const handleToken = (data) => {
      console.log('Chatbot token:', data.token);
      onToken(data);
    };

    // Chatbot completed event
    const handleCompleted = (data) => {
      console.log('Chatbot completed:', data);
      onCompleted(data);
    };

    // Chatbot error event
    const handleError = (data) => {
      console.error('Chatbot error:', data);
      onError(data);
    };

    // Register listeners
    socket.on('chatbot_started', handleStarted);
    socket.on('chatbot_token', handleToken);
    socket.on('chatbot_completed', handleCompleted);
    socket.on('chatbot_error', handleError);

    // Return cleanup function
    return () => {
      socket.off('chatbot_started', handleStarted);
      socket.off('chatbot_token', handleToken);
      socket.off('chatbot_completed', handleCompleted);
      socket.off('chatbot_error', handleError);
    };
  }

  /**
   * Send streaming message via Socket.IO
   * @param {Object} socket - Socket.IO instance
   * @param {String} message - User message
   * @param {Object} context - Conversation context
   */
  static sendStreamingMessage(socket, message, context = {}) {
    const userId = localStorage.getItem('userId') || 'anonymous';
    
    // Join user-specific room
    socket.emit('join_room', userId);
    
    // Send message via HTTP (which triggers streaming via Socket.IO)
    return this.sendMessage(message, context);
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
