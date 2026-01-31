import apiClient from './api';
import { sanitizeTranscript } from '../utils/sanitizer';

/**
 * Speech Service - Handles speech-to-text functionality
 */
class SpeechService {
  // Common supported languages for Web Speech API
  static supportedLanguages = [
    'en-US',
    'en-GB',
    'en-AU',
    'en-CA',
    'en-IN',
    'es-ES',
    'es-MX',
    'es-AR',
    'es-CO',
    'fr-FR',
    'fr-CA',
    'de-DE',
    'it-IT',
    'pt-BR',
    'pt-PT',
    'ru-RU',
    'ja-JP',
    'zh-CN',
    'zh-TW',
    'ko-KR',
    'ar-SA',
    'hi-IN',
    'nl-NL',
    'pl-PL',
    'tr-TR',
  ];
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

  /**
   * Validate language code
   * @param {String} language - Language code to validate
   * @returns {Object} Validation result
   */
  static validateLanguage(language) {
    if (!language) {
      return { valid: true };
    }

    if (this.supportedLanguages.includes(language)) {
      return { valid: true };
    }

    return {
      valid: false,
      error: `Language '${language}' is not supported. Please use a supported language code like 'en-US', 'es-ES', 'fr-FR'.`,
    };
  }

  /**
   * Get supported languages list
   * @returns {Array} List of supported language codes
   */
  static getSupportedLanguages() {
    return this.supportedLanguages;
  }

  /**
   * Map speech recognition error codes to user-friendly messages
   * @param {String} errorCode - Error code from speech recognition
   * @param {String} language - Language code that was used
   * @returns {String} User-friendly error message
   */
  static mapErrorToMessage(errorCode, language = '') {
    const errorMessages = {
      'no-speech': 'No speech detected. Please try again.',
      'audio-capture': 'Microphone not found or not accessible.',
      'not-allowed': 'Microphone permission denied. Please allow access.',
      network: 'Network error. Check your internet connection.',
      aborted: 'Speech recognition was aborted.',
      'language-not-supported': `Language '${language}' is not supported by your browser.`,
      'service-not-allowed': 'Speech service is not allowed in this context.',
    };

    return errorMessages[errorCode] || `Recognition error: ${errorCode}`;
  }

  /**
   * Process raw transcript with sanitization
   * @param {String} rawTranscript - Raw transcript from speech recognition
   * @param {Object} options - Sanitization options
   * @returns {String} Sanitized transcript
   */
  static processTranscript(rawTranscript, options = {}) {
    const defaultOptions = {
      maxLength: 5000,
      removeScripts: true,
      normalizeWhitespace: true,
      removeUrls: false,
      ...options,
    };

    return sanitizeTranscript(rawTranscript, defaultOptions);
  }

  /**
   * Start voice recognition with callbacks
   * @param {Object} config - Configuration object
   * @param {String} config.language - Language code
   * @param {Function} config.onStart - Callback when recognition starts
   * @param {Function} config.onResult - Callback when result is received
   * @param {Function} config.onError - Callback when error occurs
   * @param {Function} config.onEnd - Callback when recognition ends
   * @returns {Object} Recognition instance or error
   */
  static startVoiceRecognition(config) {
    const { language = 'en-US', onStart, onResult, onError, onEnd } = config;

    // Check browser support
    if (!this.isBrowserSpeechSupported()) {
      if (onError) {
        onError('Browser speech recognition not supported');
      }
      return { success: false, error: 'Browser not supported' };
    }

    // Validate language
    const validation = this.validateLanguage(language);
    if (!validation.valid) {
      if (onError) {
        onError(validation.error);
      }
      return { success: false, error: validation.error };
    }

    try {
      // Create recognition instance
      const recognition = this.createBrowserRecognition(language);

      if (!recognition) {
        const error = 'Failed to initialize speech recognition';
        if (onError) {
          onError(error);
        }
        return { success: false, error };
      }

      // Set up event handlers
      recognition.onstart = () => {
        console.log('Speech recognition started');
        if (onStart) {
          onStart();
        }
      };

      recognition.onresult = (event) => {
        const rawResult = event.results[0][0].transcript;
        console.log('Raw transcript:', rawResult);

        // Process and sanitize the transcript
        const sanitizedResult = this.processTranscript(rawResult);
        console.log('Sanitized transcript:', sanitizedResult);

        if (onResult) {
          onResult(sanitizedResult);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        const errorMessage = this.mapErrorToMessage(event.error, language);

        if (onError) {
          onError(errorMessage);
        }
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        if (onEnd) {
          onEnd();
        }
      };

      // Start recognition
      try {
        recognition.start();
        return { success: true, recognition };
      } catch (err) {
        console.error('Failed to start recognition:', err);
        const error = 'Failed to start speech recognition. Please try again.';
        if (onError) {
          onError(error);
        }
        return { success: false, error };
      }
    } catch (err) {
      console.error('Speech recognition initialization error:', err);
      const error = 'Failed to initialize speech recognition';
      if (onError) {
        onError(error);
      }
      return { success: false, error };
    }
  }

  /**
   * Stop voice recognition
   * @param {Object} recognition - Recognition instance to stop
   */
  static stopVoiceRecognition(recognition) {
    if (recognition) {
      try {
        recognition.stop();
      } catch (err) {
        console.error('Error stopping recognition:', err);
      }
    }
  }
}

export default SpeechService;
