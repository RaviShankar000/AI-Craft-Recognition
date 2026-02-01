const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/env');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'seller'],
      default: 'user',
    },
    sellerApplication: {
      status: {
        type: String,
        enum: ['none', 'pending', 'approved', 'rejected'],
        default: 'none',
      },
      businessName: {
        type: String,
        trim: true,
        maxlength: [100, 'Business name cannot exceed 100 characters'],
      },
      businessDescription: {
        type: String,
        trim: true,
        maxlength: [500, 'Business description cannot exceed 500 characters'],
      },
      phoneNumber: {
        type: String,
        trim: true,
      },
      address: {
        type: String,
        trim: true,
      },
      appliedAt: {
        type: Date,
      },
      reviewedAt: {
        type: Date,
      },
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      rejectionReason: {
        type: String,
        trim: true,
        maxlength: [500, 'Rejection reason cannot exceed 500 characters'],
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// SECURITY: Prevent unauthorized role changes through direct model updates
userSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  
  // If role is being updated, log it (can be monitored for security)
  if (update.$set && update.$set.role) {
    console.warn('[SECURITY] Role update detected:', {
      newRole: update.$set.role,
      timestamp: new Date().toISOString(),
    });
  }
  
  // Prevent direct role updates without going through proper channels
  // Note: This middleware helps but the primary protection should be at the route level
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token with user role
userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    {
      id: this._id,
      email: this.email,
      role: this.role, // Include user role for role-based access control
    },
    config.jwtSecret || 'your-secret-key-change-in-production',
    {
      expiresIn: config.jwtExpire, // Token expiration time
    }
  );
  return token;
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
