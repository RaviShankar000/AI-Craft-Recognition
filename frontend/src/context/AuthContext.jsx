import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

/**
 * AuthProvider - Centralized authentication state management
 * Manages user authentication, token storage, and role-based access
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Logout function
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log('[AUTH] User logged out');
    navigate('/login');
  }, [navigate]);

  // Login function
  const login = useCallback((userData, authToken) => {
    // Validate input before storing
    if (!userData || !authToken || !userData.email) {
      console.error('[AUTH] Invalid login data provided');
      toast.error('Login failed: Invalid user data');
      return;
    }
    
    console.log('[AUTH] Login data received:', { userData, authToken: authToken.substring(0, 20) + '...' });
    
    setUser(userData);
    setToken(authToken);
    setIsAuthenticated(true);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    console.log('[AUTH] User logged in:', userData.email, 'Role:', userData.role);
  }, []);

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    // Check if values are valid (not null, not "undefined" string, not empty)
    if (storedToken && storedUser && storedToken !== 'undefined' && storedUser !== 'undefined') {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Validate that parsedUser has required properties
        if (parsedUser && parsedUser.email && parsedUser.name) {
          setToken(storedToken);
          setUser(parsedUser);
          setIsAuthenticated(true);
          console.log('[AUTH] Restored authentication from localStorage');
        } else {
          console.warn('[AUTH] Invalid user data in localStorage, clearing...');
          logout();
        }
      } catch (error) {
        console.error('[AUTH] Failed to parse stored user:', error);
        logout();
      }
    } else if (storedToken || storedUser) {
      // Clear corrupted data
      console.warn('[AUTH] Corrupted auth data detected, clearing localStorage...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    setLoading(false);
  }, [logout]);

  // Update user data (e.g., after profile update)
  const updateUser = useCallback((updatedData) => {
    const newUser = { ...user, ...updatedData };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  }, [user]);

  // Check if user has specific role
  const hasRole = useCallback((requiredRole) => {
    if (!user) return false;
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(user.role);
    }
    return user.role === requiredRole;
  }, [user]);

  // Check if user has any of the specified roles
  const hasAnyRole = useCallback((...roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  }, [user]);

  // Check if user is admin
  const isAdmin = useCallback(() => {
    return user?.role === 'admin' || user?.role === 'super_admin';
  }, [user]);

  // Check if user is super admin
  const isSuperAdmin = useCallback(() => {
    return user?.role === 'super_admin';
  }, [user]);

  // Check if user is seller
  const isSeller = useCallback(() => {
    return user?.role === 'seller';
  }, [user]);

  // Check if user is regular user
  const isUser = useCallback(() => {
    return user?.role === 'user';
  }, [user]);

  // Get authorization header for API requests
  const getAuthHeader = useCallback(() => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  const value = {
    // State
    user,
    token,
    isAuthenticated,
    loading,

    // Actions
    login,
    logout,
    updateUser,

    // Role checks
    hasRole,
    hasAnyRole,
    isAdmin,
    isSuperAdmin,
    isSeller,
    isUser,

    // Utils
    getAuthHeader,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * useAuth Hook - Access auth context
 * @returns {Object} Auth context value
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
