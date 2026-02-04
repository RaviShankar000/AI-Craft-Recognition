import { useState, useEffect } from 'react';
import './SellerPages.css';

const SalesAnalytics = () => {
  const [timeRange, setTimeRange] = useState('7days');
  const [salesData, setSalesData] = useState(null);

  useEffect(() => {
    // TODO: Fetch sales analytics from API
  }, [timeRange]);

  return (
    <div className="seller-page">
      <div className="seller-header">
        <h1>Sales Analytics</h1>
        <p>Track your sales performance and revenue</p>
        <div className="time-range-selector">
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 3 Months</option>
          </select>
        </div>
      </div>

      <div className="seller-stats">
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Total Revenue</h3>
            <p className="stat-value">₹45,678</p>
            <span className="stat-change positive">+12.5%</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>Orders</h3>
            <p className="stat-value">89</p>
            <span className="stat-change positive">+8.3%</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>Avg. Order Value</h3>
            <p className="stat-value">₹513</p>
            <span className="stat-change negative">-2.1%</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <h3>Customer Rating</h3>
            <p className="stat-value">4.8</p>
            <span className="stat-change">23 reviews</span>
          </div>
        </div>
      </div>

      <div className="seller-content">
        <div className="analytics-grid">
          <div className="chart-card">
            <h3>Revenue Trend</h3>
            <div className="chart-placeholder">
              <p>📊 Chart will be displayed here</p>
            </div>
          </div>

          <div className="chart-card">
            <h3>Top Selling Products</h3>
            <div className="product-list">
              <div className="empty-state">
                No sales data available yet
              </div>
            </div>
          </div>
        </div>

        <div className="recent-orders">
          <h3>Recent Orders</h3>
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Product</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan="6" className="empty-state">
                    No orders yet
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesAnalytics;
