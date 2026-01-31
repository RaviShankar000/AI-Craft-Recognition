const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product');

/**
 * Calculate order totals
 * @param {Array} items - Cart items
 * @returns {Object} - Calculated totals
 */
const calculateOrderTotals = items => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Mock tax calculation (18% GST for India)
  const tax = subtotal * 0.18;

  // Mock shipping calculation
  let shippingCost = 0;
  if (subtotal < 500) {
    shippingCost = 50; // Flat shipping for orders below 500
  } else if (subtotal < 1000) {
    shippingCost = 30;
  }
  // Free shipping for orders above 1000

  const totalAmount = subtotal + tax + shippingCost;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    shippingCost: Math.round(shippingCost * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
  };
};

/**
 * Validate checkout data
 * @route POST /api/checkout/validate
 * @access Private
 */
const validateCheckout = async (req, res) => {
  try {
    // Get user's cart
    const cart = await Cart.findByUser(req.user._id);

    if (!cart || cart.isEmpty) {
      return res.status(400).json({
        success: false,
        error: 'Cart is empty',
      });
    }

    const issues = [];
    const validItems = [];

    // Validate each item in cart
    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);

      if (!product) {
        issues.push({
          productId: item.product._id,
          name: item.name,
          issue: 'Product no longer exists',
        });
        continue;
      }

      if (!product.isAvailable) {
        issues.push({
          productId: product._id,
          name: product.name,
          issue: 'Product is no longer available',
        });
        continue;
      }

      if (product.stock < item.quantity) {
        issues.push({
          productId: product._id,
          name: product.name,
          issue: `Only ${product.stock} items available`,
          availableStock: product.stock,
        });
        continue;
      }

      // Price change check
      if (product.finalPrice !== item.price) {
        issues.push({
          productId: product._id,
          name: product.name,
          issue: 'Price has changed',
          oldPrice: item.price,
          newPrice: product.finalPrice,
          type: 'price_change',
        });
      }

      validItems.push({
        product: product._id,
        craft: product.craft,
        name: product.name,
        price: product.finalPrice,
        quantity: item.quantity,
        image: product.image.url,
      });
    }

    // Calculate totals
    const totals = calculateOrderTotals(validItems);

    res.status(200).json({
      success: true,
      valid: issues.length === 0,
      data: {
        items: validItems,
        issues,
        ...totals,
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
 * Process mock checkout
 * @route POST /api/checkout
 * @access Private
 */
const processCheckout = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod, notes } = req.body;

    // Validate required fields
    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        error: 'Shipping address is required',
      });
    }

    const { fullName, addressLine1, city, state, postalCode, country, phone } = shippingAddress;

    if (!fullName || !addressLine1 || !city || !state || !postalCode || !phone) {
      return res.status(400).json({
        success: false,
        error: 'All shipping address fields are required',
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        error: 'Payment method is required',
      });
    }

    // Get user's cart
    const cart = await Cart.findByUser(req.user._id);

    if (!cart || cart.isEmpty) {
      return res.status(400).json({
        success: false,
        error: 'Cart is empty',
      });
    }

    // Validate stock and prepare order items
    const orderItems = [];
    const stockUpdates = [];

    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);

      if (!product) {
        return res.status(400).json({
          success: false,
          error: `Product ${item.name} no longer exists`,
        });
      }

      if (!product.isAvailable) {
        return res.status(400).json({
          success: false,
          error: `Product ${product.name} is no longer available`,
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for ${product.name}. Only ${product.stock} available`,
        });
      }

      // Prepare order item
      orderItems.push({
        product: product._id,
        craft: product.craft,
        name: product.name,
        price: product.finalPrice,
        quantity: item.quantity,
        image: product.image.url,
        subtotal: product.finalPrice * item.quantity,
      });

      // Track stock updates
      stockUpdates.push({
        product,
        quantity: item.quantity,
      });
    }

    // Calculate totals
    const totals = calculateOrderTotals(orderItems);

    // Create order
    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      status: 'pending',
      ...totals,
      shippingAddress: {
        fullName,
        addressLine1,
        addressLine2: shippingAddress.addressLine2 || '',
        city,
        state,
        postalCode,
        country: country || 'India',
        phone,
      },
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'completed',
      paymentId: `MOCK-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      notes: notes || '',
    });

    // Update product stock
    for (const { product, quantity } of stockUpdates) {
      await product.reduceStock(quantity);
    }

    // Clear cart
    await cart.clearCart();

    // Populate order details
    await order.populate([
      { path: 'items.product', select: 'name price stock' },
      { path: 'items.craft', select: 'name state category' },
    ]);

    // Mock payment confirmation for non-COD orders
    if (paymentMethod !== 'cod') {
      await order.updateStatus('confirmed', 'Payment received (Mock)');
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: {
        order: {
          orderNumber: order.orderNumber,
          _id: order._id,
          items: order.items,
          status: order.status,
          totalAmount: order.totalAmount,
          subtotal: order.subtotal,
          tax: order.tax,
          shippingCost: order.shippingCost,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          paymentId: order.paymentId,
          shippingAddress: order.shippingAddress,
          createdAt: order.createdAt,
        },
      },
    });
  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', '),
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get checkout summary
 * @route GET /api/checkout/summary
 * @access Private
 */
