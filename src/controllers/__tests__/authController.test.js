/**
 * Unit tests for authentication controller
 * Tests registration, login, and token generation
 */

const { register, login } = require('../authController');
const User = require('../../models/User');

// Mock User model
jest.mock('../../models/User');

describe('Auth Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register new user successfully', async () => {
      // Arrange
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123!',
      };
      
      const mockUser = {
        _id: 'user123',
        name: userData.name,
        email: userData.email,
        role: 'user',
        generateAuthToken: jest.fn().mockReturnValue('mock-token-123'),
      };

      req.body = userData;
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(mockUser);

      // Act
      await register(req, res);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(User.create).toHaveBeenCalledWith({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: 'user',
      });
      expect(mockUser.generateAuthToken).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: mockUser._id,
            name: mockUser.name,
            email: mockUser.email,
            role: mockUser.role,
          },
          token: 'mock-token-123',
        },
      });
    });

    it('should reject registration with existing email', async () => {
      // Arrange
      req.body = {
        name: 'John Doe',
        email: 'existing@example.com',
        password: 'SecurePass123!',
      };
      
      User.findOne.mockResolvedValue({ email: 'existing@example.com' });

      // Act
      await register(req, res);

      // Assert
      expect(User.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'User already exists with this email',
      });
    });

    it('should handle registration errors', async () => {
      // Arrange
      req.body = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123!',
      };
      
      User.findOne.mockResolvedValue(null);
      User.create.mockRejectedValue(new Error('Database error'));

      // Act
      await register(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Database error',
      });
    });

    it('should always assign user role regardless of request', async () => {
      // Arrange - attempt to register as admin
      req.body = {
        name: 'Hacker',
        email: 'hacker@example.com',
        password: 'password',
        role: 'admin', // This should be ignored
      };
      
      const mockUser = {
        _id: 'user123',
        name: 'Hacker',
        email: 'hacker@example.com',
        role: 'user', // Should be 'user', not 'admin'
        generateAuthToken: jest.fn().mockReturnValue('token'),
      };

      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(mockUser);

      // Act
      await register(req, res);

      // Assert
      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'user' })
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            user: expect.objectContaining({ role: 'user' }),
          }),
        })
      );
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      // Arrange
      const credentials = {
        email: 'john@example.com',
        password: 'CorrectPassword123!',
      };
      
      const mockUser = {
        _id: 'user123',
        name: 'John Doe',
        email: credentials.email,
        role: 'user',
        comparePassword: jest.fn().mockResolvedValue(true),
        generateAuthToken: jest.fn().mockReturnValue('login-token-456'),
      };

      req.body = credentials;
      User.findOne.mockResolvedValue(mockUser);

      // Act
      await login(req, res);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ email: credentials.email });
      expect(mockUser.comparePassword).toHaveBeenCalledWith(credentials.password);
      expect(mockUser.generateAuthToken).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: {
            id: mockUser._id,
            name: mockUser.name,
            email: mockUser.email,
            role: mockUser.role,
          },
          token: 'login-token-456',
        },
      });
    });

    it('should reject login with non-existent email', async () => {
      // Arrange
      req.body = {
        email: 'nonexistent@example.com',
        password: 'password',
      };
      
      User.findOne.mockResolvedValue(null);

      // Act
      await login(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid credentials',
      });
    });

    it('should reject login with incorrect password', async () => {
      // Arrange
      req.body = {
        email: 'john@example.com',
        password: 'WrongPassword',
      };
      
      const mockUser = {
        email: 'john@example.com',
        comparePassword: jest.fn().mockResolvedValue(false),
      };

      User.findOne.mockResolvedValue(mockUser);

      // Act
      await login(req, res);

      // Assert
      expect(mockUser.comparePassword).toHaveBeenCalledWith('WrongPassword');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid credentials',
      });
    });

    it('should handle login errors', async () => {
      // Arrange
      req.body = {
        email: 'john@example.com',
        password: 'password',
      };
      
      User.findOne.mockRejectedValue(new Error('Database connection failed'));

      // Act
      await login(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Database connection failed',
      });
    });
  });
});
