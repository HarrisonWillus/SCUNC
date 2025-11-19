// Mock console methods to suppress debug output during tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// Set environment variables for testing BEFORE any imports
process.env.ADMIN_GMAIL_USER = 'admin@test.com';
process.env.ADMIN_GMAIL_PASS = 'test_password';

// Create a comprehensive mock for nodemailer
const mockSendMail = jest.fn();
const mockVerify = jest.fn();
const mockCreateTransport = jest.fn();

jest.doMock('nodemailer', () => ({
  createTransport: mockCreateTransport
}));

// Configure the mock before importing
mockCreateTransport.mockReturnValue({
  sendMail: mockSendMail,
  verify: mockVerify
});

// Import AFTER mocking and environment setup
const { sendContactEmailCore } = require('../utils/emailService');

describe('Email Service Unit Tests', () => {
  beforeAll(() => {
    console.log = jest.fn();
    console.error = jest.fn();
  });

  afterAll(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup successful mock response
    mockSendMail.mockResolvedValue({
      messageId: 'test-message-id-123',
      response: '250 Message accepted',
      accepted: ['recipient@test.com'],
      rejected: []
    });
    
    mockVerify.mockImplementation((callback) => {
      if (callback) callback(null, true);
      return Promise.resolve(true);
    });
  });

  describe('sendContactEmailCore', () => {
    test('should successfully send contact email with valid parameters', async () => {
      const formData = {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Test Subject',
        message: 'This is a test message'
      };

      const result = await sendContactEmailCore(formData);

      expect(result).toEqual({
        success: true,
        message: 'Email sent successfully!'
      });
      
      expect(mockSendMail).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledWith({
        from: '"John Doe" <john@example.com>',
        to: 'admin@test.com',
        subject: 'Test Subject',
        text: 'This is a test message',
        replyTo: 'john@example.com'
      });
    });

    test('should throw error when name is missing', async () => {
      const formData = {
        name: '',
        email: 'john@example.com',
        subject: 'Test Subject',
        message: 'Test message'
      };

      await expect(sendContactEmailCore(formData))
        .rejects.toThrow('Missing required email parameters');
    });

    test('should throw error when email is missing', async () => {
      const formData = {
        name: 'John Doe',
        email: '',
        subject: 'Test Subject',
        message: 'Test message'
      };

      await expect(sendContactEmailCore(formData))
        .rejects.toThrow('Missing required email parameters');
    });

    test('should throw error when subject is missing', async () => {
      const formData = {
        name: 'John Doe',
        email: 'john@example.com',
        subject: '',
        message: 'Test message'
      };

      await expect(sendContactEmailCore(formData))
        .rejects.toThrow('Missing required email parameters');
    });

    test('should throw error when message is missing', async () => {
      const formData = {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Test Subject',
        message: ''
      };

      await expect(sendContactEmailCore(formData))
        .rejects.toThrow('Missing required email parameters');
    });

    test('should throw error for invalid email format', async () => {
      const formData = {
        name: 'John Doe',
        email: 'invalid-email-format',
        subject: 'Test Subject',
        message: 'Test message'
      };

      await expect(sendContactEmailCore(formData))
        .rejects.toThrow('Invalid email format');
    });

    test('should handle email sending failure', async () => {
      mockSendMail.mockRejectedValue(new Error('SMTP connection failed'));

      const formData = {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Test Subject',
        message: 'Test message'
      };

      await expect(sendContactEmailCore(formData))
        .rejects.toThrow('Error sending email');
    });
  });
});
