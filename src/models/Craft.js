const mongoose = require('mongoose');

const craftSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a craft name'],
      trim: true,
      maxlength: [100, 'Craft name cannot be more than 100 characters'],
    },
    state: {
      type: String,
      required: [true, 'Please provide a craft state'],
      enum: {
        values: ['draft', 'published', 'archived'],
        message: 'State must be either draft, published, or archived',
      },
      default: 'draft',
    },
    description: {
      type: String,
      required: [true, 'Please provide a craft description'],
      maxlength: [2000, 'Description cannot be more than 2000 characters'],
    },
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
        },
        altText: {
          type: String,
          default: '',
        },
      },
    ],
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Craft must belong to a user'],
    },
    category: {
      type: String,
      trim: true,
      maxlength: [50, 'Category cannot be more than 50 characters'],
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    aiAnalysis: {
      recognized: {
        type: Boolean,
        default: false,
      },
      confidence: {
        type: Number,
        min: 0,
        max: 100,
      },
      results: {
        type: mongoose.Schema.Types.Mixed,
      },
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
craftSchema.index({ user: 1, state: 1 });
craftSchema.index({ state: 1, createdAt: -1 });
craftSchema.index({ name: 'text', description: 'text' });

// Virtual for image count
craftSchema.virtual('imageCount').get(function () {
  return this.images ? this.images.length : 0;
});

const Craft = mongoose.model('Craft', craftSchema);

module.exports = Craft;
