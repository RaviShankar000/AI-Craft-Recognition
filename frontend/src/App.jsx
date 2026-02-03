import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import 'react-loading-skeleton/dist/skeleton.css';
import { LoadingProvider } from './context/LoadingContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute, SellerRoute } from './components/RoleProtection';
import DashboardLayout from './components/DashboardLayout';
import CraftPredictor from './components/CraftPredictor';
import VoiceSearch from './components/VoiceSearch';
import CraftUpload from './components/CraftUpload';
import Chatbot from './components/Chatbot';
import Marketplace from './components/Marketplace';
import Cart from './components/Cart';
import OrderHistory from './components/OrderHistory';
import AdminAnalytics from './components/AdminAnalytics';

function App() {
  return (
    <LoadingProvider>
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
                    <CraftPredictor />
                  </div>
                </ProtectedRoute>
              } />
              <Route path="crafts" element={
                <ProtectedRoute>
                  <CraftUpload />
                </ProtectedRoute>
              } />
              <Route path="products" element={<Marketplace />} />
              <Route path="cart" element={
                <ProtectedRoute>
                  <Cart />
                </ProtectedRoute>
              } />
              <Route path="orders" element={
                <ProtectedRoute>
                  <OrderHistory />
                </ProtectedRoute>
              } />
              <Route path="analytics" element={
                <AdminRoute>
                  <AdminAnalytics />
                </AdminRoute>
              } />
              <Route path="chatbot" element={
                <ProtectedRoute>
                  <Chatbot />
                </ProtectedRoute>
              } />
            </Route>
          </Routes>
        </AuthProvider>
      </Router>
        </Route>
      </Routes>
    </Router>
    </LoadingProvider>
  );
}

export default App;
