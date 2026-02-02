const Order = require('../models/Order');

/**
 * Helper: Handle database errors
 */
const handleDbError = (error, res) => {
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID format',
    });
  }

  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({
      success: false,
      error: messages.join(', '),
    });
  }

  return res.status(500).json({
    success: false,
    error: error.message,
  });
};

/**
 * Helper: Calculate estimated delivery date
 */
const getEstimatedDelivery = (createdAt, daysToAdd = 7) => {
  const deliveryDate = new Date(createdAt);
  deliveryDate.setDate(deliveryDate.getDate() + daysToAdd);
  return deliveryDate;
};

/**
 * Helper: Build pagination data
 */
const buildPaginationData = (page, limit, total, data) => ({
  success: true,
  count: data.length,
  total,
  page: parseInt(page),
  pages: Math.ceil(total / parseInt(limit)),
  data,
});

/**
 * Helper: Common order population
 */
const populateOrderDetails = query => {
  return query
    .populate('items.product', 'name price stock')
    .populate('items.craft', 'name state category');
};

/**
 * Get all user orders
 * @route GET /api/orders
 * @access Private (Role-based filtering)
 * @description
 * - Regular users: Their own orders
 * - Sellers: Orders containing their products
 * - Admins: Handled by separate admin route
 */
const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, sort = '-createdAt' } = req.query;

    let query = {};
    
    // Role-based filtering
    if (req.user.role === 'seller') {
      // Sellers: Find orders containing their products
      const Product = require('../models/Product');
      const sellerProducts = await Product.find({ user: req.user._id }).select('_id');
      const productIds = sellerProducts.map(p => p._id);
      
      query['items.product'] = { $in: productIds };
    } else {
      // Regular users: Only their own orders
      query.user = req.user._id;
    }
    
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      populateOrderDetails(
        Order.find(query).sort(sort).skip(skip).limit(parseInt(limit)).select('-__v')
      ),
      Order.countDocuments(query),
    ]);

    // For sellers, filter order items to show only their products
    let filteredOrders = orders;
    if (req.user.role === 'seller') {
      const Product = require('../models/Product');
      const sellerProducts = await Product.find({ user: req.user._id }).select('_id');
      const productIds = sellerProducts.map(p => p._id.toString());
      
      filteredOrders = orders.map(order => {
        const orderObj = order.toObject();
        orderObj.items = orderObj.items.filter(item => 
          item.product && productIds.includes(item.product._id.toString())
        );
        // Recalculate total for seller's items only
        orderObj.sellerTotal = orderObj.items.reduce((sum, item) => 
          sum + (item.price * item.quantity), 0
        );
        return orderObj;
      });
    }

    res.status(200).json(buildPaginationData(page, limit, total, filteredOrders));
  } catch (error) {
    handleDbError(error, res);
  }
};

/**
 * Get order by ID
 * @route GET /api/orders/:id
 * @access Private (Role-based filtering)
 * @description
 * - Regular users: Only their own orders
 * - Sellers: Orders containing their products (filtered to show only their items)
 */
const getOrderById = async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    // Role-based filtering
    if (req.user.role === 'seller') {
      // Sellers: Find orders containing their products
      const Product = require('../models/Product');
      const sellerProducts = await Product.find({ user: req.user._id }).select('_id');
      const productIds = sellerProducts.map(p => p._id);
      
      query['items.product'] = { $in: productIds };
    } else {
      // Regular users: Only their own orders
      query.user = req.user._id;
    }
    
    const order = await populateOrderDetails(Order.findOne(query));

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    // For sellers, filter to show only their items
    let responseData = order;
    if (req.user.role === 'seller') {
      const Product = require('../models/Product');
      const sellerProducts = await Product.find({ user: req.user._id }).select('_id');
      const productIds = sellerProducts.map(p => p._id.toString());
      
      const orderObj = order.toObject();
      orderObj.items = orderObj.items.filter(item => 
        item.product && productIds.includes(item.product._id.toString())
      );
      orderObj.sellerTotal = orderObj.items.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
      );
      responseData = orderObj;
    }

    res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    handleDbError(error, res);
  }
};

