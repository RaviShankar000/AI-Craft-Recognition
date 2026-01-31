const axios = require('axios');
const FormData = require('form-data');
const { sanitizeTranscript, validateAudioFile, sanitizeFilename } = require('../utils/sanitizer');

/**
 * Speech-to-Text Service
 * Supports multiple providers: OpenAI Whisper, Google Speech-to-Text
 */
class SpeechToTextService {
  constructor() {
    this.provider = process.env.STT_PROVIDER || 'whisper'; // whisper, google
    this.apiKey = process.env.OPENAI_API_KEY || process.env.GOOGLE_STT_API_KEY;

    // Whisper supports 99 languages
    this.whisperLanguages = [
      'af',
      'am',
      'ar',
      'as',
      'az',
      'ba',
      'be',
      'bg',
      'bn',
      'bo',
      'br',
      'bs',
      'ca',
      'cs',
      'cy',
      'da',
      'de',
      'el',
      'en',
      'es',
      'et',
      'eu',
      'fa',
      'fi',
      'fo',
      'fr',
      'gl',
      'gu',
      'ha',
      'haw',
      'he',
      'hi',
      'hr',
      'ht',
      'hu',
      'hy',
      'id',
      'is',
      'it',
      'ja',
      'jw',
      'ka',
      'kk',
      'km',
      'kn',
      'ko',
      'la',
      'lb',
      'ln',
      'lo',
      'lt',
      'lv',
      'mg',
      'mi',
      'mk',
      'ml',
      'mn',
      'mr',
      'ms',
      'mt',
      'my',
      'ne',
      'nl',
      'nn',
      'no',
      'oc',
      'pa',
      'pl',
      'ps',
      'pt',
      'ro',
      'ru',
      'sa',
      'sd',
      'si',
      'sk',
      'sl',
      'sn',
      'so',
      'sq',
      'sr',
      'su',
      'sv',
      'sw',
      'ta',
      'te',
      'tg',
      'th',
      'tk',
      'tl',
      'tr',
      'tt',
      'uk',
      'ur',
      'uz',
      'vi',
      'yi',
      'yo',
      'zh',
    ];

    // Google supports 125+ languages with BCP-47 format
    this.googleLanguages = [
      'af-ZA',
      'am-ET',
      'ar-AE',
      'ar-BH',
      'ar-DZ',
      'ar-EG',
      'ar-IQ',
      'ar-JO',
      'ar-KW',
      'ar-LB',
      'ar-LY',
      'ar-MA',
      'ar-OM',
      'ar-QA',
      'ar-SA',
      'ar-TN',
      'ar-YE',
      'az-AZ',
      'bg-BG',
      'bn-BD',
      'bn-IN',
      'bs-BA',
      'ca-ES',
      'cs-CZ',
      'da-DK',
      'de-AT',
      'de-CH',
      'de-DE',
      'el-GR',
      'en-AU',
      'en-CA',
      'en-GB',
      'en-GH',
      'en-HK',
      'en-IE',
      'en-IN',
      'en-KE',
      'en-NG',
      'en-NZ',
      'en-PH',
      'en-PK',
      'en-SG',
      'en-TZ',
      'en-US',
      'en-ZA',
      'es-AR',
      'es-BO',
      'es-CL',
      'es-CO',
      'es-CR',
      'es-DO',
      'es-EC',
      'es-ES',
      'es-GT',
      'es-HN',
      'es-MX',
      'es-NI',
      'es-PA',
      'es-PE',
      'es-PR',
      'es-PY',
      'es-SV',
      'es-US',
      'es-UY',
      'es-VE',
      'et-EE',
      'eu-ES',
      'fa-IR',
      'fi-FI',
      'fil-PH',
      'fr-BE',
      'fr-CA',
      'fr-CH',
      'fr-FR',
      'gl-ES',
      'gu-IN',
      'he-IL',
      'hi-IN',
      'hr-HR',
      'hu-HU',
      'hy-AM',
      'id-ID',
      'is-IS',
      'it-CH',
      'it-IT',
      'ja-JP',
      'jv-ID',
      'ka-GE',
      'kk-KZ',
      'km-KH',
      'kn-IN',
      'ko-KR',
      'lo-LA',
      'lt-LT',
      'lv-LV',
      'mk-MK',
      'ml-IN',
      'mn-MN',
      'mr-IN',
      'ms-MY',
      'my-MM',
      'ne-NP',
      'nl-BE',
      'nl-NL',
      'no-NO',
      'pa-IN',
      'pl-PL',
      'pt-BR',
      'pt-PT',
      'ro-RO',
      'ru-RU',
      'si-LK',
      'sk-SK',
      'sl-SI',
      'sq-AL',
      'sr-RS',
      'sv-SE',
      'sw-KE',
      'sw-TZ',
      'ta-IN',
      'ta-LK',
      'ta-MY',
      'ta-SG',
      'te-IN',
      'th-TH',
      'tr-TR',
      'uk-UA',
      'ur-IN',
      'ur-PK',
      'uz-UZ',
      'vi-VN',
      'zh-CN',
      'zh-HK',
      'zh-TW',
      'zu-ZA',
    ];
  }

