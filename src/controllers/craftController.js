const Craft = require('../models/Craft');
const Analytics = require('../models/Analytics');
const { sanitizeTranscript } = require('../utils/sanitizer');

/**
 * Get all crafts
 * @route GET /api/crafts
 * @access Private
 */
const getAllCrafts = async (req, res) => {
  try {
    const { state, category, search, page = 1, limit = 10 } = req.query;

    // Build query
    const query = { user: req.user._id };

    if (state) {
      query.state = state;
    }

    if (category) {
      query.category = category;
    }

    if (search) {
      // Sanitize search input for voice queries
      const sanitizedSearch = sanitizeTranscript(search, {
        maxLength: 200,
        removeScripts: true,
        normalizeWhitespace: true,
      });

      if (sanitizedSearch) {
        query.$text = { $search: sanitizedSearch };
      }
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const crafts = await Craft.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    // Get total count
    const total = await Craft.countDocuments(query);

    // Track search if query was provided
    if (search) {
      try {
        await Analytics.trackSearch({
          userId: req.user._id,
          sessionId: req.headers['x-session-id'],
          query: search,
          searchType: 'text',
          resultsCount: crafts.length,
          deviceType: getDeviceType(req.headers['user-agent']),
          browser: getBrowser(req.headers['user-agent']),
        });
      } catch (analyticsError) {
        console.error('Analytics tracking failed:', analyticsError.message);
      }
    }

    res.status(200).json({
      success: true,
      count: crafts.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: crafts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Create a new craft
 * @route POST /api/crafts
 * @access Private
 */
const createCraft = async (req, res) => {
  try {
    const { name, state, description, images, category, tags, isPublic } = req.body;

    // Validate required fields
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name and description',
      });
    }

    // Create craft
    const craft = await Craft.create({
      name,
      state: state || 'draft',
      description,
      images: images || [],
      category,
      tags: tags || [],
      isPublic: isPublic !== undefined ? isPublic : true,
      user: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Craft created successfully',
      data: craft,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get craft by ID
 * @route GET /api/crafts/:id
 * @access Private
 */
const getCraftById = async (req, res) => {
  try {
    const { id } = req.params;

    const craft = await Craft.findById(id).populate('user', 'name email').select('-__v');

    if (!craft) {
      return res.status(404).json({
        success: false,
        error: 'Craft not found',
      });
    }

    // Check if user owns the craft or if craft is public
    if (craft.user._id.toString() !== req.user._id.toString() && !craft.isPublic) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this craft',
      });
    }

    // Increment view count if not owner
    if (craft.user._id.toString() !== req.user._id.toString()) {
      craft.viewCount += 1;
      await craft.save();

      // Track craft view in analytics
      try {
        await Analytics.trackCraftView({
          userId: req.user._id,
          sessionId: req.headers['x-session-id'],
          craftId: craft._id,
          deviceType: getDeviceType(req.headers['user-agent']),
          browser: getBrowser(req.headers['user-agent']),
          ipAddress: req.ip || req.connection.remoteAddress,
        });
      } catch (analyticsError) {
        // Don't fail the request if analytics fails
        console.error('Analytics tracking failed:', analyticsError.message);
      }
    }

    res.status(200).json({
      success: true,
      data: craft,
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        error: 'Craft not found',
      });
    }
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Update craft
 * @route PUT /api/crafts/:id
 * @access Private
 */
const updateCraft = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, state, description, images, category, tags, isPublic, aiAnalysis } = req.body;

    // Find craft
    let craft = await Craft.findById(id);

    if (!craft) {
      return res.status(404).json({
        success: false,
        error: 'Craft not found',
      });
    }

    // Check ownership
    if (craft.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this craft',
      });
    }

    // Update fields
    const updateData = {};
    if (name) updateData.name = name;
    if (state) updateData.state = state;
    if (description) updateData.description = description;
    if (images) updateData.images = images;
    if (category) updateData.category = category;
    if (tags) updateData.tags = tags;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (aiAnalysis) updateData.aiAnalysis = aiAnalysis;

    craft = await Craft.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Craft updated successfully',
      data: craft,
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        error: 'Craft not found',
      });
    }
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Delete craft
 * @route DELETE /api/crafts/:id
 * @access Private
 */
