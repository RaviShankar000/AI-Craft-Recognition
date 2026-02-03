const Analytics = require('../models/Analytics');
const { getIO } = require('../config/socket');

/**
 * Analytics Service - Handle analytics aggregation and broadcasting
 */
class AnalyticsService {
  /**
   * Get live analytics stats and broadcast to admins
   * @returns {Promise<Object>} Live stats
   */
  static async getLiveStatsAndBroadcast() {
    try {
      const stats = await Analytics.getLiveStats();

      // Broadcast to all admin users
      try {
        const io = getIO();
        io.to('role:admin').emit('analytics:live_stats', stats);
        console.log('[ANALYTICS] Broadcasted live stats to admins');
      } catch (socketError) {
        console.error('[ANALYTICS] Failed to broadcast stats:', socketError.message);
      }

      return stats;
    } catch (error) {
      console.error('[ANALYTICS] Failed to get live stats:', error.message);
      throw error;
    }
  }

  /**
   * Broadcast updated stats after a new analytics event
   * This is called after craft views, searches, etc.
   */
  static async broadcastUpdatedStats() {
    try {
      await this.getLiveStatsAndBroadcast();
    } catch (error) {
      // Don't throw error, just log it
      console.error('[ANALYTICS] Failed to broadcast updated stats:', error.message);
    }
  }

  /**
   * Get analytics summary for a specific time range
   * @param {Object} filters - Filter options (startDate, endDate, userId, eventType)
   * @returns {Promise<Object>} Analytics summary
   */
  static async getAnalyticsSummary(filters = {}) {
    try {
      return await Analytics.getAnalyticsSummary(filters);
    } catch (error) {
      console.error('[ANALYTICS] Failed to get summary:', error.message);
      throw error;
    }
  }

  /**
   * Get popular searches
   * @param {Number} limit - Number of results to return
   * @returns {Promise<Array>} Popular searches
   */
  static async getPopularSearches(limit = 10) {
    try {
      return await Analytics.getPopularSearches(limit);
    } catch (error) {
      console.error('[ANALYTICS] Failed to get popular searches:', error.message);
      throw error;
    }
  }

  /**
   * Get conversion funnel data
   * @param {Object} filters - Filter options (startDate, endDate)
   * @returns {Promise<Object>} Conversion funnel
   */
  static async getConversionFunnel(filters = {}) {
    try {
      return await Analytics.getConversionFunnel(filters);
    } catch (error) {
      console.error('[ANALYTICS] Failed to get conversion funnel:', error.message);
      throw error;
    }
  }
}

module.exports = AnalyticsService;
