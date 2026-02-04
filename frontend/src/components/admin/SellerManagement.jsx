import { useState, useEffect } from 'react';
import './AdminPages.css';

const SellerManagement = () => {
  const [sellers, setSellers] = useState([]);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    // TODO: Fetch sellers from API
  }, [filter]);

  const handleApprove = (sellerId) => {
    // TODO: API call to approve seller
    console.log('Approve seller:', sellerId);
  };

  const handleReject = (sellerId) => {
    // TODO: API call to reject seller
    console.log('Reject seller:', sellerId);
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Seller Management</h1>
        <p>Approve and manage seller accounts</p>
      </div>

      <div className="admin-stats">
        <div className="stat-card">
          <div className="stat-icon pending">⏳</div>
          <div className="stat-content">
            <h3>Pending Approval</h3>
            <p className="stat-value">12</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon approved">🎨</div>
          <div className="stat-content">
            <h3>Active Sellers</h3>
            <p className="stat-value">89</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>Total Products</h3>
            <p className="stat-value">456</p>
          </div>
        </div>
      </div>

      <div className="admin-content">
        <div className="content-header">
          <div className="filter-tabs">
            <button 
              className={filter === 'pending' ? 'active' : ''}
              onClick={() => setFilter('pending')}
            >
              Pending (12)
            </button>
            <button 
              className={filter === 'approved' ? 'active' : ''}
              onClick={() => setFilter('approved')}
            >
              Approved
            </button>
            <button 
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              All Sellers
            </button>
          </div>
        </div>

        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Seller Name</th>
                <th>Email</th>
                <th>Type</th>
                <th>Products</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan="7" className="empty-state">
                  No sellers to review
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SellerManagement;