/**
 * Track order by order number
 * @route GET /api/orders/track/:orderNumber
 * @access Private (Role-based filtering)
 * @description
 * - Regular users: Only their own orders
 * - Sellers: Orders containing their products
 */
const trackOrder = async (req, res) => {
  try {
    let query = { orderNumber: req.params.orderNumber };
    
    // Role-based filtering
    if (req.user.role === 'seller') {
      // Sellers: Find orders containing their products
      const Product = require('../models/Product');
      const sellerProducts = await Product.find({ user: req.user._id }).select('_id');
      const productIds = sellerProducts.map(p => p._id);
      
      query['items.product'] = { $in: productIds };
    } else {
      // Regular users: Only their own orders
      query.user = req.user._id;
    }
    
    const order = await Order.findOne(query)
      .populate('items.product', 'name')
      .populate('items.craft', 'name state')
      .select('orderNumber status statusHistory totalAmount shippingAddress createdAt deliveredAt items');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    // For sellers, filter items to show only their products
    let itemCount = order.items.length;
    if (req.user.role === 'seller') {
      const Product = require('../models/Product');
      const sellerProducts = await Product.find({ user: req.user._id }).select('_id');
      const productIds = sellerProducts.map(p => p._id.toString());
      
      const filteredItems = order.items.filter(item => 
        item.product && productIds.includes(item.product._id.toString())
      );
      itemCount = filteredItems.length;
    }

    res.status(200).json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        itemCount,
        statusHistory: order.statusHistory,
        estimatedDelivery: order.deliveredAt || getEstimatedDelivery(order.createdAt),
        shippingAddress: order.shippingAddress,
        canBeCancelled: order.canBeCancelled,
        isCompleted: order.isCompleted,
      },
    });
  } catch (error) {
    handleDbError(error, res);
  }
};

/**
 * Cancel order
 * @route POST /api/orders/:id/cancel
 * @access Private
 */
const cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Cancellation reason is required',
      });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    await order.cancelOrder(reason.trim());

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: {
        orderNumber: order.orderNumber,
        status: order.status,
        cancelledAt: order.cancelledAt,
        cancellationReason: order.cancellationReason,
      },
    });
  } catch (error) {
    if (error.message.includes('cannot be cancelled')) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
    handleDbError(error, res);
  }
};

/**
 * Get order statistics (Platform-wide analytics)
 * @route GET /api/orders/stats
 * @access Private/Admin
 * @description Returns platform-wide order statistics and analytics for admin users
 */
const getOrderStats = async (req, res) => {
  try {
    // Admin users get platform-wide statistics (no userId filter)
    const stats = await Order.getStatistics();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    handleDbError(error, res);
  }
};

/**
 * Update order status (Admin only)
 * @route PATCH /api/orders/:id/status
 * @access Private/Admin
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required',
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    await order.updateStatus(status, note);

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: {
        orderNumber: order.orderNumber,
        status: order.status,
        statusHistory: order.statusHistory,
      },
    });
  } catch (error) {
    handleDbError(error, res);
  }
};

/**
 * Get all orders (Admin only)
 * @route GET /api/orders/admin/all
 * @access Private/Admin
 */
const getAllOrdersAdmin = async (req, res) => {
  try {
    const { status, user, page = 1, limit = 20, sort = '-createdAt' } = req.query;

    const query = {};
    if (status) query.status = status;
    if (user) query.user = user;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total, statusCounts] = await Promise.all([
      Order.find(query)
        .populate('user', 'name email')
        .populate('items.product', 'name price')
        .populate('items.craft', 'name state')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-__v'),
      Order.countDocuments(query),
      Order.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$totalAmount' },
          },
        },
      ]),
    ]);

    res.status(200).json({
      ...buildPaginationData(page, limit, total, orders),
      statistics: statusCounts,
    });
  } catch (error) {
    handleDbError(error, res);
  }
};

/**
 * Delete order (Admin only)
 * @route DELETE /api/orders/:id
 * @access Private/Admin
 */
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    await order.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Order deleted successfully',
      data: {},
    });
  } catch (error) {
    handleDbError(error, res);
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  trackOrder,
  cancelOrder,
  getOrderStats,
  updateOrderStatus,
  getAllOrdersAdmin,
  deleteOrder,
};
