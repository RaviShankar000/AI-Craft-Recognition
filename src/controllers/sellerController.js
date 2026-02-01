const SellerApplication = require('../models/SellerApplication');
const User = require('../models/User');

/**
 * Apply to become a seller
 * @route POST /api/seller/apply
 * @access Private
 */
const applyForSeller = async (req, res) => {
  try {
    const {
      businessName,
      businessDescription,
      contactPhone,
      businessAddress,
      taxId,
      websiteUrl,
    } = req.body;

    // Check if user already has a seller application
    const existingApplication = await SellerApplication.findOne({ user: req.user.id });

    if (existingApplication) {
      if (existingApplication.status === 'pending') {
        return res.status(400).json({
          success: false,
          error: 'You already have a pending seller application',
        });
      }
      if (existingApplication.status === 'approved') {
        return res.status(400).json({
          success: false,
          error: 'You are already a seller',
        });
      }
      // If rejected, allow reapplication
    }

    // Check if user is already a seller
    const user = await User.findById(req.user.id);
    if (user.role === 'seller' || user.role === 'admin') {
      return res.status(400).json({
        success: false,
        error: 'You already have seller privileges',
      });
    }

    // Validate required fields
    if (!businessName || !businessDescription || !contactPhone || !businessAddress) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required business information',
      });
    }

    // Validate address
    const { street, city, state, zipCode, country } = businessAddress;
    if (!street || !city || !state || !zipCode) {
      return res.status(400).json({
        success: false,
        error: 'Please provide complete business address',
      });
    }

    // Create or update application
    let application;
    if (existingApplication && existingApplication.status === 'rejected') {
      // Update rejected application
      existingApplication.businessName = businessName;
      existingApplication.businessDescription = businessDescription;
      existingApplication.contactPhone = contactPhone;
      existingApplication.businessAddress = { street, city, state, zipCode, country };
      existingApplication.taxId = taxId;
      existingApplication.websiteUrl = websiteUrl;
      existingApplication.status = 'pending';
      existingApplication.reviewNote = '';
      existingApplication.reviewedBy = undefined;
      existingApplication.reviewedAt = undefined;
      
      application = await existingApplication.save();
    } else {
      // Create new application
      application = await SellerApplication.create({
        user: req.user.id,
        businessName,
        businessDescription,
        contactPhone,
        businessAddress: { street, city, state, zipCode, country },
        taxId,
        websiteUrl,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Seller application submitted successfully. You will be notified once reviewed.',
      data: application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get current user's seller application status
 * @route GET /api/seller/application/status
 * @access Private
 */
const getApplicationStatus = async (req, res) => {
  try {
    const application = await SellerApplication.findOne({ user: req.user.id })
      .populate('reviewedBy', 'name email');

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'No seller application found',
      });
    }

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Cancel pending application
 * @route DELETE /api/seller/application
 * @access Private
 */
const cancelApplication = async (req, res) => {
  try {
    const application = await SellerApplication.findOne({
      user: req.user.id,
      status: 'pending',
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'No pending application found',
      });
    }

    await SellerApplication.deleteOne({ _id: application._id });

    res.status(200).json({
      success: true,
      message: 'Application cancelled successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * ============================================================================
 * ADMIN FUNCTIONS - Seller Application Management
 * ============================================================================
 */

/**
 * Get application statistics
 * @route GET /api/admin/seller-applications/stats
 * @access Private/Admin
 */
const getApplicationStats = async (req, res) => {
  try {
    const [pending, approved, rejected, total] = await Promise.all([
      SellerApplication.countDocuments({ status: 'pending' }),
      SellerApplication.countDocuments({ status: 'approved' }),
      SellerApplication.countDocuments({ status: 'rejected' }),
      SellerApplication.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        pending,
        approved,
        rejected,
        total,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get all pending seller applications
 * @route GET /api/admin/seller-applications/pending
 * @access Private/Admin
 */
const getPendingApplications = async (req, res) => {
  try {
    const applications = await SellerApplication.findPending();

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Approve seller application
 * @route PATCH /api/admin/seller-applications/:id/approve
 * @access Private/Admin
 */
const approveApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const application = await SellerApplication.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Seller application not found',
      });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `Application is already ${application.status}`,
      });
    }

    // Approve the application (this also updates user role to 'seller')
    await application.approve(req.user.id, note);

    res.status(200).json({
      success: true,
      message: 'Seller application approved successfully. User role updated to seller.',
      data: application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Reject seller application
 * @route PATCH /api/admin/seller-applications/:id/reject
 * @access Private/Admin
 */
const rejectApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!note) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a reason for rejection',
      });
    }

    const application = await SellerApplication.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Seller application not found',
      });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `Application is already ${application.status}`,
      });
    }

    // Reject the application
    await application.reject(req.user.id, note);

    res.status(200).json({
      success: true,
      message: 'Seller application rejected',
      data: application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  applyForSeller,
  getApplicationStatus,
  cancelApplication,
  getApplicationStats,
  getPendingApplications,
  approveApplication,
  rejectApplication,
};
