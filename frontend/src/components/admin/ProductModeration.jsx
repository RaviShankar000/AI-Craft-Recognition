import { useState, useEffect } from 'react';
import './AdminPages.css';

const ProductModeration = () => {
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected

  useEffect(() => {
    // TODO: Fetch pending products from API
  }, [filter]);

  const handleApprove = (productId) => {
    // TODO: API call to approve product
    console.log('Approve product:', productId);
  };

  const handleReject = (productId) => {
    // TODO: API call to reject product
    console.log('Reject product:', productId);
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Product Moderation</h1>
        <p>Review and approve seller products</p>
      </div>

      <div className="admin-stats">
        <div className="stat-card">
          <div className="stat-icon pending">⏳</div>
          <div className="stat-content">
            <h3>Pending Review</h3>
            <p className="stat-value">23</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon approved">✅</div>
          <div className="stat-content">
            <h3>Approved Today</h3>
            <p className="stat-value">15</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon rejected">❌</div>
          <div className="stat-content">
            <h3>Rejected</h3>
            <p className="stat-value">8</p>
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
              Pending (23)
            </button>
            <button 
              className={filter === 'approved' ? 'active' : ''}
              onClick={() => setFilter('approved')}
            >
              Approved
            </button>
            <button 
              className={filter === 'rejected' ? 'active' : ''}
              onClick={() => setFilter('rejected')}
            >
              Rejected
            </button>
          </div>
        </div>

        <div className="product-grid">
          <div className="empty-state-card">
            <div className="empty-icon">📦</div>
            <h3>No {filter} products</h3>
            <p>Seller products will appear here for review</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModeration;
