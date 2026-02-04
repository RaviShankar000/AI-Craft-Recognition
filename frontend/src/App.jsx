import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import './App.css';
import 'react-loading-skeleton/dist/skeleton.css';
import { LoadingProvider } from './context/LoadingContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute, AdminRoute, SellerRoute } from './components/RoleProtection';
import { PageLoader } from './components/SkeletonLoaders';
import { lazyWithRetry } from './utils/lazyLoad';
import DashboardLayout from './components/DashboardLayout';
import VoiceSearch from './components/VoiceSearch';
import Login from './components/Login';
import Register from './components/Register';

// Lazy load heavy components
const CraftPredictor = lazy(() => lazyWithRetry(() => import('./components/CraftPredictor')));
const CraftUpload = lazy(() => lazyWithRetry(() => import('./components/CraftUpload')));
const Chatbot = lazy(() => lazyWithRetry(() => import('./components/Chatbot')));
const Marketplace = lazy(() => lazyWithRetry(() => import('./components/Marketplace')));
const Cart = lazy(() => lazyWithRetry(() => import('./components/Cart')));
const OrderHistory = lazy(() => lazyWithRetry(() => import('./components/OrderHistory')));
const AdminAnalytics = lazy(() => lazyWithRetry(() => import('./components/AdminAnalytics')));

// Admin components
const AdminCrafts = lazy(() => lazyWithRetry(() => import('./components/admin/CraftManagement')));
const AdminProducts = lazy(() => lazyWithRetry(() => import('./components/admin/ProductModeration')));
const AdminSellers = lazy(() => lazyWithRetry(() => import('./components/admin/SellerManagement')));
const AdminUsers = lazy(() => lazyWithRetry(() => import('./components/admin/UserManagement')));
const AdminOrders = lazy(() => lazyWithRetry(() => import('./components/admin/OrderManagement')));

// Seller components
const SellerProducts = lazy(() => lazyWithRetry(() => import('./components/seller/ProductManagement')));
const SellerSales = lazy(() => lazyWithRetry(() => import('./components/seller/SalesAnalytics')));
const SellerProfile = lazy(() => lazyWithRetry(() => import('./components/seller/SellerProfile')));

function App() {
  return (
    <LoadingProvider>
      <ToastProvider>
        <Router>
          <AuthProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected routes with layout */}
              <Route path="/" element={<DashboardLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                
                {/* Common Dashboard */}
                <Route path="dashboard" element={
                  <ProtectedRoute>
                    <div className="app">
                      <VoiceSearch />
                      <div className="section-divider"></div>
                      <Suspense fallback={<PageLoader />}>
                        <CraftPredictor />
                      </Suspense>
                    </div>
                  </ProtectedRoute>
                } />
                
                {/* User Routes - Shopping & Browsing */}
                <Route path="crafts" element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <CraftUpload />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="products" element={
                  <Suspense fallback={<PageLoader />}>
                    <Marketplace />
                  </Suspense>
                } />
                <Route path="cart" element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <Cart />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="orders" element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <OrderHistory />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="chatbot" element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <Chatbot />
                    </Suspense>
                  </ProtectedRoute>
                } />
                
                {/* Admin Routes - Platform Management */}
                <Route path="admin/crafts" element={
                  <AdminRoute>
                    <Suspense fallback={<PageLoader />}>
                      <AdminCrafts />
                    </Suspense>
                  </AdminRoute>
                } />
                <Route path="admin/products" element={
                  <AdminRoute>
                    <Suspense fallback={<PageLoader />}>
                      <AdminProducts />
                    </Suspense>
                  </AdminRoute>
                } />
                <Route path="admin/sellers" element={
                  <AdminRoute>
                    <Suspense fallback={<PageLoader />}>
                      <AdminSellers />
                    </Suspense>
                  </AdminRoute>
                } />
                <Route path="admin/users" element={
                  <AdminRoute>
                    <Suspense fallback={<PageLoader />}>
                      <AdminUsers />
                    </Suspense>
                  </AdminRoute>
                } />
                <Route path="admin/orders" element={
                  <AdminRoute>
                    <Suspense fallback={<PageLoader />}>
                      <AdminOrders />
                    </Suspense>
                  </AdminRoute>
                } />
                <Route path="analytics" element={
                  <AdminRoute>
                    <Suspense fallback={<PageLoader />}>
                      <AdminAnalytics />
                    </Suspense>
                  </AdminRoute>
                } />
                
                {/* Seller Routes - Product & Sales Management */}
                <Route path="seller/products" element={
                  <SellerRoute>
                    <Suspense fallback={<PageLoader />}>
                      <SellerProducts />
                    </Suspense>
                  </SellerRoute>
                } />
                <Route path="seller/sales" element={
                  <SellerRoute>
                    <Suspense fallback={<PageLoader />}>
                      <SellerSales />
                    </Suspense>
                  </SellerRoute>
                } />
                <Route path="seller/profile" element={
                  <SellerRoute>
                    <Suspense fallback={<PageLoader />}>
                      <SellerProfile />
                    </Suspense>
                  </SellerRoute>
                } />
              </Route>
            </Routes>
          </AuthProvider>
        </Router>
      </ToastProvider>
    </LoadingProvider>
  );
}

export default App;
