const mongoose = require('mongoose');

const sellerApplicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      unique: true,
      index: true,
    },
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
      maxlength: [100, 'Business name cannot exceed 100 characters'],
    },
    businessDescription: {
      type: String,
      required: [true, 'Business description is required'],
      trim: true,
      maxlength: [1000, 'Business description cannot exceed 1000 characters'],
    },
    contactPhone: {
      type: String,
      required: [true, 'Contact phone is required'],
      trim: true,
      match: [/^[0-9+\-\s()]+$/, 'Please provide a valid phone number'],
    },
    businessAddress: {
      street: {
        type: String,
        required: [true, 'Street address is required'],
        trim: true,
      },
      city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
      },
      state: {
        type: String,
        required: [true, 'State is required'],
        trim: true,
      },
      zipCode: {
        type: String,
        required: [true, 'Zip code is required'],
        trim: true,
      },
      country: {
        type: String,
        required: [true, 'Country is required'],
        trim: true,
        default: 'USA',
      },
    },
    taxId: {
      type: String,
      trim: true,
      sparse: true,
    },
    websiteUrl: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, 'Please provide a valid URL'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    reviewNote: {
      type: String,
      trim: true,
      maxlength: [500, 'Review note cannot exceed 500 characters'],
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
sellerApplicationSchema.index({ status: 1, createdAt: -1 });

// Method to approve application
sellerApplicationSchema.methods.approve = async function (adminId, note = '') {
  const User = require('./User');

  this.status = 'approved';
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  this.reviewNote = note;

  await this.save();

  // Update user role to seller
  await User.findByIdAndUpdate(this.user, { role: 'seller' });

  return this;
};

// Method to reject application
sellerApplicationSchema.methods.reject = async function (adminId, note) {
  this.status = 'rejected';
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  this.reviewNote = note;

  await this.save();

  return this;
};

// Static method to find pending applications
sellerApplicationSchema.statics.findPending = function () {
  return this.find({ status: 'pending' }).populate('user', 'name email').sort({ createdAt: -1 });
};

const SellerApplication = mongoose.model('SellerApplication', sellerApplicationSchema);

module.exports = SellerApplication;
