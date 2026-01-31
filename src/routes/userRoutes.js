const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

/**
 * PROTECTED ROUTES - USER ACCESS
 * Authentication required
 */

/**
 * Get current user profile
 * @route GET /api/users/me
 * @access Private
 */
router.get('/me', protect, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          isActive: req.user.isActive,
          createdAt: req.user.createdAt,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Update user profile
 * @route PUT /api/users/me
 * @access Private
 */
router.put('/me', protect, async (req, res) => {
  try {
    const { name, email, role, isActive } = req.body;

    // SECURITY: Prevent role escalation - users cannot modify their own role or active status
    if (role !== undefined || isActive !== undefined) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to modify role or account status. Contact an administrator.',
      });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    const user = await req.user.constructor.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PROTECTED ROUTES - ADMIN ONLY
 * Authentication + Admin role required
 */

/**
 * Get all users (Admin only)
 * @route GET /api/users
 * @access Private/Admin
 */
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const users = await req.user.constructor.find().select('-password');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
