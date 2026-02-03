/**
 * Unit tests for authentication and authorization middleware
 * Tests the protect and authorize middleware functions
 */

const jwt = require('jsonwebtoken');
const { protect, authorize } = require('../auth');
const User = require('../../models/User');

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../../models/User');

describe('Authentication Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    // Reset mocks before each test
    req = {
      headers: {},
      user: null,
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    
    jest.clearAllMocks();
  });

  describe('protect middleware', () => {
    it('should authenticate user with valid token', async () => {
      // Arrange
      const mockUser = {
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        active: true,
      };
      
      req.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockReturnValue({ userId: 'user123' });
      User.findById.mockResolvedValue(mockUser);

      // Act
      await protect(req, res, next);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', process.env.JWT_SECRET);
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject request without authorization header', async () => {
      // Arrange
      req.headers.authorization = undefined;

      // Act
      await protect(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Not authorized to access this route',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token format', async () => {
      // Arrange
      req.headers.authorization = 'InvalidFormat token123';

      // Act
      await protect(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Not authorized to access this route',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject expired token', async () => {
      // Arrange
      req.headers.authorization = 'Bearer expired-token';
      jwt.verify.mockImplementation(() => {
        const error = new Error('jwt expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      // Act
      await protect(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token expired',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid token', async () => {
      // Arrange
      req.headers.authorization = 'Bearer invalid-token';
      jwt.verify.mockImplementation(() => {
        throw new Error('invalid signature');
      });

      // Act
      await protect(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Not authorized to access this route',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject if user not found', async () => {
      // Arrange
      req.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockReturnValue({ userId: 'nonexistent' });
      User.findById.mockResolvedValue(null);

      // Act
      await protect(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject if user account is inactive', async () => {
      // Arrange
      const inactiveUser = {
        _id: 'user123',
        name: 'Inactive User',
        email: 'inactive@example.com',
        role: 'user',
        active: false,
      };
      
      req.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockReturnValue({ userId: 'user123' });
      User.findById.mockResolvedValue(inactiveUser);

      // Act
      await protect(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'User account is inactive',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('authorize middleware', () => {
    beforeEach(() => {
      // Mock authenticated user
      req.user = {
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
      };
    });

    it('should allow access when user has required role', () => {
      // Arrange
      const authorizeMiddleware = authorize('user', 'admin');

      // Act
      authorizeMiddleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow admin access to admin-only routes', () => {
      // Arrange
      req.user.role = 'admin';
      const authorizeMiddleware = authorize('admin');

      // Act
      authorizeMiddleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow seller access to seller routes', () => {
      // Arrange
      req.user.role = 'seller';
      const authorizeMiddleware = authorize('seller', 'admin');

      // Act
      authorizeMiddleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny access when user lacks required role', () => {
      // Arrange
      req.user.role = 'user';
      const authorizeMiddleware = authorize('admin');

      // Act
      authorizeMiddleware(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'User role user is not authorized to access this route',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should deny access when user role not in allowed list', () => {
      // Arrange
      req.user.role = 'user';
      const authorizeMiddleware = authorize('seller', 'admin');

      // Act
      authorizeMiddleware(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle multiple allowed roles correctly', () => {
      // Arrange
      req.user.role = 'seller';
      const authorizeMiddleware = authorize('user', 'seller', 'admin');

      // Act
      authorizeMiddleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject if no user object in request', () => {
      // Arrange
      req.user = null;
      const authorizeMiddleware = authorize('user');

      // Act
      authorizeMiddleware(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not authenticated',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
