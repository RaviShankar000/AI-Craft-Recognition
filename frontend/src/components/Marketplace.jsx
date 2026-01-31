import { useState } from 'react';
import './Marketplace.css';

const Marketplace = () => {
  // Mock product data - will be replaced with API call
  const [products] = useState([
    {
      id: 1,
      name: 'Handwoven Pashmina Shawl',
      craftType: 'Textile',
      price: 4500,
      originalPrice: 6000,
      image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400',
      rating: 4.8,
      reviews: 24,
      seller: 'Kashmir Crafts',
      location: 'Srinagar, Kashmir',
      inStock: true,
      discount: 25,
    },
    {
      id: 2,
      name: 'Madhubani Painting',
      craftType: 'Painting',
      price: 2800,
      originalPrice: 3500,
      image: 'https://images.unsplash.com/photo-1578301978018-3005759f48f7?w=400',
      rating: 4.9,
      reviews: 18,
      seller: 'Bihar Art House',
      location: 'Madhubani, Bihar',
      inStock: true,
      discount: 20,
    },
    {
      id: 3,
      name: 'Blue Pottery Vase',
      craftType: 'Pottery',
      price: 1200,
      image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400',
      rating: 4.6,
      reviews: 32,
      seller: 'Jaipur Pottery',
      location: 'Jaipur, Rajasthan',
      inStock: true,
    },
    {
      id: 4,
      name: 'Warli Art Wall Hanging',
      craftType: 'Painting',
      price: 1800,
      originalPrice: 2200,
      image: 'https://images.unsplash.com/photo-1582201942988-13e60e4556ee?w=400',
      rating: 4.7,
      reviews: 15,
      seller: 'Maharashtra Folk Art',
      location: 'Mumbai, Maharashtra',
      inStock: false,
      discount: 18,
    },
    {
      id: 5,
      name: 'Wooden Carved Mirror',
      craftType: 'Woodwork',
      price: 3200,
      image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400',
      rating: 4.9,
      reviews: 28,
      seller: 'Mysore Crafts',
      location: 'Mysore, Karnataka',
      inStock: true,
    },
    {
      id: 6,
      name: 'Brass Lamp Set',
      craftType: 'Metalwork',
      price: 2400,
      originalPrice: 3000,
      image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400',
      rating: 4.5,
      reviews: 41,
      seller: 'Tamil Metalworks',
      location: 'Chennai, Tamil Nadu',
      inStock: true,
      discount: 20,
    },
  ]);

  const [filters, setFilters] = useState({
    craftType: 'all',
    priceRange: 'all',
    inStock: false,
    sortBy: 'featured',
  });

  const [viewMode, setViewMode] = useState('grid'); // grid or list

  const craftTypes = ['All', 'Textile', 'Painting', 'Pottery', 'Woodwork', 'Metalwork', 'Jewelry'];
  const priceRanges = [
    { label: 'All Prices', value: 'all' },
    { label: 'Under ₹1000', value: '0-1000' },
    { label: '₹1000 - ₹2500', value: '1000-2500' },
    { label: '₹2500 - ₹5000', value: '2500-5000' },
    { label: 'Above ₹5000', value: '5000+' },
  ];

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const filteredProducts = products.filter(product => {
    // Craft type filter
    if (filters.craftType !== 'all' && product.craftType.toLowerCase() !== filters.craftType.toLowerCase()) {
      return false;
    }

    // Price range filter
    if (filters.priceRange !== 'all') {
      const [min, max] = filters.priceRange.split('-').map(p => p.replace('+', ''));
      const price = product.price;
      if (max) {
        if (price < parseInt(min) || price > parseInt(max)) return false;
      } else {
        if (price < parseInt(min)) return false;
      }
    }

    // Stock filter
    if (filters.inStock && !product.inStock) {
      return false;
    }

    return true;
  });

  return (
    <div className="marketplace-container">
      {/* Header */}
      <div className="marketplace-header">
        <div className="header-content">
          <h1>Craft Marketplace</h1>
          <p>Discover authentic handmade crafts from artisans across India</p>
        </div>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-number">{products.length}</span>
            <span className="stat-label">Products</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">150+</span>
            <span className="stat-label">Artisans</span>
          </div>
        </div>
      </div>

      <div className="marketplace-content">
        {/* Filters Sidebar */}
        <aside className="filters-sidebar">
          <div className="filters-header">
            <h3>Filters</h3>
            <button 
              className="btn-clear-filters"
              onClick={() => setFilters({
                craftType: 'all',
                priceRange: 'all',
                inStock: false,
                sortBy: 'featured',
              })}
            >
              Clear All
            </button>
          </div>

          {/* Craft Type Filter */}
          <div className="filter-section">
            <h4>Craft Type</h4>
            <div className="filter-options">
              {craftTypes.map((type) => (
                <label key={type} className="filter-option">
                  <input
                    type="radio"
                    name="craftType"
                    value={type.toLowerCase()}
                    checked={filters.craftType === type.toLowerCase()}
                    onChange={(e) => handleFilterChange('craftType', e.target.value)}
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="filter-section">
            <h4>Price Range</h4>
            <div className="filter-options">
              {priceRanges.map((range) => (
                <label key={range.value} className="filter-option">
                  <input
                    type="radio"
                    name="priceRange"
                    value={range.value}
                    checked={filters.priceRange === range.value}
                    onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                  />
                  <span>{range.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Stock Filter */}
          <div className="filter-section">
            <label className="filter-option checkbox">
              <input
                type="checkbox"
                checked={filters.inStock}
                onChange={(e) => handleFilterChange('inStock', e.target.checked)}
              />
              <span>In Stock Only</span>
            </label>
          </div>
        </aside>

        {/* Products Area */}
        <main className="products-area">
          {/* Toolbar */}
          <div className="products-toolbar">
            <div className="results-info">
              <span className="results-count">{filteredProducts.length} Products</span>
            </div>

            <div className="toolbar-actions">
              {/* Sort */}
              <select
                className="sort-select"
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest</option>
              </select>

              {/* View Toggle */}
              <div className="view-toggle">
                <button
                  className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                >
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
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                </button>
                <button
                  className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                >
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
                    <line x1="8" y1="6" x2="21" y2="6"></line>
                    <line x1="8" y1="12" x2="21" y2="12"></line>
                    <line x1="8" y1="18" x2="21" y2="18"></line>
                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Products Grid/List */}
          <div className={`products-${viewMode}`}>
            {filteredProducts.map((product) => (
              <div key={product.id} className="product-card">
                <div className="product-image-wrapper">
                  <img src={product.image} alt={product.name} className="product-image" />
                  {product.discount && (
                    <span className="discount-badge">-{product.discount}%</span>
                  )}
                  {!product.inStock && (
                    <span className="stock-badge out-of-stock">Out of Stock</span>
                  )}
                  <div className="product-overlay">
                    <button className="btn-quick-view">Quick View</button>
                  </div>
                </div>

                <div className="product-info">
                  <div className="product-header">
                    <span className="product-category">{product.craftType}</span>
                    <div className="product-rating">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        stroke="none"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                      </svg>
                      <span>{product.rating}</span>
                      <span className="reviews-count">({product.reviews})</span>
                    </div>
                  </div>

                  <h3 className="product-name">{product.name}</h3>

                  <div className="seller-info">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span>{product.seller}</span>
                  </div>

                  <div className="location-info">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span>{product.location}</span>
                  </div>

                  <div className="product-footer">
                    <div className="product-price">
                      <span className="current-price">₹{product.price.toLocaleString()}</span>
                      {product.originalPrice && (
                        <span className="original-price">₹{product.originalPrice.toLocaleString()}</span>
                      )}
                    </div>
                    <button 
                      className="btn-add-to-cart"
                      disabled={!product.inStock}
                    >
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
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                      </svg>
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredProducts.length === 0 && (
            <div className="empty-state">
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
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <h3>No products found</h3>
              <p>Try adjusting your filters to see more results</p>
              <button 
                className="btn-reset-filters"
                onClick={() => setFilters({
                  craftType: 'all',
                  priceRange: 'all',
                  inStock: false,
                  sortBy: 'featured',
                })}
              >
                Reset Filters
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Marketplace;
