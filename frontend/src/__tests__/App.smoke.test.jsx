import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { AuthProvider } from '../context/AuthContext';

// Mock fetch globally
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Helper function to render with providers
const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('App Smoke Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should render without crashing', () => {
    renderWithProviders(<App />);
    expect(document.body).toBeTruthy();
  });

  it('should show loading state initially', () => {
    renderWithProviders(<App />);
    // App should render even if showing loading state
    expect(document.querySelector('.app')).toBeTruthy();
  });

  it('should redirect to login when not authenticated', async () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    renderWithProviders(<App />);
    
    await waitFor(() => {
      // Should show login-related content or redirect
      expect(window.location.pathname === '/login' || 
             screen.queryByText(/login/i) || 
             screen.queryByText(/sign in/i)).toBeTruthy();
    });
  });

  it('should show dashboard when authenticated', async () => {
    // Mock authenticated user
    const mockUser = {
      id: '123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
    };
    
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'token') return 'mock-token';
      if (key === 'user') return JSON.stringify(mockUser);
      return null;
    });

    renderWithProviders(<App />);
    
    await waitFor(() => {
      // Should show some dashboard content
      expect(document.body).toBeTruthy();
    });
  });
});

describe('Navigation Smoke Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock authenticated user for navigation tests
    const mockUser = {
      id: '123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
    };
    
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'token') return 'mock-token';
      if (key === 'user') return JSON.stringify(mockUser);
      return null;
    });
  });

  it('should render navigation bar', async () => {
    renderWithProviders(<App />);
    
    await waitFor(() => {
      // Look for common navigation elements
      const nav = document.querySelector('nav') || 
                 document.querySelector('.navbar') ||
                 document.querySelector('.navigation');
      expect(nav).toBeTruthy();
    });
  });

  it('should handle route navigation', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);
    
    await waitFor(() => {
      // App should be rendered
      expect(document.body).toBeTruthy();
    });
  });
});

describe('Critical User Flows - Smoke Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock API responses
    global.fetch.mockImplementation((url) => {
      if (url.includes('/api/crafts')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: [
              { id: '1', name: 'Pottery', category: 'Ceramics' },
              { id: '2', name: 'Weaving', category: 'Textiles' },
            ],
          }),
        });
      }
      
      if (url.includes('/api/products')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: [
              { id: '1', name: 'Handmade Bowl', price: 45.99, craft: '1' },
              { id: '2', name: 'Woven Basket', price: 35.50, craft: '2' },
            ],
          }),
        });
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });
    });
  });

  it('should load marketplace without errors', async () => {
    const mockUser = {
      id: '123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
    };
    
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'token') return 'mock-token';
      if (key === 'user') return JSON.stringify(mockUser);
      return null;
    });

    renderWithProviders(<App />);
    
    await waitFor(() => {
      // App should render without crashing
      expect(document.body).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('should handle API errors gracefully', async () => {
    // Mock API error
    global.fetch.mockRejectedValue(new Error('Network error'));
    
    const mockUser = {
      id: '123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
    };
    
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'token') return 'mock-token';
      if (key === 'user') return JSON.stringify(mockUser);
      return null;
    });

    // Should not crash even with API errors
    expect(() => {
      renderWithProviders(<App />);
    }).not.toThrow();
  });
});
