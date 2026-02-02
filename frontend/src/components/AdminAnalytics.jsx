import { useState, useEffect, useContext } from 'react';
import { SocketContext } from '../context/SocketContext';
import './AdminAnalytics.css';

const AdminAnalytics = () => {
  const { socket } = useContext(SocketContext);
  const [liveStats, setLiveStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch initial stats
  useEffect(() => {
    fetchLiveStats();
  }, []);

  // Set up socket listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    // Listen for live stats updates
    const handleLiveStats = (data) => {
      console.log('[ANALYTICS] Received live stats:', data);
      setLiveStats(data);
      if (data.recentActivity) {
        setRecentActivity(data.recentActivity);
      }
    };

    // Listen for individual analytics events
    const handleSearch = (data) => {
      console.log('[ANALYTICS] Search event:', data);
      addRecentActivity({
        eventType: 'search',
        ...data,
      });
      
      // Update stats counters
      if (liveStats) {
        setLiveStats(prev => ({
          ...prev,
          searches: prev.searches + 1,
          totalEvents: prev.totalEvents + 1,
        }));
      }
    };

    const handleCraftView = (data) => {
      console.log('[ANALYTICS] Craft view event:', data);
      addRecentActivity({
        eventType: 'craft_view',
        ...data,
      });
      
      // Update stats counters
      if (liveStats) {
        setLiveStats(prev => ({
          ...prev,
          craftViews: prev.craftViews + 1,
          totalEvents: prev.totalEvents + 1,
        }));
      }
    };

    socket.on('analytics:live_stats', handleLiveStats);
    socket.on('analytics:search', handleSearch);
    socket.on('analytics:craft_view', handleCraftView);

    return () => {
      socket.off('analytics:live_stats', handleLiveStats);
      socket.off('analytics:search', handleSearch);
      socket.off('analytics:craft_view', handleCraftView);
    };
  }, [socket, liveStats]);

  const addRecentActivity = (activity) => {
    setRecentActivity(prev => {
      const updated = [activity, ...prev];
      return updated.slice(0, 10); // Keep only last 10
    });
  };

  const fetchLiveStats = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/admin/analytics/live`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      if (data.success) {
        setLiveStats(data.data);
        if (data.data.recentActivity) {
          setRecentActivity(data.data.recentActivity);
        }
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatEventType = (type) => {
    const types = {
      search: '🔍 Search',
      craft_view: '👁️ Craft View',
      product_view: '🛍️ Product View',
      add_to_cart: '🛒 Add to Cart',
      purchase: '💳 Purchase',
    };
    return types[type] || type;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading && !liveStats) {
    return (
      <div className="admin-analytics">
        <div className="analytics-loading">
          <div className="spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error && !liveStats) {
    return (
      <div className="admin-analytics">
        <div className="analytics-error">
          <p>❌ Error loading analytics: {error}</p>
          <button onClick={fetchLiveStats} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-analytics">
      <div className="analytics-header">
        <h1>📊 Live Analytics Dashboard</h1>
        <div className="live-indicator">
          <span className="pulse-dot"></span>
          <span>Live</span>
        </div>
      </div>

      <div className="analytics-subtitle">
        <p>Last 24 Hours • Updates in Real-time</p>
        <button onClick={fetchLiveStats} className="refresh-button">
          🔄 Refresh
        </button>
      </div>

      {liveStats && (
        <>
          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <h3>Total Events</h3>
                <p className="stat-value">{liveStats.totalEvents || 0}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">👁️</div>
              <div className="stat-content">
                <h3>Craft Views</h3>
                <p className="stat-value">{liveStats.craftViews || 0}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🔍</div>
              <div className="stat-content">
                <h3>Searches</h3>
                <p className="stat-value">{liveStats.searches || 0}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <h3>Unique Users</h3>
                <p className="stat-value">{liveStats.uniqueUsers || 0}</p>
              </div>
            </div>
          </div>

          {/* Top Searches */}
          {liveStats.topSearches && liveStats.topSearches.length > 0 && (
            <div className="analytics-section">
              <h2>🔥 Top Searches</h2>
              <div className="top-searches">
                {liveStats.topSearches.map((search, index) => (
                  <div key={index} className="search-item">
                    <div className="search-rank">#{index + 1}</div>
                    <div className="search-content">
                      <span className="search-query">{search._id}</span>
                      <span className="search-type">
                        {search.searchType === 'voice' ? '🎤' : '⌨️'} {search.searchType}
                      </span>
                    </div>
                    <div className="search-count">{search.count} searches</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="analytics-section">
            <h2>⚡ Recent Activity</h2>
            <div className="recent-activity">
              {recentActivity.length === 0 ? (
                <p className="no-activity">No recent activity</p>
              ) : (
                recentActivity.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-type">
                      {formatEventType(activity.eventType)}
                    </div>
                    <div className="activity-details">
                      {activity.query && (
                        <span className="activity-query">"{activity.query}"</span>
                      )}
                      {activity.craftName && (
                        <span className="activity-craft">{activity.craftName}</span>
                      )}
                      {activity.category && (
                        <span className="activity-category">• {activity.category}</span>
                      )}
                      {activity.resultsCount !== undefined && (
                        <span className="activity-results">
                          • {activity.resultsCount} results
                        </span>
                      )}
                    </div>
                    <div className="activity-time">
                      {formatTime(activity.timestamp || activity.createdAt)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminAnalytics;
