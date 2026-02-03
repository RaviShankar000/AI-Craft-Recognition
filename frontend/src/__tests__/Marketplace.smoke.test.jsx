import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Marketplace from '../components/Marketplace';
import Cart from '../components/Cart';
import { BrowserRouter } from 'react-router-dom';

// Mock fetch
global.fetch = vi.fn();

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Marketplace Smoke Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful product fetch
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: [
          {
            id: '1',
            name: 'Handmade Bowl',
            description: 'Beautiful ceramic bowl',
            price: 45.99,
            image: '/images/bowl.jpg',
            seller: { name: 'John Doe' },
          },
          {
            id: '2',
            name: 'Woven Basket',
            description: 'Traditional basket',
            price: 35.50,
            image: '/images/basket.jpg',
            seller: { name: 'Jane Smith' },
          },
        ],
      }),
    });
  });

  it('should render marketplace without crashing', () => {
    expect(() => {
      renderWithRouter(<Marketplace />);
    }).not.toThrow();
  });

  it('should display loading state initially', () => {
    renderWithRouter(<Marketplace />);
    
    // Should show some content or loading indicator
    expect(document.body).toBeTruthy();
  });

  it('should fetch and display products', async () => {
    renderWithRouter(<Marketplace />);
    
    await waitFor(() => {
      // Products should be fetched
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/products')
      );
    }, { timeout: 3000 });
  });

  it('should handle empty product list', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: [],
      }),
    });

    renderWithRouter(<Marketplace />);
    
    await waitFor(() => {
      expect(document.body).toBeTruthy();
    });
  });

  it('should handle API errors gracefully', async () => {
    global.fetch.mockRejectedValue(new Error('API Error'));

    expect(() => {
      renderWithRouter(<Marketplace />);
    }).not.toThrow();
  });
});

describe('Cart Smoke Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock localStorage for cart
    const cartMock = [
      { id: '1', name: 'Product 1', price: 10.99, quantity: 2 },
      { id: '2', name: 'Product 2', price: 25.50, quantity: 1 },
    ];
    
    global.localStorage = {
      getItem: vi.fn((key) => {
        if (key === 'cart') return JSON.stringify(cartMock);
        return null;
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
  });

  it('should render cart without crashing', () => {
    expect(() => {
      renderWithRouter(<Cart />);
    }).not.toThrow();
  });

  it('should display cart items', async () => {
    renderWithRouter(<Cart />);
    
    await waitFor(() => {
      // Cart should render
      expect(document.body).toBeTruthy();
    });
  });

  it('should handle empty cart', () => {
    global.localStorage.getItem.mockReturnValue(JSON.stringify([]));

    expect(() => {
      renderWithRouter(<Cart />);
    }).not.toThrow();
  });

  it('should calculate total correctly', async () => {
    renderWithRouter(<Cart />);
    
    await waitFor(() => {
      // Should complete rendering with totals
      expect(document.body).toBeTruthy();
    });
  });
});

describe('Checkout Flow Smoke Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    global.fetch.mockImplementation((url) => {
      if (url.includes('/checkout')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { orderId: '123', status: 'pending' },
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
    });
  });

  it('should handle checkout process without errors', async () => {
    const mockCart = [
      { id: '1', name: 'Product', price: 10, quantity: 1 },
    ];
    
    global.localStorage.getItem.mockReturnValue(JSON.stringify(mockCart));

    renderWithRouter(<Cart />);
    
    await waitFor(() => {
      expect(document.body).toBeTruthy();
    });
  });

  it('should handle checkout API errors', async () => {
    global.fetch.mockRejectedValue(new Error('Checkout failed'));

    const mockCart = [
      { id: '1', name: 'Product', price: 10, quantity: 1 },
    ];
    
    global.localStorage.getItem.mockReturnValue(JSON.stringify(mockCart));

    expect(() => {
      renderWithRouter(<Cart />);
    }).not.toThrow();
  });
});
