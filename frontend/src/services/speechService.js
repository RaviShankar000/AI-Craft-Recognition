import apiClient from './api';

/**
 * Speech Service - Handles speech-to-text functionality
 */
class SpeechService {
  /**
   * Transcribe audio file using backend API
   * @param {Blob} audioBlob - Audio blob to transcribe
   * @param {String} language - Language code (optional)
   * @returns {Promise} Transcription result
   */
  static async transcribeAudio(audioBlob, language = null) {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      if (language) {
        formData.append('language', language);
      }

      const response = await apiClient.post('/speech/transcribe', formData, {
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
        error: error.response?.data?.error || 'Transcription failed',
        message: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Check speech service status
   * @returns {Promise} Service status
   */
  static async checkStatus() {
    try {
      const response = await apiClient.get('/speech/status');
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Service unavailable',
      };
    }
  }

  /**
   * Check if browser supports Web Speech API
   * @returns {Boolean} Support status
   */
  static isBrowserSpeechSupported() {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  /**
   * Create browser speech recognition instance
   * @param {String} language - Language code (default: en-US)
   * @returns {Object} Speech recognition instance
   */
  static createBrowserRecognition(language = 'en-US') {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return null;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language;
      recognition.maxAlternatives = 1;

      return recognition;
    } catch (error) {
      console.error('Failed to create speech recognition:', error);
      return null;
    }
  }

  /**
   * Check if language is supported by browser
   * @param {String} language - Language code
   * @returns {Boolean} Support status
   */
  static isLanguageSupported(language) {
    if (!this.isBrowserSpeechSupported()) {
      return false;
    }

    // Try to create recognition with the language
    try {
      const recognition = this.createBrowserRecognition(language);
      if (recognition) {
        recognition.abort();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

export default SpeechService;
