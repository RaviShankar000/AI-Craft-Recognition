import { useState } from 'react';
import './OrderHistory.css';

const OrderHistory = () => {
  // Mock order data - will be replaced with API call
  const [orders] = useState([
    {
      id: 'ORD-2026-001',
      date: '2026-01-28',
      status: 'delivered',
      items: [
        {
          id: 1,
          name: 'Handwoven Pashmina Shawl',
          craftType: 'Textile',
          price: 4500,
          quantity: 1,
          image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400',
        },
        {
          id: 2,
          name: 'Madhubani Painting',
          craftType: 'Painting',
          price: 2800,
          quantity: 1,
          image: 'https://images.unsplash.com/photo-1578301978018-3005759f48f7?w=400',
        },
      ],
      subtotal: 7300,
      shipping: 0,
      total: 7300,
      deliveryAddress: 'Mumbai, Maharashtra',
      trackingNumber: 'TRK123456789',
    },
    {
      id: 'ORD-2026-002',
      date: '2026-01-25',
      status: 'shipped',
      items: [
        {
          id: 5,
          name: 'Wooden Carved Mirror',
          craftType: 'Woodwork',
          price: 3200,
          quantity: 1,
          image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400',
        },
      ],
      subtotal: 3200,
      shipping: 150,
      total: 3350,
      deliveryAddress: 'Delhi, India',
      trackingNumber: 'TRK987654321',
      estimatedDelivery: '2026-01-30',
    },
    {
      id: 'ORD-2026-003',
      date: '2026-01-20',
      status: 'processing',
      items: [
        {
          id: 3,
          name: 'Blue Pottery Vase',
          craftType: 'Pottery',
          price: 1200,
          quantity: 2,
          image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400',
        },
        {
          id: 6,
          name: 'Brass Lamp Set',
          craftType: 'Metalwork',
          price: 2400,
          quantity: 1,
          image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400',
        },
      ],
      subtotal: 4800,
      shipping: 150,
      total: 4950,
      deliveryAddress: 'Bangalore, Karnataka',
    },
    {
      id: 'ORD-2025-089',
      date: '2025-12-15',
      status: 'cancelled',
      items: [
        {
          id: 4,
          name: 'Warli Art Wall Hanging',
          craftType: 'Painting',
          price: 1800,
          quantity: 1,
          image: 'https://images.unsplash.com/photo-1582201942988-13e60e4556ee?w=400',
        },
      ],
      subtotal: 1800,
      shipping: 150,
      total: 1950,
      deliveryAddress: 'Chennai, Tamil Nadu',
      cancellationReason: 'Requested by customer',
    },
  ]);

  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const statusConfig = {
    processing: { label: 'Processing', color: '#f59e0b', icon: '⏳' },
    shipped: { label: 'Shipped', color: '#3b82f6', icon: '🚚' },
    delivered: { label: 'Delivered', color: '#10b981', icon: '✓' },
    cancelled: { label: 'Cancelled', color: '#ef4444', icon: '✕' },
  };

  const filterOptions = [
    { value: 'all', label: 'All Orders' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getOrderStats = () => {
    return {
      total: orders.length,
      processing: orders.filter(o => o.status === 'processing').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
    };
  };

  const stats = getOrderStats();

  return (
    <div className="order-history-container">
      {/* Header */}
      <div className="order-history-header">
        <div className="header-content">
          <h1>Order History</h1>
          <p>Track and manage your craft purchases</p>
        </div>
      </div>

      {/* Stats */}
      <div className="order-stats">
        <div className="stat-card">
          <div className="stat-icon total">📦</div>
          <div className="stat-info">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Orders</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon processing">⏳</div>
          <div className="stat-info">
            <span className="stat-value">{stats.processing}</span>
            <span className="stat-label">Processing</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon shipped">🚚</div>
          <div className="stat-info">
            <span className="stat-value">{stats.shipped}</span>
            <span className="stat-label">In Transit</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon delivered">✓</div>
          <div className="stat-info">
            <span className="stat-value">{stats.delivered}</span>
            <span className="stat-label">Delivered</span>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="order-controls">
        <div className="filter-tabs">
          {filterOptions.map(option => (
            <button
              key={option.value}
              className={`filter-tab ${filterStatus === option.value ? 'active' : ''}`}
              onClick={() => setFilterStatus(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="search-box">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            type="text"
            placeholder="Search orders or products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="orders-list">
        {filteredOrders.length === 0 ? (
          <div className="empty-orders">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
            <h3>No orders found</h3>
            <p>Try adjusting your filters or search query</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div key={order.id} className="order-card">
              {/* Order Header */}
              <div className="order-header">
                <div className="order-info">
                  <h3 className="order-id">{order.id}</h3>
                  <span className="order-date">{formatDate(order.date)}</span>
                </div>
                <div className="order-status-wrapper">
                  <span 
                    className={`order-status ${order.status}`}
                    style={{ backgroundColor: `${statusConfig[order.status].color}15`, color: statusConfig[order.status].color }}
                  >
                    <span className="status-icon">{statusConfig[order.status].icon}</span>
                    {statusConfig[order.status].label}
                  </span>
                </div>
              </div>

              {/* Order Items */}
              <div className="order-items">
                {order.items.map((item, index) => (
                  <div key={index} className="order-item">
                    <img src={item.image} alt={item.name} className="item-thumbnail" />
                    <div className="item-details">
                      <h4 className="item-name">{item.name}</h4>
                      <span className="item-category">{item.craftType}</span>
                    </div>
                    <div className="item-price">
                      <span className="quantity">Qty: {item.quantity}</span>
                      <span className="price">₹{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="order-summary">
                <div className="summary-details">
                  <div className="summary-row">
                    <span className="summary-icon">📍</span>
                    <span className="summary-text">{order.deliveryAddress}</span>
                  </div>
                  {order.trackingNumber && (
                    <div className="summary-row">
                      <span className="summary-icon">🔍</span>
                      <span className="summary-text">Tracking: {order.trackingNumber}</span>
                    </div>
                  )}
                  {order.estimatedDelivery && order.status === 'shipped' && (
                    <div className="summary-row">
                      <span className="summary-icon">📅</span>
                      <span className="summary-text">Est. Delivery: {formatDate(order.estimatedDelivery)}</span>
                    </div>
                  )}
                  {order.cancellationReason && (
                    <div className="summary-row">
                      <span className="summary-icon">ℹ️</span>
                      <span className="summary-text">Reason: {order.cancellationReason}</span>
                    </div>
                  )}
                </div>

                <div className="summary-total">
                  <span className="total-label">Total</span>
                  <span className="total-amount">₹{order.total.toLocaleString()}</span>
                </div>
              </div>

              {/* Order Actions */}
              <div className="order-actions">
                <button className="btn-action view-details">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  View Details
                </button>
                {order.status === 'delivered' && (
                  <button className="btn-action download-invoice">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Download Invoice
                  </button>
                )}
                {(order.status === 'shipped' || order.status === 'delivered') && (
                  <button className="btn-action track-order">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="1" y="3" width="15" height="13"></rect>
                      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                      <circle cx="5.5" cy="18.5" r="2.5"></circle>
                      <circle cx="18.5" cy="18.5" r="2.5"></circle>
                    </svg>
                    Track Order
                  </button>
                )}
                {order.status === 'processing' && (
                  <button className="btn-action cancel-order">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
