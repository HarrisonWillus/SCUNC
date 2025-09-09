const JWT = require('jsonwebtoken');

// Mock console methods to suppress debug output during tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// Set environment variables for testing
process.env.JWT_KEY = 'test-jwt-secret-key';

// Mock Supabase client
const mockSignInWithPassword = jest.fn();
const mockSupabaseAuth = {
  signInWithPassword: mockSignInWithPassword
};

jest.doMock('../config/supabaseClient', () => ({
  auth: mockSupabaseAuth
}));

// Import after mocking
const { login, verifyToken } = require('../controllers/authController');

describe('Auth Controller Tests', () => {
  let req, res;

  beforeAll(() => {
    console.log = jest.fn();
    console.error = jest.fn();
  });

  afterAll(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    req = {
      body: {},
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('login', () => {
    test('should return 200 and token for successful login', async () => {
      req.body = {
        email: 'admin@test.com',
        password: 'password123'
      };

      mockSignInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'admin@test.com'
          }
        },
        error: null
      });

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        token: expect.any(String),
        message: 'Login successful'
      });
    });

    test('should return 401 for invalid credentials', async () => {
      req.body = {
        email: 'admin@test.com',
        password: 'wrongpassword'
      };

      mockSignInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid login credentials' }
      });

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid email or password'
      });
    });

    test('should return 500 when Supabase client is unavailable', async () => {
      req.body = {
        email: 'admin@test.com',
        password: 'password123'
      };

      // Mock Supabase as undefined
      const { login: loginWithoutSupabase } = require('../controllers/authController');
      
      // Temporarily break supabase
      mockSupabaseAuth.signInWithPassword = undefined;

      await loginWithoutSupabase(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication service unavailable'
      });

      // Restore
      mockSupabaseAuth.signInWithPassword = mockSignInWithPassword;
    });

    test('should return 500 for server errors', async () => {
      req.body = {
        email: 'admin@test.com',
        password: 'password123'
      };

      mockSignInWithPassword.mockRejectedValue(new Error('Database connection failed'));

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Server error during login'
      });
    });
  });

  describe('verifyToken', () => {
    test('should return 200 for valid token', () => {
      const validToken = JWT.sign(
        { isAdmin: true, id: 'user-123', email: 'admin@test.com' },
        process.env.JWT_KEY,
        { expiresIn: '1h' }
      );

      req.headers.authorization = `Bearer ${validToken}`;

      verifyToken(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        valid: true,
        message: 'Token is valid'
      });
    });

    test('should return 401 when no token provided', () => {
      req.headers.authorization = undefined;

      verifyToken(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        valid: false,
        message: 'No token provided'
      });
    });

    test('should return 401 for invalid token', () => {
      req.headers.authorization = 'Bearer invalid-token';

      verifyToken(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        valid: false,
        message: 'Invalid token'
      });
    });

    test('should return 401 for expired token', () => {
      const expiredToken = JWT.sign(
        { isAdmin: true, id: 'user-123', email: 'admin@test.com' },
        process.env.JWT_KEY,
        { expiresIn: '-1h' }
      );

      req.headers.authorization = `Bearer ${expiredToken}`;

      verifyToken(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        valid: false,
        message: 'Invalid token'
      });
    });

    test('should return 401 when authorization header is malformed', () => {
      req.headers.authorization = 'InvalidFormat';

      verifyToken(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        valid: false,
        message: 'No token provided'
      });
    });
  });
});
