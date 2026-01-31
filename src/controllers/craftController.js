const Craft = require('../models/Craft');

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
      query.$text = { $search: search };
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

module.exports = {
  getAllCrafts,
  createCraft,
  getCraftById,
  updateCraft,
  deleteCraft,
};
