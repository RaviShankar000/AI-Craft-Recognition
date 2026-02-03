const cron = require('node-cron');
const logger = require('../config/logger');
const Analytics = require('../models/Analytics');

/**
 * Analytics Aggregation Service
 * Pre-computes daily analytics summaries for fast admin dashboard reports
 */

/**
 * Aggregate analytics for a specific date
 */
async function aggregateDailyAnalytics(date = new Date()) {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    logger.info(`Aggregating analytics for ${startOfDay.toISOString().split('T')[0]}`);

    // Aggregate event counts by type
    const eventStats = await Analytics.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay },
        },
      },
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: '$user' },
          totalAmount: { $sum: '$purchaseAmount' },
        },
      },
    ]);

    // Convert to object for easy access
    const eventMap = {};
    eventStats.forEach(stat => {
      eventMap[stat._id] = {
        count: stat.count,
        uniqueUsers: stat.uniqueUsers.filter(u => u).length,
        totalAmount: stat.totalAmount || 0,
      };
    });

    // Top products
    const topProducts = await Analytics.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay },
          eventType: 'product_view',
          product: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: '$product',
          views: { $sum: 1 },
        },
      },
      { $sort: { views: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      {
        $project: {
          productId: '$_id',
          views: 1,
          name: { $arrayElemAt: ['$productInfo.name', 0] },
        },
      },
    ]);

    // Top crafts
    const topCrafts = await Analytics.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay },
          eventType: 'craft_view',
          craft: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: '$craft',
          views: { $sum: 1 },
        },
      },
      { $sort: { views: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'crafts',
          localField: '_id',
          foreignField: '_id',
          as: 'craftInfo',
        },
      },
      {
        $project: {
          craftId: '$_id',
          views: 1,
          name: { $arrayElemAt: ['$craftInfo.name', 0] },
        },
      },
    ]);

    // Top searches
    const topSearches = await Analytics.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay },
          eventType: { $in: ['search', 'voice_search'] },
          searchQuery: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: '$searchQuery',
          count: { $sum: 1 },
          avgResults: { $avg: '$searchResults' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    // Total unique users
    const uniqueUsers = await Analytics.distinct('user', {
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      user: { $exists: true, $ne: null },
    });

    const summary = {
      date: startOfDay,
      totalEvents: eventStats.reduce((sum, stat) => sum + stat.count, 0),
      productViews: eventMap.product_view?.count || 0,
      craftViews: eventMap.craft_view?.count || 0,
      searches: (eventMap.search?.count || 0) + (eventMap.voice_search?.count || 0),
      voiceSearches: eventMap.voice_search?.count || 0,
      cartAdditions: eventMap.add_to_cart?.count || 0,
      cartRemovals: eventMap.remove_from_cart?.count || 0,
      checkouts: eventMap.checkout_start?.count || 0,
      checkoutCompletions: eventMap.checkout_complete?.count || 0,
      purchases: eventMap.purchase?.count || 0,
      purchaseAmount: eventMap.purchase?.totalAmount || 0,
      orderCancellations: eventMap.order_cancel?.count || 0,
      chatbotInteractions: eventMap.chatbot_interaction?.count || 0,
      uniqueUsers: uniqueUsers.length,
      topProducts,
      topCrafts,
      topSearches,
      generatedAt: new Date(),
    };

    logger.info('Daily analytics aggregation completed', {
      date: startOfDay.toISOString().split('T')[0],
      totalEvents: summary.totalEvents,
      uniqueUsers: summary.uniqueUsers,
      purchases: summary.purchases,
      revenue: summary.purchaseAmount,
    });

    return summary;
  } catch (error) {
    logger.error('Failed to aggregate daily analytics:', error);
    throw error;
  }
}

/**
 * Store aggregated summary (in-memory cache or separate collection)
 */
const dailySummaryCache = new Map();

async function storeDailySummary(summary) {
  const dateKey = summary.date.toISOString().split('T')[0];
  dailySummaryCache.set(dateKey, summary);

  // Optionally store in database for persistence
  // await DailySummaryModel.findOneAndUpdate(
  //   { date: summary.date },
  //   summary,
  //   { upsert: true }
  // );

  logger.info(`Stored daily summary for ${dateKey}`);
}

/**
 * Get daily summary from cache
 */
function getDailySummary(date) {
  const dateKey = new Date(date).toISOString().split('T')[0];
  return dailySummaryCache.get(dateKey);
}

/**
 * Run daily aggregation job
 */
async function runDailyAggregation() {
  try {
    // Aggregate yesterday's data
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const summary = await aggregateDailyAnalytics(yesterday);
    await storeDailySummary(summary);

    return summary;
  } catch (error) {
    logger.error('Daily aggregation job failed:', error);
    throw error;
  }
}

/**
 * Schedule analytics aggregation job
 * Runs daily at 1 AM (after midnight data collection)
 */
function scheduleAnalyticsAggregation() {
  const job = cron.schedule(
    '0 1 * * *',
    async () => {
      try {
        logger.info('Analytics aggregation job triggered by schedule');
        await runDailyAggregation();
      } catch (error) {
        logger.error('Scheduled analytics aggregation failed:', error);
      }
    },
    {
      scheduled: true,
      timezone: 'UTC',
    }
  );

  logger.info('Analytics aggregation job scheduled (daily at 1:00 AM UTC)');
  return job;
}

/**
 * Run aggregation immediately (for testing or manual trigger)
 */
async function runAggregationNow(date) {
  logger.info('Running analytics aggregation immediately...');
  const summary = await aggregateDailyAnalytics(date);
  await storeDailySummary(summary);
  return summary;
}

/**
 * Get weekly summary
 */
async function getWeeklySummary() {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  const summaries = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateKey = date.toISOString().split('T')[0];

    let summary = dailySummaryCache.get(dateKey);
    if (!summary) {
      // Generate on-demand if not cached
      summary = await aggregateDailyAnalytics(date);
      await storeDailySummary(summary);
    }
    summaries.push(summary);
  }

  return summaries;
}

module.exports = {
  scheduleAnalyticsAggregation,
  runAggregationNow,
  aggregateDailyAnalytics,
  getDailySummary,
  getWeeklySummary,
  dailySummaryCache,
};
