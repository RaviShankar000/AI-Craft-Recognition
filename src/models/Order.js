const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Order must belong to a user'],
      index: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: [true, 'Item must reference a product'],
        },
        craft: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Craft',
        },
        name: {
          type: String,
          required: [true, 'Item name is required'],
          trim: true,
        },
        price: {
          type: Number,
          required: [true, 'Item price is required'],
          min: [0, 'Price cannot be negative'],
        },
        quantity: {
          type: Number,
          required: [true, 'Item quantity is required'],
          min: [1, 'Quantity must be at least 1'],
          validate: {
            validator: Number.isInteger,
            message: 'Quantity must be an integer',
          },
        },
        image: {
          type: String,
        },
        subtotal: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    status: {
      type: String,
      required: [true, 'Order status is required'],
      enum: {
        values: [
          'pending',
          'confirmed',
          'processing',
          'shipped',
          'delivered',
          'cancelled',
          'refunded',
        ],
        message: 'Invalid order status',
      },
      default: 'pending',
      index: true,
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    shippingCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    shippingAddress: {
      fullName: {
        type: String,
        required: [true, 'Recipient name is required'],
        trim: true,
      },
      addressLine1: {
        type: String,
        required: [true, 'Address line 1 is required'],
        trim: true,
      },
      addressLine2: {
        type: String,
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
      postalCode: {
        type: String,
        required: [true, 'Postal code is required'],
        trim: true,
      },
      country: {
        type: String,
        required: [true, 'Country is required'],
        trim: true,
        default: 'India',
      },
      phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
      },
    },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: {
        values: ['credit_card', 'debit_card', 'upi', 'net_banking', 'cod', 'wallet'],
        message: 'Invalid payment method',
      },
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: {
        values: ['pending', 'completed', 'failed', 'refunded'],
        message: 'Invalid payment status',
      },
      default: 'pending',
      index: true,
    },
    paymentId: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    statusHistory: [
      {
        status: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        note: {
          type: String,
          trim: true,
        },
      },
    ],
    deliveredAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
orderSchema.index({ user: 1, status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ paymentStatus: 1 });

// Virtual for total items count
orderSchema.virtual('itemCount').get(function () {
  return this.items ? this.items.length : 0;
});

// Virtual for total quantity
orderSchema.virtual('totalQuantity').get(function () {
  return this.items ? this.items.reduce((total, item) => total + item.quantity, 0) : 0;
});

// Virtual to check if order can be cancelled
orderSchema.virtual('canBeCancelled').get(function () {
  return ['pending', 'confirmed'].includes(this.status);
});

// Virtual to check if order is completed
orderSchema.virtual('isCompleted').get(function () {
  return this.status === 'delivered';
});

// Pre-save middleware to generate order number
orderSchema.pre('save', async function (next) {
  if (this.isNew && !this.orderNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.orderNumber = `ORD-${timestamp}-${random}`;
  }
  next();
});

// Pre-save middleware to calculate subtotals
orderSchema.pre('save', function (next) {
  if (this.items && this.items.length > 0) {
    // Calculate subtotal for each item
    this.items.forEach(item => {
      item.subtotal = item.price * item.quantity;
    });

    // Calculate order subtotal
    this.subtotal = this.items.reduce((total, item) => total + item.subtotal, 0);

    // Calculate total amount
    this.totalAmount = this.subtotal + this.tax + this.shippingCost - this.discount;
  }
  next();
});

// Pre-save middleware to track status changes
orderSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
    });

    // Set delivered/cancelled timestamps
    if (this.status === 'delivered' && !this.deliveredAt) {
      this.deliveredAt = new Date();
    }
    if (this.status === 'cancelled' && !this.cancelledAt) {
      this.cancelledAt = new Date();
    }
  }
  next();
});

// Method to update order status
orderSchema.methods.updateStatus = function (newStatus, note) {
  this.status = newStatus;
  if (note) {
    this.statusHistory.push({
      status: newStatus,
      timestamp: new Date(),
      note,
    });
  }
  return this.save();
};

// Method to cancel order
orderSchema.methods.cancelOrder = function (reason) {
  if (!this.canBeCancelled) {
    throw new Error('Order cannot be cancelled at this stage');
  }
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.cancellationReason = reason;
  return this.save();
};

// Static method to find orders by status
orderSchema.statics.findByStatus = function (status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

// Static method to find user orders
orderSchema.statics.findUserOrders = function (userId) {
  return this.find({ user: userId }).sort({ createdAt: -1 });
};

// Static method to get order statistics
orderSchema.statics.getStatistics = async function (userId) {
  const stats = await this.aggregate([
    ...(userId ? [{ $match: { user: mongoose.Types.ObjectId(userId) } }] : []),
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
      },
    },
  ]);
  return stats;
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
