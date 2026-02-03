const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      required: [true, 'Event type is required'],
      enum: {
        values: [
          'product_view',
          'craft_view',
          'search',
          'voice_search',
          'add_to_cart',
          'remove_from_cart',
          'checkout_start',
          'checkout_complete',
          'purchase',
          'order_cancel',
          'chatbot_interaction',
        ],
        message: 'Invalid event type',
      },
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    sessionId: {
      type: String,
      index: true,
    },
    // Product-related events
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      index: true,
    },
    craft: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Craft',
      index: true,
    },
    // Search-related data
    searchQuery: {
      type: String,
      trim: true,
      maxlength: [200, 'Search query cannot exceed 200 characters'],
    },
    searchType: {
      type: String,
      enum: ['text', 'voice', 'image'],
    },
    searchResults: {
      type: Number,
      min: 0,
    },
    // Purchase-related data
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      index: true,
    },
    purchaseAmount: {
      type: Number,
      min: 0,
    },
    purchaseQuantity: {
      type: Number,
      min: 0,
    },
    // Cart-related data
    cartValue: {
      type: Number,
      min: 0,
    },
    cartItemCount: {
      type: Number,
      min: 0,
    },
    // Device and location data
    deviceType: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'unknown'],
      default: 'unknown',
    },
    browser: {
      type: String,
      trim: true,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    // Timing data
    pageLoadTime: {
      type: Number,
      min: 0,
    },
    timeSpent: {
      type: Number,
      min: 0,
    },
    // Additional metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    referrer: {
      type: String,
      trim: true,
    },
    // Success/failure tracking
    isSuccess: {
      type: Boolean,
      default: true,
    },
    errorMessage: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
analyticsSchema.index({ eventType: 1, createdAt: -1 });
analyticsSchema.index({ user: 1, eventType: 1, createdAt: -1 });
analyticsSchema.index({ product: 1, eventType: 1 });
analyticsSchema.index({ craft: 1, eventType: 1 });
analyticsSchema.index({ sessionId: 1, createdAt: -1 });
analyticsSchema.index({ createdAt: -1 });

// Static method to track product view
analyticsSchema.statics.trackProductView = async function (data) {
  return this.create({
    eventType: 'product_view',
    user: data.userId,
    sessionId: data.sessionId,
    product: data.productId,
    craft: data.craftId,
    deviceType: data.deviceType,
    browser: data.browser,
    ipAddress: data.ipAddress,
    timeSpent: data.timeSpent,
  });
};

// Static method to track craft view
analyticsSchema.statics.trackCraftView = async function (data) {
  return this.create({
    eventType: 'craft_view',
    user: data.userId,
    sessionId: data.sessionId,
    craft: data.craftId,
    deviceType: data.deviceType,
    browser: data.browser,
    ipAddress: data.ipAddress,
    timeSpent: data.timeSpent,
  });
};

// Static method to track search
analyticsSchema.statics.trackSearch = async function (data) {
  return this.create({
    eventType: data.searchType === 'voice' ? 'voice_search' : 'search',
    user: data.userId,
    sessionId: data.sessionId,
    searchQuery: data.query,
    searchType: data.searchType || 'text',
    searchResults: data.resultsCount,
    deviceType: data.deviceType,
    browser: data.browser,
    isSuccess: data.resultsCount > 0,
  });
};

// Static method to track cart action
analyticsSchema.statics.trackCartAction = async function (data) {
  return this.create({
    eventType: data.action === 'add' ? 'add_to_cart' : 'remove_from_cart',
    user: data.userId,
    sessionId: data.sessionId,
    product: data.productId,
    craft: data.craftId,
    cartValue: data.cartValue,
    cartItemCount: data.cartItemCount,
    deviceType: data.deviceType,
  });
};

// Static method to track purchase
analyticsSchema.statics.trackPurchase = async function (data) {
  return this.create({
    eventType: 'purchase',
    user: data.userId,
    sessionId: data.sessionId,
    order: data.orderId,
    purchaseAmount: data.amount,
    purchaseQuantity: data.quantity,
    deviceType: data.deviceType,
    browser: data.browser,
    country: data.country,
    city: data.city,
    isSuccess: data.isSuccess !== false,
  });
};

// Static method to track checkout
analyticsSchema.statics.trackCheckout = async function (data) {
  return this.create({
    eventType: data.step === 'start' ? 'checkout_start' : 'checkout_complete',
    user: data.userId,
    sessionId: data.sessionId,
    order: data.orderId,
    cartValue: data.cartValue,
    cartItemCount: data.cartItemCount,
    deviceType: data.deviceType,
    isSuccess: data.isSuccess !== false,
    errorMessage: data.errorMessage,
  });
};

// Static method to track chatbot interaction
analyticsSchema.statics.trackChatbot = async function (data) {
  return this.create({
    eventType: 'chatbot_interaction',
    user: data.userId,
    sessionId: data.sessionId,
    searchQuery: data.query,
    metadata: {
      intent: data.intent,
      response: data.response,
      isCached: data.isCached,
    },
    deviceType: data.deviceType,
  });
};

