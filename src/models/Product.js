const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a product name'],
      trim: true,
      maxlength: [150, 'Product name cannot be more than 150 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Please provide a product price'],
      min: [0, 'Price cannot be negative'],
      validate: {
        validator: function (value) {
          return value >= 0 && Number.isFinite(value);
        },
        message: 'Price must be a valid positive number',
      },
    },
    stock: {
      type: Number,
      required: [true, 'Please provide stock quantity'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Stock must be an integer value',
      },
    },
    craft: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Craft',
      required: [true, 'Product must be associated with a craft'],
      index: true,
    },
    image: {
      url: {
        type: String,
        required: [true, 'Please provide a product image URL'],
      },
      publicId: {
        type: String,
      },
      altText: {
        type: String,
        default: '',
      },
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot be more than 1000 characters'],
    },
    category: {
      type: String,
      trim: true,
      maxlength: [50, 'Category cannot be more than 50 characters'],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    moderationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    moderationNote: {
      type: String,
      trim: true,
      maxlength: [500, 'Moderation note cannot exceed 500 characters'],
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    moderatedAt: {
      type: Date,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    discount: {
      type: Number,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%'],
      default: 0,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Product must belong to a user'],
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
productSchema.index({ user: 1, isAvailable: 1 });
productSchema.index({ craft: 1, isAvailable: 1 });
productSchema.index({ price: 1 });
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ moderationStatus: 1 });
productSchema.index({ moderatedBy: 1 });

// Virtual for final price after discount
productSchema.virtual('finalPrice').get(function () {
  if (this.discount > 0) {
    return this.price - (this.price * this.discount) / 100;
  }
  return this.price;
});

// Virtual to check if product is in stock
productSchema.virtual('inStock').get(function () {
  return this.stock > 0;
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function () {
  if (this.stock === 0) {
    return 'out-of-stock';
  } else if (this.stock <= 10) {
    return 'low-stock';
  }
  return 'in-stock';
});

// Pre-save middleware to update availability based on stock
productSchema.pre('save', function (next) {
  if (this.stock === 0) {
    this.isAvailable = false;
  }
  next();
});

// Method to reduce stock
productSchema.methods.reduceStock = function (quantity) {
  if (this.stock < quantity) {
    throw new Error('Insufficient stock');
  }
  this.stock -= quantity;
  if (this.stock === 0) {
    this.isAvailable = false;
  }
  return this.save();
};

// Method to increase stock
productSchema.methods.increaseStock = function (quantity) {
  this.stock += quantity;
  if (this.stock > 0) {
    this.isAvailable = true;
  }
  return this.save();
};

// Static method to find available products
productSchema.statics.findAvailable = function () {
  return this.find({ isAvailable: true, stock: { $gt: 0 } });
};

// Method to update moderation status
productSchema.methods.updateModerationStatus = function (status, moderatorId, note = '') {
  this.moderationStatus = status;
  this.moderatedBy = moderatorId;
  this.moderatedAt = new Date();
  this.moderationNote = note;
  return this.save();
};

// Static method to find pending products for moderation
productSchema.statics.findPendingModeration = function () {
  return this.find({ moderationStatus: 'pending' }).sort({ createdAt: -1 });
};

// Indexes for performance optimization
productSchema.index({ name: 1 }); // Frequently queried by name
productSchema.index({ name: 'text', description: 'text' }); // Full-text search
productSchema.index({ price: 1 }); // Price range queries
productSchema.index({ category: 1, isAvailable: 1 }); // Category filtering
productSchema.index({ user: 1, moderationStatus: 1 }); // Seller's products by status
productSchema.index({ craft: 1, isAvailable: 1 }); // Products by craft
productSchema.index({ createdAt: -1 }); // Recent products
productSchema.index({ isAvailable: 1, stock: 1 }); // Available products
productSchema.index({ moderationStatus: 1, createdAt: -1 }); // Moderation queue

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
