import { useState, useEffect } from 'react';
import './AdminPages.css';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // TODO: Fetch all orders from API
  }, [filter]);

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Order Management</h1>
        <p>Monitor all platform orders and transactions</p>
      </div>

      <div className="admin-stats">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>Total Orders</h3>
            <p className="stat-value">2,456</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pending">⏳</div>
          <div className="stat-content">
            <h3>Processing</h3>
            <p className="stat-value">89</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon approved">✅</div>
          <div className="stat-content">
            <h3>Completed Today</h3>
            <p className="stat-value">45</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Revenue Today</h3>
            <p className="stat-value">₹12,345</p>
          </div>
        </div>
      </div>

      <div className="admin-content">
        <div className="content-header">
          <div className="search-box">
            <input type="text" placeholder="Search orders by ID or customer..." />
          </div>
          <div className="filters">
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All Orders</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select>
              <option>Today</option>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>All Time</option>
            </select>
          </div>
        </div>

        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Seller</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan="7" className="empty-state">
                  No orders found
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrderManagement;
