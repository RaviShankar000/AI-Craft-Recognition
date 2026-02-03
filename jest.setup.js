/**
 * Jest setup file
 * Runs before all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.JWT_EXPIRE = '7d';
process.env.MONGODB_URI = 'mongodb://localhost:27017/craft-recognition-test';
process.env.PORT = '5001';

// Mock console methods in tests to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Keep error for debugging test failures
  error: console.error,
};

// Global test helpers
global.mockUser = (overrides = {}) => ({
  _id: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
  role: 'user',
  active: true,
  ...overrides,
});

global.mockAdmin = (overrides = {}) => ({
  _id: 'test-admin-id',
  name: 'Test Admin',
  email: 'admin@example.com',
  role: 'admin',
  active: true,
  ...overrides,
});

global.mockSeller = (overrides = {}) => ({
  _id: 'test-seller-id',
  name: 'Test Seller',
  email: 'seller@example.com',
  role: 'seller',
  active: true,
  ...overrides,
});
