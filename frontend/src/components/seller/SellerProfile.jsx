import { useState, useEffect } from 'react';
import './SellerPages.css';

const SellerProfile = () => {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    businessName: '',
    businessType: 'artisan',
    description: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // TODO: Fetch seller profile from API
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Update seller profile via API
    setIsEditing(false);
  };

  return (
    <div className="seller-page">
      <div className="seller-header">
        <h1>Seller Profile</h1>
        <p>Manage your seller information</p>
        {!isEditing && (
          <button className="btn-primary" onClick={() => setIsEditing(true)}>
            Edit Profile
          </button>
        )}
      </div>

      <div className="seller-content">
        <div className="profile-container">
          <div className="profile-sidebar">
            <div className="profile-avatar">
              <div className="avatar-placeholder">🎨</div>
              <button className="btn-secondary">Change Photo</button>
            </div>
            <div className="profile-stats">
              <div className="stat-item">
                <span className="stat-label">Member Since</span>
                <span className="stat-value">Jan 2026</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Total Products</span>
                <span className="stat-value">24</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Total Sales</span>
                <span className="stat-value">₹45,678</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Rating</span>
                <span className="stat-value">⭐ 4.8</span>
              </div>
            </div>
          </div>

          <div className="profile-main">
            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <h3>Personal Information</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      disabled={!isEditing}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Business Information</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Business Name</label>
                    <input
                      type="text"
                      value={profile.businessName}
                      onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                      disabled={!isEditing}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Business Type</label>
                    <select
                      value={profile.businessType}
                      onChange={(e) => setProfile({ ...profile, businessType: e.target.value })}
                      disabled={!isEditing}
                    >
                      <option value="artisan">Individual Artisan</option>
                      <option value="ngo">NGO</option>
                      <option value="vendor">Vendor</option>
                      <option value="cooperative">Cooperative</option>
                    </select>
                  </div>
                </div>
                <div className="form-group full-width">
                  <label>Business Description</label>
                  <textarea
                    value={profile.description}
                    onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                    disabled={!isEditing}
                    rows="4"
                    placeholder="Tell customers about your craft and business..."
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>Address</h3>
                <div className="form-group full-width">
                  <label>Street Address</label>
                  <input
                    type="text"
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      value={profile.city}
                      onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input
                      type="text"
                      value={profile.state}
                      onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="form-group">
                    <label>Pincode</label>
                    <input
                      type="text"
                      value={profile.pincode}
                      onChange={(e) => setProfile({ ...profile, pincode: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Save Changes
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerProfile;
