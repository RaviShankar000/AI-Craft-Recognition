const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    craft: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Craft',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      validate: {
        validator: Number.isInteger,
        message: 'Quantity must be an integer',
      },
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative'],
    },
    name: {
      type: String,
      required: true,
    },
    image: {
      url: String,
      altText: String,
    },
  },
  {
    _id: false,
  }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    items: [cartItemSchema],
    totalItems: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastModified: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for total quantity of all items
cartSchema.virtual('totalQuantity').get(function () {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual to check if cart is empty
cartSchema.virtual('isEmpty').get(function () {
  return this.items.length === 0;
});

// Pre-save middleware to calculate totals
cartSchema.pre('save', function (next) {
  // Calculate total items
  this.totalItems = this.items.length;

  // Calculate total price
  this.totalPrice = this.items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);

  // Update lastModified timestamp
  this.lastModified = new Date();

  next();
});

// Method to add item to cart
cartSchema.methods.addItem = async function (productData) {
  const { product, craft, quantity, price, name, image } = productData;

  // Check if item already exists
  const existingItemIndex = this.items.findIndex(
    item => item.product.toString() === product.toString()
  );

  if (existingItemIndex > -1) {
    // Update quantity if item exists
    this.items[existingItemIndex].quantity += quantity;
  } else {
    // Add new item
    this.items.push({
      product,
      craft,
      quantity,
      price,
      name,
      image,
    });
  }

  return this.save();
};

// Method to update item quantity
cartSchema.methods.updateItemQuantity = async function (productId, quantity) {
  const itemIndex = this.items.findIndex(item => item.product.toString() === productId.toString());

  if (itemIndex === -1) {
    throw new Error('Item not found in cart');
  }

  if (quantity <= 0) {
    // Remove item if quantity is 0 or negative
    this.items.splice(itemIndex, 1);
  } else {
    this.items[itemIndex].quantity = quantity;
  }

  return this.save();
};

// Method to remove item from cart
cartSchema.methods.removeItem = async function (productId) {
  this.items = this.items.filter(item => item.product.toString() !== productId.toString());
  return this.save();
};

// Method to clear cart
cartSchema.methods.clearCart = async function () {
  this.items = [];
  return this.save();
};

// Method to get cart item by product ID
cartSchema.methods.getItem = function (productId) {
  return this.items.find(item => item.product.toString() === productId.toString());
};

// Static method to get or create cart for user
cartSchema.statics.getOrCreate = async function (userId) {
  let cart = await this.findOne({ user: userId }).populate({
    path: 'items.product',
    select: 'name price stock isAvailable discount',
  });

  if (!cart) {
    cart = await this.create({ user: userId, items: [] });
  }

  return cart;
};

// Static method to find cart by user
cartSchema.statics.findByUser = function (userId) {
  return this.findOne({ user: userId })
    .populate({
      path: 'items.product',
      select: 'name price stock isAvailable discount finalPrice',
    })
    .populate({
      path: 'items.craft',
      select: 'name state category',
    });
};

// Index for faster lookups
cartSchema.index({ user: 1 });
cartSchema.index({ lastModified: 1 });

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
