import { useState, useEffect } from 'react';
import './AdminPages.css';

const CraftManagement = () => {
  const [crafts, setCrafts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch crafts from API
    setLoading(false);
  }, []);

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Craft Management</h1>
        <p>Create, edit, and manage craft master data</p>
        <button className="btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add New Craft
        </button>
      </div>

      <div className="admin-stats">
        <div className="stat-card">
          <div className="stat-icon craft">🎨</div>
          <div className="stat-content">
            <h3>Total Crafts</h3>
            <p className="stat-value">156</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon active">✨</div>
          <div className="stat-content">
            <h3>Active Crafts</h3>
            <p className="stat-value">148</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pending">⏳</div>
          <div className="stat-content">
            <h3>Categories</h3>
            <p className="stat-value">24</p>
          </div>
        </div>
      </div>

      <div className="admin-content">
        <div className="content-header">
          <div className="search-box">
            <input type="text" placeholder="Search crafts..." />
          </div>
          <div className="filters">
            <select>
              <option>All Categories</option>
              <option>Textiles</option>
              <option>Pottery</option>
              <option>Jewelry</option>
            </select>
            <select>
              <option>All States</option>
              <option>Rajasthan</option>
              <option>Gujarat</option>
              <option>West Bengal</option>
            </select>
          </div>
        </div>

        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Craft Name</th>
                <th>Category</th>
                <th>State</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan="6" className="empty-state">
                  No crafts found. Click "Add New Craft" to get started.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CraftManagement;
