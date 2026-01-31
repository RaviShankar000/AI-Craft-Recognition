const Cart = require('../models/Cart');
const Product = require('../models/Product');

/**
 * Get user's cart
 * @route GET /api/cart
 * @access Private
 */
const getCart = async (req, res) => {
  try {
    const cart = await Cart.findByUser(req.user._id);

    if (!cart) {
      return res.status(200).json({
        success: true,
        data: {
          items: [],
          totalItems: 0,
          totalPrice: 0,
          totalQuantity: 0,
          isEmpty: true,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        items: cart.items,
        totalItems: cart.totalItems,
        totalPrice: cart.totalPrice,
        totalQuantity: cart.totalQuantity,
        isEmpty: cart.isEmpty,
        lastModified: cart.lastModified,
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
 * Add item to cart
 * @route POST /api/cart/items
 * @access Private
 */
const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    // Validate input
    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'Please provide product ID',
      });
    }

    if (quantity < 1 || !Number.isInteger(quantity)) {
      return res.status(400).json({
        success: false,
        error: 'Quantity must be a positive integer',
      });
    }

    // Find product
    const product = await Product.findById(productId).populate('craft', 'name state category');

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    // Check if product is available
    if (!product.isAvailable) {
      return res.status(400).json({
        success: false,
        error: 'Product is not available',
      });
    }

    // Check stock availability
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        error: `Only ${product.stock} items available in stock`,
      });
    }

    // Get or create cart
    let cart = await Cart.getOrCreate(req.user._id);

    // Check if adding this quantity exceeds stock
    const existingItem = cart.getItem(productId);
    const totalQuantity = existingItem ? existingItem.quantity + quantity : quantity;

    if (totalQuantity > product.stock) {
      return res.status(400).json({
        success: false,
        error: `Cannot add ${quantity} items. Only ${product.stock - (existingItem?.quantity || 0)} more available`,
      });
    }

    // Add item to cart
    await cart.addItem({
      product: product._id,
      craft: product.craft._id,
      quantity,
      price: product.finalPrice,
      name: product.name,
      image: product.image,
    });

    // Reload cart with populated data
    cart = await Cart.findByUser(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Item added to cart successfully',
      data: {
        items: cart.items,
        totalItems: cart.totalItems,
        totalPrice: cart.totalPrice,
        totalQuantity: cart.totalQuantity,
      },
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID',
      });
    }
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Update cart item quantity
 * @route PUT /api/cart/items/:productId
 * @access Private
 */
const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    // Validate input
    if (quantity === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Please provide quantity',
      });
    }

    if (quantity < 0 || !Number.isInteger(quantity)) {
      return res.status(400).json({
        success: false,
        error: 'Quantity must be a non-negative integer',
      });
    }

    // Get cart
    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found',
      });
    }

    // If quantity is 0, remove the item
    if (quantity === 0) {
      await cart.removeItem(productId);
      cart = await Cart.findByUser(req.user._id);

      return res.status(200).json({
        success: true,
        message: 'Item removed from cart',
        data: {
          items: cart?.items || [],
          totalItems: cart?.totalItems || 0,
          totalPrice: cart?.totalPrice || 0,
          totalQuantity: cart?.totalQuantity || 0,
        },
      });
    }

    // Check if product exists and has sufficient stock
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    if (quantity > product.stock) {
      return res.status(400).json({
        success: false,
        error: `Only ${product.stock} items available in stock`,
      });
    }

    // Update item quantity
    await cart.updateItemQuantity(productId, quantity);

    // Reload cart with populated data
    cart = await Cart.findByUser(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Cart item updated successfully',
      data: {
        items: cart?.items || [],
        totalItems: cart?.totalItems || 0,
        totalPrice: cart?.totalPrice || 0,
        totalQuantity: cart?.totalQuantity || 0,
      },
    });
  } catch (error) {
    if (error.message === 'Item not found in cart') {
      return res.status(404).json({
        success: false,
        error: 'Item not found in cart',
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID',
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Remove item from cart
 * @route DELETE /api/cart/items/:productId
 * @access Private
 */
const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    // Get cart
    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found',
      });
    }

    // Check if item exists in cart
    const item = cart.getItem(productId);
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item not found in cart',
      });
    }

    // Remove item
    await cart.removeItem(productId);

    // Reload cart with populated data
    cart = await Cart.findByUser(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Item removed from cart successfully',
      data: {
        items: cart?.items || [],
        totalItems: cart?.totalItems || 0,
        totalPrice: cart?.totalPrice || 0,
        totalQuantity: cart?.totalQuantity || 0,
      },
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID',
      });
    }
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Clear cart
 * @route DELETE /api/cart
 * @access Private
 */
const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(200).json({
        success: true,
        message: 'Cart is already empty',
        data: {
          items: [],
          totalItems: 0,
          totalPrice: 0,
          totalQuantity: 0,
        },
      });
    }

    await cart.clearCart();

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      data: {
        items: [],
        totalItems: 0,
        totalPrice: 0,
        totalQuantity: 0,
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
 * Sync cart with latest product data
 * @route POST /api/cart/sync
 * @access Private
 */
const syncCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart || cart.items.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Cart is empty',
        data: {
          items: [],
          totalItems: 0,
          totalPrice: 0,
          totalQuantity: 0,
          removedItems: [],
          updatedItems: [],
        },
      });
    }

    const removedItems = [];
    const updatedItems = [];

    // Check each item in cart
    for (let i = cart.items.length - 1; i >= 0; i--) {
      const item = cart.items[i];
      const product = await Product.findById(item.product);

      // Remove item if product no longer exists or is unavailable
      if (!product || !product.isAvailable) {
        removedItems.push({
          name: item.name,
          reason: !product ? 'Product no longer available' : 'Product is unavailable',
        });
        cart.items.splice(i, 1);
        continue;
      }

      // Update price if changed
      if (product.finalPrice !== item.price) {
        updatedItems.push({
          name: item.name,
          oldPrice: item.price,
          newPrice: product.finalPrice,
        });
        item.price = product.finalPrice;
      }

      // Adjust quantity if exceeds stock
      if (item.quantity > product.stock) {
        if (product.stock === 0) {
          removedItems.push({
            name: item.name,
            reason: 'Out of stock',
          });
          cart.items.splice(i, 1);
        } else {
          updatedItems.push({
            name: item.name,
            oldQuantity: item.quantity,
            newQuantity: product.stock,
          });
          item.quantity = product.stock;
        }
      }
    }

    await cart.save();

    // Reload cart with populated data
    const updatedCart = await Cart.findByUser(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Cart synced successfully',
      data: {
        items: updatedCart?.items || [],
        totalItems: updatedCart?.totalItems || 0,
        totalPrice: updatedCart?.totalPrice || 0,
        totalQuantity: updatedCart?.totalQuantity || 0,
        removedItems,
        updatedItems,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  syncCart,
};
