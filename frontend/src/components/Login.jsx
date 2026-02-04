import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store token and user data (API returns nested under data.data)
      login(data.data.user, data.data.token);
      
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role) => {
    const demoCredentials = {
      user: { email: 'user@demo.com', password: 'user123' },
      seller: { email: 'seller@demo.com', password: 'seller123' },
      admin: { email: 'admin@demo.com', password: 'admin123' },
      superadmin: { email: 'superadmin@demo.com', password: 'super123' },
    };

    const creds = demoCredentials[role];
    if (creds) {
      setEmail(creds.email);
      setPassword(creds.password);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>🎨 AI Craft Recognition</h1>
          <h2>Welcome Back</h2>
          <p>Sign in to continue to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? '🔄 Signing in...' : '🔐 Sign In'}
          </button>
        </form>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <div className="demo-accounts">
          <p className="demo-title">Quick Login - Demo Accounts:</p>
          <div className="demo-buttons">
            <button
              type="button"
              onClick={() => handleDemoLogin('user')}
              className="demo-button demo-user"
              disabled={loading}
            >
              👤 User
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('seller')}
              className="demo-button demo-seller"
              disabled={loading}
            >
              🎨 Seller
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('admin')}
              className="demo-button demo-admin"
              disabled={loading}
            >
              👨‍💼 Admin
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('superadmin')}
              className="demo-button demo-superadmin"
              disabled={loading}
            >
              ⚡ Super Admin
            </button>
          </div>
        </div>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="auth-link"
              disabled={loading}
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
