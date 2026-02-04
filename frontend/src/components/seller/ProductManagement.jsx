import { useState, useEffect } from 'react';
import './SellerPages.css';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // TODO: Fetch seller's products from API
  }, [filter]);

  return (
    <div className="seller-page">
      <div className="seller-header">
        <h1>My Products</h1>
        <p>Manage your product listings</p>
        <button className="btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add New Product
        </button>
      </div>

      <div className="seller-stats">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>Total Products</h3>
            <p className="stat-value">24</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon approved">✅</div>
          <div className="stat-content">
            <h3>Approved</h3>
            <p className="stat-value">18</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pending">⏳</div>
          <div className="stat-content">
            <h3>Pending Review</h3>
            <p className="stat-value">4</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔄</div>
          <div className="stat-content">
            <h3>In Stock</h3>
            <p className="stat-value">15</p>
          </div>
        </div>
      </div>

      <div className="seller-content">
        <div className="content-header">
          <div className="filter-tabs">
            <button 
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              All Products (24)
            </button>
            <button 
              className={filter === 'approved' ? 'active' : ''}
              onClick={() => setFilter('approved')}
            >
              Approved (18)
            </button>
            <button 
              className={filter === 'pending' ? 'active' : ''}
              onClick={() => setFilter('pending')}
            >
              Pending (4)
            </button>
            <button 
              className={filter === 'rejected' ? 'active' : ''}
              onClick={() => setFilter('rejected')}
            >
              Rejected (2)
            </button>
          </div>
          <div className="search-box">
            <input type="text" placeholder="Search your products..." />
          </div>
        </div>

        <div className="product-grid">
          <div className="empty-state-card">
            <div className="empty-icon">🎨</div>
            <h3>No products yet</h3>
            <p>Start adding your craft products to sell on the platform</p>
            <button className="btn-primary">Add Your First Product</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductManagement;
