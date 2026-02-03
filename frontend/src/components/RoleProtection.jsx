import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from './SkeletonLoaders';

/**
 * ProtectedRoute - Requires authentication
 * Redirects to login if not authenticated
 */
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

/**
 * RoleProtectedRoute - Requires specific role(s)
 * Redirects based on user role
 */
export const RoleProtectedRoute = ({ children, roles, fallbackPath = '/dashboard' }) => {
  const { isAuthenticated, hasAnyRole, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  if (!hasAnyRole(...allowedRoles)) {
    console.warn('[ROUTE] Access denied. Required roles:', allowedRoles);
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
};

/**
 * AdminRoute - Admin-only route
 */
export const AdminRoute = ({ children }) => {
  return (
    <RoleProtectedRoute roles="admin" fallbackPath="/dashboard">
      {children}
    </RoleProtectedRoute>
  );
};

/**
 * SellerRoute - Seller and Admin route
 */
export const SellerRoute = ({ children }) => {
  return (
    <RoleProtectedRoute roles={['seller', 'admin']} fallbackPath="/dashboard">
      {children}
    </RoleProtectedRoute>
  );
};

/**
 * GuestRoute - Only for non-authenticated users
 * Redirects to dashboard if already logged in
 */
export const GuestRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

/**
 * RoleBasedRender - Conditionally render based on role
 * Doesn't redirect, just hides/shows content
 */
export const RoleBasedRender = ({ roles, children, fallback = null }) => {
  const { hasAnyRole, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return fallback;
  }

  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  if (!hasAnyRole(...allowedRoles)) {
    return fallback;
  }

  return children;
};

/**
 * AdminOnly - Show content only to admins
 */
export const AdminOnly = ({ children, fallback = null }) => {
  return <RoleBasedRender roles="admin" fallback={fallback}>{children}</RoleBasedRender>;
};

/**
 * SellerOnly - Show content to sellers and admins
 */
export const SellerOnly = ({ children, fallback = null }) => {
  return <RoleBasedRender roles={['seller', 'admin']} fallback={fallback}>{children}</RoleBasedRender>;
};

/**
 * AuthenticatedOnly - Show content only to authenticated users
 */
export const AuthenticatedOnly = ({ children, fallback = null }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : fallback;
};

export default ProtectedRoute;
