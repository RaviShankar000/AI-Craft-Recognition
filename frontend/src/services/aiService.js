import apiClient from './api';

/**
 * AI Service - Handles AI prediction requests
 */
class AIService {
  /**
   * Predict craft type from image
   * @param {File} imageFile - Image file to analyze
   * @returns {Promise} Prediction results
   */
  static async predictCraft(imageFile) {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await apiClient.post('/ai/predict', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to predict craft',
        message: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Check AI service health
   * @returns {Promise} Health status
   */
  static async checkHealth() {
    try {
      const response = await apiClient.get('/ai/health');
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'AI service unavailable',
      };
    }
  }
}

export default AIService;