  /**
   * Validate language code for the current provider
   * @param {String} language - Language code
   * @returns {Object} Validation result
   */
  validateLanguage(language) {
    if (!language) {
      return { valid: true, normalized: null }; // Auto-detect
    }

    const langCode = language.toLowerCase().trim();

    if (this.provider === 'whisper') {
      // Whisper uses ISO 639-1 codes (2-letter)
      const baseCode = langCode.split('-')[0];
      if (this.whisperLanguages.includes(baseCode)) {
        return { valid: true, normalized: baseCode };
      }
      return {
        valid: false,
        error: `Unsupported language '${language}' for Whisper. Use ISO 639-1 codes like 'en', 'es', 'fr'.`,
        supportedLanguages: this.whisperLanguages,
      };
    } else if (this.provider === 'google') {
      // Google uses BCP-47 format (e.g., en-US)
      const normalized = langCode.replace('_', '-');
      if (this.googleLanguages.includes(normalized)) {
        return { valid: true, normalized };
      }
      // Try base language code
      const baseCode = normalized.split('-')[0];
      const fallback = this.googleLanguages.find(l => l.startsWith(baseCode + '-'));
      if (fallback) {
        return { valid: true, normalized: fallback, warning: `Using fallback ${fallback}` };
      }
      return {
        valid: false,
        error: `Unsupported language '${language}' for Google STT. Use BCP-47 format like 'en-US', 'es-ES'.`,
        supportedLanguages: this.googleLanguages,
      };
    }

    return { valid: false, error: 'Invalid provider' };
  }

  /**
   * Transcribe audio using OpenAI Whisper API
   * @param {Buffer} audioBuffer - Audio file buffer
   * @param {String} filename - Original filename
   * @param {String} language - Language code (optional)
   * @returns {Promise} Transcription result
   */
  async transcribeWithWhisper(audioBuffer, filename, language = null) {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return {
          success: false,
          error: 'OpenAI API key not configured',
          message: 'Set OPENAI_API_KEY in environment variables',
        };
      }

      // Validate language
      const langValidation = this.validateLanguage(language);
      if (!langValidation.valid) {
        return {
          success: false,
          error: 'Unsupported language',
          message: langValidation.error,
          supportedLanguages: langValidation.supportedLanguages,
        };
      }

      const formData = new FormData();
      formData.append('file', audioBuffer, {
        filename: filename || 'audio.wav',
        contentType: 'audio/wav',
      });
      formData.append('model', 'whisper-1');

      if (langValidation.normalized) {
        formData.append('language', langValidation.normalized);
        if (langValidation.warning) {
          console.log(`Language warning: ${langValidation.warning}`);
        }
      }

      console.log('Sending audio to Whisper API...');
      const startTime = Date.now();

