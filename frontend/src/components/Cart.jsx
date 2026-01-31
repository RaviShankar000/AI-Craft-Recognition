import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Cart.css';

const Cart = () => {
  // Mock cart data - will be replaced with actual cart state/context
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: 'Handwoven Pashmina Shawl',
      craftType: 'Textile',
      price: 4500,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400',
      seller: 'Kashmir Crafts',
      inStock: true,
    },
    {
      id: 2,
      name: 'Madhubani Painting',
      craftType: 'Painting',
      price: 2800,
      quantity: 2,
      image: 'https://images.unsplash.com/photo-1578301978018-3005759f48f7?w=400',
      seller: 'Bihar Art House',
      inStock: true,
    },
    {
      id: 5,
      name: 'Wooden Carved Mirror',
      craftType: 'Woodwork',
      price: 3200,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400',
      seller: 'Mysore Crafts',
      inStock: true,
    },
  ]);

  const shippingCost = 150;
  const freeShippingThreshold = 5000;

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    setCartItems(items =>
      items.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeItem = (itemId) => {
    setCartItems(items => items.filter(item => item.id !== itemId));
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const calculateShipping = () => {
    const subtotal = calculateSubtotal();
    return subtotal >= freeShippingThreshold ? 0 : shippingCost;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateShipping();
  };

  const subtotal = calculateSubtotal();
  const shipping = calculateShipping();
  const total = calculateTotal();

  if (cartItems.length === 0) {
    return (
      <div className="cart-container">
        <div className="empty-cart">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="80"
            height="80"
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
          <h2>Your cart is empty</h2>
          <p>Add some amazing handcrafted items to get started!</p>
          <Link to="/products" className="btn-shop-now">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h1>Shopping Cart</h1>
        <span className="cart-count">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</span>
      </div>

      <div className="cart-content">
        {/* Cart Items */}
        <div className="cart-items-section">
          <div className="cart-items-header">
            <span className="header-product">Product</span>
            <span className="header-price">Price</span>
            <span className="header-quantity">Quantity</span>
            <span className="header-total">Total</span>
            <span className="header-action"></span>
          </div>

          <div className="cart-items-list">
            {cartItems.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="item-product">
                  <img src={item.image} alt={item.name} className="item-image" />
                  <div className="item-details">
                    <h3 className="item-name">{item.name}</h3>
                    <span className="item-category">{item.craftType}</span>
                    <div className="item-seller">
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
                      <span>{item.seller}</span>
                    </div>
                    {!item.inStock && (
                      <span className="out-of-stock-label">Out of Stock</span>
                    )}
                  </div>
                </div>

                <div className="item-price">
                  <span className="price-amount">₹{item.price.toLocaleString()}</span>
                </div>

                <div className="item-quantity">
                  <button
                    className="qty-btn"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
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
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </button>
                  <span className="qty-value">{item.quantity}</span>
                  <button
                    className="qty-btn"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    disabled={!item.inStock}
                  >
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
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </button>
                </div>

                <div className="item-total">
                  <span className="total-amount">
                    ₹{(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>

                <div className="item-action">
                  <button
                    className="btn-remove"
                    onClick={() => removeItem(item.id)}
                    aria-label="Remove item"
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
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-actions">
            <Link to="/products" className="btn-continue-shopping">
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
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* Cart Summary */}
        <aside className="cart-summary">
          <h2>Order Summary</h2>

          <div className="summary-details">
            <div className="summary-row">
              <span className="summary-label">Subtotal ({cartItems.length} items)</span>
              <span className="summary-value">₹{subtotal.toLocaleString()}</span>
            </div>

            <div className="summary-row">
              <span className="summary-label">Shipping</span>
              <span className={`summary-value ${shipping === 0 ? 'free' : ''}`}>
                {shipping === 0 ? 'FREE' : `₹${shipping}`}
              </span>
            </div>

            {subtotal < freeShippingThreshold && (
              <div className="shipping-progress">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${(subtotal / freeShippingThreshold) * 100}%` }}
                  ></div>
                </div>
                <p className="progress-text">
                  Add ₹{(freeShippingThreshold - subtotal).toLocaleString()} more for FREE shipping
                </p>
              </div>
            )}

            {shipping === 0 && (
              <div className="free-shipping-badge">
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
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                You've earned FREE shipping!
              </div>
            )}

            <div className="summary-divider"></div>

            <div className="summary-row total-row">
              <span className="summary-label">Total</span>
              <span className="summary-value total-value">₹{total.toLocaleString()}</span>
            </div>
          </div>

          <button className="btn-checkout">
            <span>Proceed to Checkout</span>
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
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>

          <div className="payment-methods">
            <span className="methods-label">We accept</span>
            <div className="methods-icons">
              <span className="payment-icon">💳</span>
              <span className="payment-icon">🏦</span>
              <span className="payment-icon">📱</span>
            </div>
          </div>

          <div className="security-badge">
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
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            <span>Secure Checkout</span>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Cart;
