const Order = require('../models/Order');

/**
 * Get all user orders
 * @route GET /api/orders
 * @access Private
 */
const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, sort = '-createdAt' } = req.query;

    // Build query
    const query = { user: req.user._id };

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const orders = await Order.find(query)
      .populate('items.product', 'name price')
      .populate('items.craft', 'name state')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get order by ID
 * @route GET /api/orders/:id
 * @access Private
 */
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    })
      .populate('items.product', 'name price stock')
      .populate('items.craft', 'name state category');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID',
      });
    }
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Track order by order number
 * @route GET /api/orders/track/:orderNumber
 * @access Private
 */
const trackOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      orderNumber: req.params.orderNumber,
      user: req.user._id,
    })
      .populate('items.product', 'name')
      .populate('items.craft', 'name state')
      .select('orderNumber status statusHistory totalAmount shippingAddress createdAt deliveredAt');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        itemCount: order.items.length,
        statusHistory: order.statusHistory,
        estimatedDelivery: order.deliveredAt || getEstimatedDelivery(order.createdAt),
        shippingAddress: order.shippingAddress,
        canBeCancelled: order.canBeCancelled,
        isCompleted: order.isCompleted,
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
 * Cancel order
 * @route POST /api/orders/:id/cancel
 * @access Private
 */
const cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
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

    await order.cancelOrder(reason);

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

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID',
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get order statistics
 * @route GET /api/orders/stats
 * @access Private
 */
const getOrderStats = async (req, res) => {
  try {
    const stats = await Order.getStatistics(req.user._id);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
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
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID',
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
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

    // Build query
    const query = {};

    if (status) {
      query.status = status;
    }

    if (user) {
      query.user = user;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('items.product', 'name price')
      .populate('items.craft', 'name state')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    const total = await Order.countDocuments(query);

    // Get order statistics
    const statusCounts = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      statistics: statusCounts,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
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
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID',
      });
    }
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Helper function to calculate estimated delivery
 */
const getEstimatedDelivery = createdAt => {
  const deliveryDate = new Date(createdAt);
  deliveryDate.setDate(deliveryDate.getDate() + 7); // 7 days from order
  return deliveryDate;
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