      const response = await axios.post(
        'https://api.openai.com/v1/audio/transcriptions',
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          timeout: 60000, // 60 seconds
        }
      );

      const duration = Date.now() - startTime;
      console.log(`Whisper transcription completed in ${duration}ms`);

      // Sanitize the transcript
      const sanitizedText = sanitizeTranscript(response.data.text, {
        maxLength: 5000,
        removeScripts: true,
        normalizeWhitespace: true,
      });

      return {
        success: true,
        data: {
          text: sanitizedText,
          provider: 'whisper',
          language: langValidation.normalized || 'auto',
          duration: duration / 1000,
        },
      };
    } catch (error) {
      console.error('Whisper transcription error:', error.message);

      // Handle specific API errors
      if (error.response?.status === 400) {
        const apiError = error.response?.data?.error;
        if (apiError?.message?.includes('audio file')) {
          return {
            success: false,
            error: 'Invalid audio file',
            message: 'Audio file format is not supported or corrupted',
          };
        }
      }

      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        return {
          success: false,
          error: 'Request timeout',
          message: 'Audio file too long or server unreachable',
        };
      }

      return {
        success: false,
        error: 'Transcription failed',
        message: error.response?.data?.error?.message || error.message,
      };
    }
  }

  /**
   * Transcribe audio using Google Speech-to-Text API
   * @param {Buffer} audioBuffer - Audio file buffer
   * @param {String} language - Language code (default: en-US)
   * @returns {Promise} Transcription result
   */
  async transcribeWithGoogle(audioBuffer, language = 'en-US') {
    try {
      if (!process.env.GOOGLE_STT_API_KEY) {
        return {
          success: false,
          error: 'Google API key not configured',
          message: 'Set GOOGLE_STT_API_KEY in environment variables',
        };
      }

      // Validate language
      const langValidation = this.validateLanguage(language);
      if (!langValidation.valid) {
        return {
          success: false,
          error: 'Unsupported language',
          message: langValidation.error,
          supportedLanguages: langValidation.supportedLanguages,
        };
      }

      if (langValidation.warning) {
        console.log(`Language warning: ${langValidation.warning}`);
      }

      const base64Audio = audioBuffer.toString('base64');

      const requestBody = {
        config: {
          encoding: 'LINEAR16',
          sampleRateHertz: 16000,
          languageCode: langValidation.normalized || language,
          enableAutomaticPunctuation: true,
        },
        audio: {
          content: base64Audio,
        },
      };

      console.log('Sending audio to Google Speech-to-Text API...');
      const startTime = Date.now();

      const response = await axios.post(
        `https://speech.googleapis.com/v1/speech:recognize?key=${process.env.GOOGLE_STT_API_KEY}`,
        requestBody,
        {
          timeout: 60000,
        }
      );

      const duration = Date.now() - startTime;
      console.log(`Google STT completed in ${duration}ms`);

      const results = response.data.results || [];
      const transcript = results.map(result => result.alternatives[0]?.transcript || '').join(' ');

      // Sanitize the transcript
      const sanitizedText = sanitizeTranscript(transcript, {
        maxLength: 5000,
        removeScripts: true,
        normalizeWhitespace: true,
      });

      // Check if transcription is empty
      if (!sanitizedText || sanitizedText.trim() === '') {
        return {
          success: false,
          error: 'No speech detected',
          message: 'Could not detect any speech in the audio file',
        };
      }

      return {
        success: true,
        data: {
          text: sanitizedText,
          provider: 'google',
          language: langValidation.normalized || language,
          confidence: results[0]?.alternatives[0]?.confidence || 0,
          duration: duration / 1000,
        },
      };
    } catch (error) {
      console.error('Google STT error:', error.message);

      // Handle specific API errors
      if (error.response?.status === 400) {
        const apiError = error.response?.data?.error;
        if (apiError?.message?.includes('audio')) {
          return {
            success: false,
            error: 'Invalid audio file',
            message: 'Audio file format is not supported or corrupted',
          };
        }
      }

      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        return {
          success: false,
          error: 'Request timeout',
          message: 'Audio file too long or server unreachable',
        };
      }

      return {
        success: false,
        error: 'Transcription failed',
        message: error.response?.data?.error?.message || error.message,
      };
    }
  }

  /**
   * Main transcription method - routes to appropriate provider
   * @param {Buffer} audioBuffer - Audio file buffer
   * @param {String} filename - Original filename
   * @param {String} language - Language code
   * @returns {Promise} Transcription result
   */
  async transcribe(audioBuffer, filename, language = null) {
    // Validate audio file
    const validation = validateAudioFile(
      { buffer: audioBuffer, size: audioBuffer.length },
      { maxSize: 25 * 1024 * 1024 }
    );

    if (!validation.valid) {
      return {
        success: false,
        error: 'Validation failed',
        message: validation.errors.join(', '),
      };
    }

    // Sanitize filename
    const safeFilename = sanitizeFilename(filename);

    if (this.provider === 'whisper') {
      return this.transcribeWithWhisper(audioBuffer, safeFilename, language);
    } else if (this.provider === 'google') {
      return this.transcribeWithGoogle(audioBuffer, language || 'en-US');
    } else {
      return {
        success: false,
        error: 'Invalid provider',
        message: `Provider "${this.provider}" is not supported`,
      };
    }
  }

  /**
   * Check if service is configured
   * @returns {Object} Configuration status
   */
  /**
   * Get supported languages for current provider
   * @returns {Array} List of supported language codes
   */
  getSupportedLanguages() {
    if (this.provider === 'whisper') {
      return this.whisperLanguages;
    } else if (this.provider === 'google') {
      return this.googleLanguages;
    }
    return [];
  }

  getStatus() {
    const hasWhisperKey = !!process.env.OPENAI_API_KEY;
    const hasGoogleKey = !!process.env.GOOGLE_STT_API_KEY;

    return {
      provider: this.provider,
      configured: this.provider === 'whisper' ? hasWhisperKey : hasGoogleKey,
      availableProviders: {
        whisper: hasWhisperKey,
        google: hasGoogleKey,
      },
      supportedLanguages: this.getSupportedLanguages(),
    };
  }
}

module.exports = new SpeechToTextService();
