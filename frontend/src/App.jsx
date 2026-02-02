import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
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
    <Router>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={
            <div className="app">
              <VoiceSearch />
              <div className="section-divider"></div>
              <CraftPredictor />
            </div>
          } />
          <Route path="crafts" element={<CraftUpload />} />
          <Route path="products" element={<Marketplace />} />
          <Route path="cart" element={<Cart />} />
          <Route path="orders" element={<OrderHistory />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="chatbot" element={<Chatbot />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
