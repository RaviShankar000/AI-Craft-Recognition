import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import SocketStatus from './SocketStatus';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="dashboard-layout">
      <Navbar toggleSidebar={toggleSidebar} />
      <div className="dashboard-container">
        <Sidebar isOpen={sidebarOpen} />
        <main className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          <div className="dashboard-content">
            <Outlet />
          </div>
        </main>
      </div>
      <SocketStatus />
    </div>
  );
};

export default DashboardLayout;