const deleteCraft = async (req, res) => {
  try {
    const { id } = req.params;

    const craft = await Craft.findById(id);

    if (!craft) {
      return res.status(404).json({
        success: false,
        error: 'Craft not found',
      });
    }

    // Check ownership
    if (craft.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this craft',
      });
    }

    await craft.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Craft deleted successfully',
      data: {},
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        error: 'Craft not found',
      });
    }
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Voice search for crafts
 * @route GET /api/crafts/voice-search
 * @access Private
 */
const voiceSearchCrafts = async (req, res) => {
  try {
    const { query, state, category, page = 1, limit = 20 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
      });
    }

    // Sanitize voice search query
    const sanitizedQuery = sanitizeTranscript(query, {
      maxLength: 200,
      removeScripts: true,
      normalizeWhitespace: true,
      removeUrls: false,
    });

    if (!sanitizedQuery || sanitizedQuery.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Invalid search query',
      });
    }

    // Build search query
    const searchQuery = {
      user: req.user._id,
      $text: { $search: sanitizedQuery },
    };

    if (state) {
      searchQuery.state = state;
    }

    if (category) {
      searchQuery.category = category;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute search with text score
    const crafts = await Craft.find(searchQuery, {
      score: { $meta: 'textScore' },
    })
      .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    // Get total count
    const total = await Craft.countDocuments(searchQuery);

    // Track voice search in analytics
    try {
      await Analytics.trackSearch({
        userId: req.user._id,
        sessionId: req.headers['x-session-id'],
        query: sanitizedQuery,
        searchType: 'voice',
        resultsCount: crafts.length,
        deviceType: getDeviceType(req.headers['user-agent']),
        browser: getBrowser(req.headers['user-agent']),
      });
    } catch (analyticsError) {
      console.error('Analytics tracking failed:', analyticsError.message);
    }

    res.status(200).json({
      success: true,
      count: crafts.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      query: sanitizedQuery,
      data: crafts,
    });
  } catch (error) {
    console.error('Voice search error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get popular crafts based on views
 * @route GET /api/crafts/popular
 * @access Private
 */
const getPopularCrafts = async (req, res) => {
  try {
    const { limit = 10, days = 30 } = req.query;

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get popular crafts from analytics
    const popularCrafts = await Analytics.aggregate([
      {
        $match: {
          eventType: 'craft_view',
          craft: { $exists: true },
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$craft',
          views: { $sum: 1 },
          uniqueUsers: { $addToSet: '$user' },
        },
      },
      {
        $project: {
          craft: '$_id',
          views: 1,
          uniqueUserCount: { $size: '$uniqueUsers' },
        },
      },
      { $sort: { views: -1 } },
      { $limit: parseInt(limit) },
    ]);

    // Populate craft details
    const craftIds = popularCrafts.map(item => item.craft);
    const crafts = await Craft.find({ _id: { $in: craftIds } })
      .populate('user', 'name')
      .select('-__v');

    // Merge analytics data with craft details
    const craftsMap = new Map(crafts.map(craft => [craft._id.toString(), craft]));
    const result = popularCrafts
      .map(item => {
        const craft = craftsMap.get(item.craft.toString());
        if (!craft) return null;
        return {
          ...craft.toObject(),
          analytics: {
            views: item.views,
            uniqueUsers: item.uniqueUserCount,
          },
        };
      })
      .filter(item => item !== null);

    res.status(200).json({
      success: true,
      count: result.length,
      period: `Last ${days} days`,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Helper: Get device type from user agent
 */
const getDeviceType = userAgent => {
  if (!userAgent) return 'unknown';
  const ua = userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobile))/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
  return 'desktop';
};

/**
 * Helper: Get browser from user agent
 */
const getBrowser = userAgent => {
  if (!userAgent) return 'unknown';
  const ua = userAgent.toLowerCase();
  if (ua.includes('firefox')) return 'Firefox';
  if (ua.includes('chrome') && !ua.includes('edge')) return 'Chrome';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
  if (ua.includes('edge')) return 'Edge';
  if (ua.includes('opera') || ua.includes('opr')) return 'Opera';
  return 'Other';
};

module.exports = {
  getAllCrafts,
  createCraft,
  getCraftById,
  updateCraft,
  deleteCraft,
  voiceSearchCrafts,
  getPopularCrafts,
};