const getCheckoutSummary = async (req, res) => {
  try {
    // Get user's cart
    const cart = await Cart.findByUser(req.user._id);

    if (!cart || cart.isEmpty) {
      return res.status(400).json({
        success: false,
        error: 'Cart is empty',
      });
    }

    // Calculate totals
    const totals = calculateOrderTotals(cart.items);

    res.status(200).json({
      success: true,
      data: {
        items: cart.items.map(item => ({
          product: item.product._id,
          craft: item.craft?._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          subtotal: item.price * item.quantity,
        })),
        totalItems: cart.totalItems,
        totalQuantity: cart.totalQuantity,
        ...totals,
        shippingOptions: [
          {
            id: 'standard',
            name: 'Standard Delivery',
            description: '5-7 business days',
            cost: totals.shippingCost,
            selected: true,
          },
        ],
        paymentMethods: [
          { id: 'credit_card', name: 'Credit Card', enabled: true },
          { id: 'debit_card', name: 'Debit Card', enabled: true },
          { id: 'upi', name: 'UPI', enabled: true },
          { id: 'net_banking', name: 'Net Banking', enabled: true },
          { id: 'cod', name: 'Cash on Delivery', enabled: true },
          { id: 'wallet', name: 'Wallet', enabled: true },
        ],
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
 * Apply mock discount code
 * @route POST /api/checkout/apply-discount
 * @access Private
 */
const applyDiscount = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Discount code is required',
      });
    }

    // Get user's cart
    const cart = await Cart.findByUser(req.user._id);

    if (!cart || cart.isEmpty) {
      return res.status(400).json({
        success: false,
        error: 'Cart is empty',
      });
    }

    // Mock discount codes
    const mockDiscounts = {
      WELCOME10: { percentage: 10, description: 'Welcome discount - 10% off' },
      CRAFT20: { percentage: 20, description: 'Craft lovers discount - 20% off' },
      INDIA15: { percentage: 15, description: 'India special - 15% off' },
      FREESHIP: { percentage: 0, freeShipping: true, description: 'Free shipping' },
    };

    const discount = mockDiscounts[code.toUpperCase()];

    if (!discount) {
      return res.status(400).json({
        success: false,
        error: 'Invalid discount code',
      });
    }

    // Calculate totals
    const totals = calculateOrderTotals(cart.items);
    let discountAmount = 0;
    let finalShippingCost = totals.shippingCost;

    if (discount.freeShipping) {
      discountAmount = totals.shippingCost;
      finalShippingCost = 0;
    } else if (discount.percentage) {
      discountAmount = (totals.subtotal * discount.percentage) / 100;
    }

    const finalTotal = totals.subtotal + totals.tax + finalShippingCost - discountAmount;

    res.status(200).json({
      success: true,
      message: 'Discount applied successfully',
      data: {
        code: code.toUpperCase(),
        description: discount.description,
        discountAmount: Math.round(discountAmount * 100) / 100,
        subtotal: totals.subtotal,
        tax: totals.tax,
        shippingCost: finalShippingCost,
        originalTotal: totals.totalAmount,
        totalAmount: Math.round(finalTotal * 100) / 100,
        savings: Math.round(discountAmount * 100) / 100,
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
  validateCheckout,
  processCheckout,
  getCheckoutSummary,
  applyDiscount,
};
