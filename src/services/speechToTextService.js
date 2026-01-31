const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

/**
 * Speech-to-Text Service
 * Supports multiple providers: OpenAI Whisper, Google Speech-to-Text
 */
class SpeechToTextService {
  constructor() {
    this.provider = process.env.STT_PROVIDER || 'whisper'; // whisper, google
    this.apiKey = process.env.OPENAI_API_KEY || process.env.GOOGLE_STT_API_KEY;
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

      const formData = new FormData();
      formData.append('file', audioBuffer, {
        filename: filename || 'audio.wav',
        contentType: 'audio/wav',
      });
      formData.append('model', 'whisper-1');
      
      if (language) {
        formData.append('language', language);
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

      return {
        success: true,
        data: {
          text: response.data.text,
          provider: 'whisper',
          language: language || 'auto',
          duration: duration / 1000,
        },
      };
    } catch (error) {
      console.error('Whisper transcription error:', error.message);
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

      const base64Audio = audioBuffer.toString('base64');

      const requestBody = {
        config: {
          encoding: 'LINEAR16',
          sampleRateHertz: 16000,
          languageCode: language,
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
      const transcript = results
        .map((result) => result.alternatives[0]?.transcript || '')
        .join(' ');

      return {
        success: true,
        data: {
          text: transcript,
          provider: 'google',
          language: language,
          confidence: results[0]?.alternatives[0]?.confidence || 0,
          duration: duration / 1000,
        },
      };
    } catch (error) {
      console.error('Google STT error:', error.message);
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
    if (this.provider === 'whisper') {
      return this.transcribeWithWhisper(audioBuffer, filename, language);
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
    };
  }
}

module.exports = new SpeechToTextService();