// Static method to get analytics summary
analyticsSchema.statics.getAnalyticsSummary = async function (filters = {}) {
  const { userId, startDate, endDate, eventType } = filters;

  const matchQuery = {};
  if (userId) matchQuery.user = mongoose.Types.ObjectId(userId);
  if (eventType) matchQuery.eventType = eventType;
  if (startDate || endDate) {
    matchQuery.createdAt = {};
    if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
    if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
  }

  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$eventType',
        count: { $sum: 1 },
        totalValue: { $sum: '$purchaseAmount' },
        avgTimeSpent: { $avg: '$timeSpent' },
      },
    },
    { $sort: { count: -1 } },
  ]);
};

// Static method to get popular products
analyticsSchema.statics.getPopularProducts = async function (limit = 10) {
  return this.aggregate([
    { $match: { eventType: 'product_view', product: { $exists: true } } },
    {
      $group: {
        _id: '$product',
        views: { $sum: 1 },
        uniqueUsers: { $addToSet: '$user' },
      },
    },
    {
      $project: {
        product: '$_id',
        views: 1,
        uniqueUserCount: { $size: '$uniqueUsers' },
      },
    },
    { $sort: { views: -1 } },
    { $limit: limit },
  ]);
};

// Static method to get popular searches
analyticsSchema.statics.getPopularSearches = async function (limit = 10) {
  return this.aggregate([
    {
      $match: {
        $or: [{ eventType: 'search' }, { eventType: 'voice_search' }],
        searchQuery: { $exists: true, $ne: '' },
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
    { $limit: limit },
  ]);
};

// Static method to get conversion funnel
analyticsSchema.statics.getConversionFunnel = async function (filters = {}) {
  const { startDate, endDate } = filters;

  const matchQuery = {};
  if (startDate || endDate) {
    matchQuery.createdAt = {};
    if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
    if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
  }

  const [views, cartAdds, checkouts, purchases] = await Promise.all([
    this.countDocuments({ ...matchQuery, eventType: 'product_view' }),
    this.countDocuments({ ...matchQuery, eventType: 'add_to_cart' }),
    this.countDocuments({ ...matchQuery, eventType: 'checkout_start' }),
    this.countDocuments({ ...matchQuery, eventType: 'purchase' }),
  ]);

  return {
    views,
    cartAdds,
    checkouts,
    purchases,
    viewToCart: views > 0 ? ((cartAdds / views) * 100).toFixed(2) : 0,
    cartToCheckout: cartAdds > 0 ? ((checkouts / cartAdds) * 100).toFixed(2) : 0,
    checkoutToPurchase: checkouts > 0 ? ((purchases / checkouts) * 100).toFixed(2) : 0,
    overallConversion: views > 0 ? ((purchases / views) * 100).toFixed(2) : 0,
  };
};

// Static method to get live analytics stats (last 24 hours)
analyticsSchema.statics.getLiveStats = async function () {
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    totalEvents,
    craftViews,
    searches,
    uniqueUsers,
    topSearches,
    recentActivity,
  ] = await Promise.all([
    // Total events in last 24h
    this.countDocuments({ createdAt: { $gte: last24Hours } }),
    
    // Craft views
    this.countDocuments({ 
      eventType: 'craft_view', 
      createdAt: { $gte: last24Hours } 
    }),
    
    // Searches (text + voice)
    this.countDocuments({ 
      eventType: 'search',
      createdAt: { $gte: last24Hours } 
    }),
    
    // Unique users
    this.distinct('user', { createdAt: { $gte: last24Hours } }).then(users => users.length),
    
    // Top 5 searches
    this.aggregate([
      {
        $match: {
          eventType: 'search',
          searchQuery: { $exists: true, $ne: '' },
          createdAt: { $gte: last24Hours }
        }
      },
      {
        $group: {
          _id: '$searchQuery',
          count: { $sum: 1 },
          searchType: { $first: '$searchType' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]),
    
    // Recent activity (last 10 events)
    this.find({ createdAt: { $gte: last24Hours } })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('eventType searchQuery craft product createdAt')
      .lean()
  ]);

  return {
    totalEvents,
    craftViews,
    searches,
    uniqueUsers,
    topSearches,
    recentActivity,
    timeRange: '24h',
    lastUpdated: new Date().toISOString(),
  };
};

// Indexes for performance optimization
analyticsSchema.index({ eventType: 1, createdAt: -1 }); // Events by type and date
analyticsSchema.index({ user: 1, eventType: 1 }); // User events by type
analyticsSchema.index({ sessionId: 1, createdAt: -1 }); // Session tracking
analyticsSchema.index({ product: 1, eventType: 1 }); // Product analytics
analyticsSchema.index({ craft: 1, eventType: 1 }); // Craft analytics
analyticsSchema.index({ order: 1 }); // Order analytics
analyticsSchema.index({ createdAt: -1 }); // Recent events
analyticsSchema.index({ searchQuery: 1, eventType: 1 }); // Search analytics
analyticsSchema.index({ eventType: 1, createdAt: 1 }, { expireAfterSeconds: 7776000 }); // TTL index: 90 days

const Analytics = mongoose.model('Analytics', analyticsSchema);

module.exports = Analytics;
