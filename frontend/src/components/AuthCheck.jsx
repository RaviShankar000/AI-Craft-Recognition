import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Component to check authentication status and display login prompt
 */
const AuthCheck = () => {
  const [hasToken, setHasToken] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    setHasToken(!!token);

    if (!token) {
      console.warn('[AUTH] No authentication token found');
    }
  }, []);

  if (hasToken) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      backgroundColor: '#ff6b6b',
      color: 'white',
      padding: '16px 20px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 9999,
      maxWidth: '400px',
    }}>
      <strong>⚠️ Not Logged In</strong>
      <p style={{ margin: '8px 0 12px', fontSize: '14px' }}>
        You need to log in to access real-time features and protected content.
      </p>
      <button
        onClick={() => navigate('/login')}
        style={{
          backgroundColor: 'white',
          color: '#ff6b6b',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold',
        }}
      >
        Go to Login
      </button>
    </div>
  );
};

export default AuthCheck;
