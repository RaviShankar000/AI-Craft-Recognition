import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import DashboardLayout from './components/DashboardLayout';
import CraftPredictor from './components/CraftPredictor';
import VoiceSearch from './components/VoiceSearch';
import CraftUpload from './components/CraftUpload';

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
          <Route path="products" element={<div>Products Page</div>} />
          <Route path="orders" element={<div>Orders Page</div>} />
          <Route path="analytics" element={<div>Analytics Page</div>} />
          <Route path="chatbot" element={<div>AI Assistant Page</div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
