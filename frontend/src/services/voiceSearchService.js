import craftService from './craftService';
import { sanitizeTranscript } from '../utils/sanitizer';

/**
 * Voice Search Service - Handles voice-based craft search
 */
class VoiceSearchService {
  /**
   * Process voice transcript for search
   * @param {String} transcript - Raw voice transcript
   * @param {Object} options - Processing options
   * @returns {String} Processed search query
   */
  static processVoiceQuery(transcript, options = {}) {
    if (!transcript || transcript.trim() === '') {
      return null;
    }

    const defaultOptions = {
      maxLength: 200,
      removeScripts: true,
      normalizeWhitespace: true,
      ...options,
    };

    return sanitizeTranscript(transcript, defaultOptions);
  }

  /**
   * Perform voice search for crafts
   * @param {String} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise} Search results
   */
  static async searchCrafts(query, options = {}) {
    if (!query || query.trim() === '') {
      return {
        success: false,
        error: 'Empty search query',
        data: [],
      };
    }

    try {
      const results = await craftService.voiceSearchCrafts(query, options);

      if (results.success) {
        return {
          success: true,
          data: results.data,
          count: results.count,
          total: results.total,
          page: results.page,
          pages: results.pages,
          query: results.query || query,
        };
      }

      return {
        success: false,
        error: results.error || 'Failed to search crafts',
        message: results.message,
        data: [],
      };
    } catch (error) {
      console.error('Voice search error:', error);
      return {
        success: false,
        error: 'An error occurred while searching',
        message: error.message,
        data: [],
      };
    }
  }

  /**
   * Handle voice transcript and perform search
   * @param {String} transcript - Voice transcript
   * @param {Object} searchOptions - Search options
   * @returns {Promise} Search results
   */
  static async handleVoiceSearch(transcript, searchOptions = {}) {
    // Process the transcript
    const processedQuery = this.processVoiceQuery(transcript);

    if (!processedQuery) {
      return {
        success: false,
        error: 'Invalid transcript',
        data: [],
      };
    }

    // Perform the search
    const results = await this.searchCrafts(processedQuery, searchOptions);

    // Log search analytics
    if (results.success) {
      console.log(
        `Voice search completed: "${processedQuery}" - Found ${results.count} results`
      );
    } else {
      console.error(`Voice search failed: "${processedQuery}" - ${results.error}`);
    }

    return results;
  }

  /**
   * Validate search query
   * @param {String} query - Search query to validate
   * @returns {Object} Validation result
   */
  static validateSearchQuery(query) {
    if (!query || typeof query !== 'string') {
      return {
        valid: false,
        error: 'Query must be a string',
      };
    }

    const trimmedQuery = query.trim();

    if (trimmedQuery.length === 0) {
      return {
        valid: false,
        error: 'Query cannot be empty',
      };
    }

    if (trimmedQuery.length < 2) {
      return {
        valid: false,
        error: 'Query must be at least 2 characters long',
      };
    }

    if (trimmedQuery.length > 200) {
      return {
        valid: false,
        error: 'Query is too long (max 200 characters)',
      };
    }

    return {
      valid: true,
      query: trimmedQuery,
    };
  }
}

export default VoiceSearchService;
