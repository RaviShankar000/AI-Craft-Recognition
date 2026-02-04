import { useState, useEffect } from 'react';
import './AdminPages.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // TODO: Fetch users from API
  }, []);

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>User Management</h1>
        <p>View and manage platform users</p>
      </div>

      <div className="admin-stats">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Total Users</h3>
            <p className="stat-value">1,234</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon active">✨</div>
          <div className="stat-content">
            <h3>Active Today</h3>
            <p className="stat-value">342</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>New This Week</h3>
            <p className="stat-value">56</p>
          </div>
        </div>
      </div>

      <div className="admin-content">
        <div className="content-header">
          <div className="search-box">
            <input 
              type="text" 
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filters">
            <select>
              <option>All Users</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
            <select>
              <option>All Time</option>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
        </div>

        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Orders</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan="7" className="empty-state">
                  No users found
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
