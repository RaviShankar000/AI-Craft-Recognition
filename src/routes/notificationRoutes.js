const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Product = require('../models/Product');
const SellerApplication = require('../models/SellerApplication');

/**
 * @route   GET /api/notifications/updates
 * @desc    Get notification updates since a timestamp (polling fallback)
 * @access  Private
 */
router.get('/updates', protect, async (req, res) => {
  try {
    const { since } = req.query;
    const userId = req.user._id;

    if (!since) {
      return res.status(400).json({
        success: false,
        message: 'Missing "since" query parameter',
      });
    }

    const sinceDate = new Date(since);
    const updates = [];

    // Check for product moderation updates
    const products = await Product.find({
      user: userId,
      updatedAt: { $gt: sinceDate },
      moderationStatus: { $in: ['approved', 'rejected'] },
    }).select('_id name moderationStatus moderationNote updatedAt');

    products.forEach((product) => {
      const isApproved = product.moderationStatus === 'approved';
      updates.push({
        type: isApproved ? 'product_approved' : 'product_rejected',
        title: isApproved ? '✅ Product Approved' : '❌ Product Rejected',
        message: isApproved
          ? `Your product "${product.name}" has been approved and is now live!`
          : `Your product "${product.name}" was rejected. ${product.moderationNote || ''}`,
        data: {
          productId: product._id,
          productName: product.name,
          status: product.moderationStatus,
          note: product.moderationNote,
        },
        timestamp: product.updatedAt,
        priority: isApproved ? 'normal' : 'high',
      });
    });

    // Check for seller application updates
    const sellerApp = await SellerApplication.findOne({
      user: userId,
      updatedAt: { $gt: sinceDate },
      status: { $in: ['approved', 'rejected'] },
    }).select('_id status moderationNote updatedAt');

    if (sellerApp) {
      const isApproved = sellerApp.status === 'approved';
      updates.push({
        type: isApproved ? 'seller_approved' : 'seller_rejected',
        title: isApproved ? '🎉 Seller Application Approved' : '❌ Seller Application Rejected',
        message: isApproved
          ? 'Congratulations! You can now start selling products.'
          : `Your seller application was rejected. ${sellerApp.moderationNote || ''}`,
        data: {
          applicationId: sellerApp._id,
          status: sellerApp.status,
          note: sellerApp.moderationNote,
        },
        timestamp: sellerApp.updatedAt,
        priority: 'high',
      });
    }

    // Sort by timestamp (newest first)
    updates.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      count: updates.length,
      updates,
    });
  } catch (error) {
    console.error('[POLLING] Error fetching updates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch updates',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/notifications/health
 * @desc    Check notification system health
 * @access  Private
 */
router.get('/health', protect, (req, res) => {
  res.json({
    success: true,
    message: 'Notification system is healthy',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
