import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

/**
 * Skeleton Loaders
 * Reusable skeleton components for different UI elements
 */

export const ProductCardSkeleton = () => (
  <div className="product-card-skeleton">
    <Skeleton height={200} />
    <div style={{ padding: '1rem' }}>
      <Skeleton height={24} width="80%" />
      <Skeleton height={16} width="60%" style={{ marginTop: '0.5rem' }} />
      <Skeleton height={20} width="40%" style={{ marginTop: '0.5rem' }} />
    </div>
  </div>
);

export const ProductGridSkeleton = ({ count = 6 }) => (
  <div className="product-grid">
    {Array.from({ length: count }).map((_, index) => (
      <ProductCardSkeleton key={index} />
    ))}
  </div>
);

export const CraftCardSkeleton = () => (
  <div className="craft-card-skeleton">
    <Skeleton height={250} />
    <div style={{ padding: '1rem' }}>
      <Skeleton height={28} width="70%" />
      <Skeleton height={16} count={2} style={{ marginTop: '0.5rem' }} />
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
        <Skeleton height={24} width={80} />
        <Skeleton height={24} width={80} />
      </div>
    </div>
  </div>
);

export const CraftGridSkeleton = ({ count = 4 }) => (
  <div className="craft-grid">
    {Array.from({ length: count }).map((_, index) => (
      <CraftCardSkeleton key={index} />
    ))}
  </div>
);

export const TableRowSkeleton = () => (
  <tr>
    <td><Skeleton width={40} /></td>
    <td><Skeleton width="80%" /></td>
    <td><Skeleton width={100} /></td>
    <td><Skeleton width={80} /></td>
    <td><Skeleton width={60} /></td>
  </tr>
);

export const TableSkeleton = ({ rows = 5, columns = 5 }) => (
  <table className="admin-table">
    <thead>
      <tr>
        {Array.from({ length: columns }).map((_, i) => (
          <th key={i}><Skeleton width="80%" /></th>
        ))}
      </tr>
    </thead>
    <tbody>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} />
      ))}
    </tbody>
  </table>
);

export const ProfileSkeleton = () => (
  <div className="profile-skeleton">
    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '2rem' }}>
      <Skeleton circle width={100} height={100} />
      <div style={{ flex: 1 }}>
        <Skeleton height={32} width="60%" />
        <Skeleton height={20} width="40%" style={{ marginTop: '0.5rem' }} />
      </div>
    </div>
    <div style={{ display: 'grid', gap: '1rem' }}>
      <Skeleton height={48} />
      <Skeleton height={48} />
      <Skeleton height={48} />
      <Skeleton height={120} />
    </div>
  </div>
);

export const AnalyticsSkeleton = () => (
  <div className="analytics-skeleton">
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={{ padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
          <Skeleton height={20} width="60%" />
          <Skeleton height={36} width="80%" style={{ marginTop: '0.5rem' }} />
          <Skeleton height={16} width="50%" style={{ marginTop: '0.5rem' }} />
        </div>
      ))}
    </div>
    <div style={{ padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
      <Skeleton height={300} />
    </div>
  </div>
);

export const FormSkeleton = ({ fields = 4 }) => (
  <div className="form-skeleton">
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} style={{ marginBottom: '1rem' }}>
        <Skeleton height={20} width="30%" style={{ marginBottom: '0.5rem' }} />
        <Skeleton height={48} />
      </div>
    ))}
    <Skeleton height={48} width={120} style={{ marginTop: '1rem' }} />
  </div>
);

export const DetailsSkeleton = () => (
  <div className="details-skeleton">
    <Skeleton height={400} style={{ marginBottom: '1.5rem' }} />
    <Skeleton height={32} width="70%" style={{ marginBottom: '1rem' }} />
    <Skeleton height={24} width="40%" style={{ marginBottom: '1rem' }} />
    <Skeleton height={20} count={4} style={{ marginBottom: '0.5rem' }} />
    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
      <Skeleton height={48} width={120} />
      <Skeleton height={48} width={120} />
    </div>
  </div>
);

export const ChatSkeleton = () => (
  <div className="chat-skeleton">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} style={{ 
        marginBottom: '1rem', 
        display: 'flex', 
        justifyContent: i % 2 === 0 ? 'flex-start' : 'flex-end' 
      }}>
        <div style={{ maxWidth: '70%' }}>
          <Skeleton height={60} width={300} />
        </div>
      </div>
    ))}
  </div>
);

export const NotificationSkeleton = () => (
  <div className="notification-skeleton">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} style={{ 
        padding: '1rem', 
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        gap: '1rem'
      }}>
        <Skeleton circle width={40} height={40} />
        <div style={{ flex: 1 }}>
          <Skeleton height={20} width="80%" />
          <Skeleton height={16} width="60%" style={{ marginTop: '0.5rem' }} />
        </div>
      </div>
    ))}
  </div>
);

export const DashboardSkeleton = () => (
  <div className="dashboard-skeleton">
    <Skeleton height={40} width="40%" style={{ marginBottom: '2rem' }} />
    <AnalyticsSkeleton />
    <div style={{ marginTop: '2rem' }}>
      <Skeleton height={32} width="30%" style={{ marginBottom: '1rem' }} />
      <TableSkeleton rows={8} />
    </div>
  </div>
);

// Generic Loading Spinner
export const LoadingSpinner = ({ size = 'medium', className = '' }) => {
  const sizeMap = {
    small: '20px',
    medium: '40px',
    large: '60px'
  };

  return (
    <div className={`loading-spinner ${className}`} style={{
      width: sizeMap[size],
      height: sizeMap[size],
      border: '3px solid #f3f3f3',
      borderTop: '3px solid #3498db',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      margin: '0 auto'
    }} />
  );
};

// Page Loading Overlay
export const PageLoader = () => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  }}>
    <LoadingSpinner size="large" />
    <p style={{ marginTop: '1rem', color: '#666' }}>Loading...</p>
  </div>
);

// Button with loading state
export const LoadingButton = ({ 
  loading, 
  children, 
  disabled, 
  className = '', 
  ...props 
}) => (
  <button 
    className={`btn ${className}`}
    disabled={loading || disabled}
    {...props}
  >
    {loading ? (
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <LoadingSpinner size="small" />
        Loading...
      </span>
    ) : children}
  </button>
);
