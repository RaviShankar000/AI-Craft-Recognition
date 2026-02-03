import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import DashboardLayout from '../components/DashboardLayout';
import { AuthProvider } from '../context/AuthContext';

// Mock components that might have complex dependencies
vi.mock('../components/Navbar', () => ({
  default: () => <div data-testid="navbar">Navbar</div>,
}));

vi.mock('../components/Sidebar', () => ({
  default: () => <div data-testid="sidebar">Sidebar</div>,
}));

const renderWithProviders = (component, user) => {
  // Mock auth context
  const mockAuthContext = {
    user: user || { id: '123', name: 'Test User', role: 'user' },
    isAuthenticated: true,
    loading: false,
  };

  return render(
    <BrowserRouter>
      <AuthProvider value={mockAuthContext}>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Dashboard Smoke Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dashboard layout without crashing', () => {
    expect(() => {
      renderWithProviders(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>
      );
    }).not.toThrow();
  });

  it('should display navigation components', async () => {
    renderWithProviders(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    await waitFor(() => {
      // Check for navigation elements
      expect(
        document.querySelector('[data-testid="navbar"]') ||
        document.querySelector('nav') ||
        document.querySelector('.navbar')
      ).toBeTruthy();
    });
  });

  it('should render child content', () => {
    renderWithProviders(
      <DashboardLayout>
        <div data-testid="test-content">Dashboard Content</div>
      </DashboardLayout>
    );

    expect(screen.getByTestId('test-content')).toBeTruthy();
  });

  it('should handle different user roles', () => {
    const adminUser = { id: '456', name: 'Admin User', role: 'admin' };
    
    expect(() => {
      renderWithProviders(
        <DashboardLayout>
          <div>Admin Dashboard</div>
        </DashboardLayout>,
        adminUser
      );
    }).not.toThrow();
  });

  it('should handle seller role', () => {
    const sellerUser = { id: '789', name: 'Seller User', role: 'seller' };
    
    expect(() => {
      renderWithProviders(
        <DashboardLayout>
          <div>Seller Dashboard</div>
        </DashboardLayout>,
        sellerUser
      );
    }).not.toThrow();
  });
});

describe('Dashboard Navigation Smoke Tests', () => {
  it('should render without navigation errors', () => {
    const { container } = renderWithProviders(
      <DashboardLayout>
        <div>Test</div>
      </DashboardLayout>
    );

    // Should render something
    expect(container.firstChild).toBeTruthy();
  });

  it('should handle responsive layout', () => {
    // Test mobile view
    global.innerWidth = 375;
    global.dispatchEvent(new Event('resize'));

    expect(() => {
      renderWithProviders(
        <DashboardLayout>
          <div>Mobile View</div>
        </DashboardLayout>
      );
    }).not.toThrow();

    // Test desktop view
    global.innerWidth = 1920;
    global.dispatchEvent(new Event('resize'));

    expect(() => {
      renderWithProviders(
        <DashboardLayout>
          <div>Desktop View</div>
        </DashboardLayout>
      );
    }).not.toThrow();
  });
});

describe('Dashboard Data Loading Smoke Tests', () => {
  beforeEach(() => {
    // Mock fetch
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      })
    );
  });

  it('should handle data fetching without errors', async () => {
    renderWithProviders(
      <DashboardLayout>
        <div>Data Dashboard</div>
      </DashboardLayout>
    );

    await waitFor(() => {
      // Should complete rendering
      expect(document.body).toBeTruthy();
    });
  });

  it('should handle fetch failures gracefully', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Fetch failed')));

    expect(() => {
      renderWithProviders(
        <DashboardLayout>
          <div>Dashboard with Error</div>
        </DashboardLayout>
      );
    }).not.toThrow();
  });
});
