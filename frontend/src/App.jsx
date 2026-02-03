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

// Lazy load heavy components
const CraftPredictor = lazy(() => lazyWithRetry(() => import('./components/CraftPredictor')));
const CraftUpload = lazy(() => lazyWithRetry(() => import('./components/CraftUpload')));
const Chatbot = lazy(() => lazyWithRetry(() => import('./components/Chatbot')));
const Marketplace = lazy(() => lazyWithRetry(() => import('./components/Marketplace')));
const Cart = lazy(() => lazyWithRetry(() => import('./components/Cart')));
const OrderHistory = lazy(() => lazyWithRetry(() => import('./components/OrderHistory')));
const AdminAnalytics = lazy(() => lazyWithRetry(() => import('./components/AdminAnalytics')));

function App() {
  return (
    <LoadingProvider>
      <ToastProvider>
        <Router>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<DashboardLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
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
                <Route path="analytics" element={
                  <AdminRoute>
                    <Suspense fallback={<PageLoader />}>
                      <AdminAnalytics />
                    </Suspense>
                  </AdminRoute>
                } />
                <Route path="chatbot" element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <Chatbot />
                    </Suspense>
                  </ProtectedRoute>
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
