// Mock console methods to suppress debug output during tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// Set environment variables for testing BEFORE any imports
process.env.ADMIN_GMAIL_USER = 'admin@test.com';
process.env.ADMIN_GMAIL_PASS = 'test_password';
process.env.GMAIL_USER = 'personal@test.com';
process.env.GMAIL_PASS = 'test_password';

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
const { sendContactEmailCore, sendBusinessEmailCore } = require('../utils/emailService');

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

  describe('sendBusinessEmailCore', () => {
    test('should successfully send business email with all parameters', async () => {
      const formData = {
        name: 'Jane Smith',
        email: 'jane@company.com',
        subject: 'Business Inquiry',
        message: 'This is a business message',
        organization: 'Company Inc',
        referral: 'Website referral'
      };

      const result = await sendBusinessEmailCore(formData);

      expect(result).toEqual({
        success: true,
        message: 'Email sent successfully!'
      });
      
      expect(mockSendMail).toHaveBeenCalledTimes(1);
      
      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.from).toBe('"Jane Smith" <jane@company.com>');
      expect(callArgs.to).toBe('personal@test.com');
      expect(callArgs.subject).toBe('Business Inquiry');
      expect(callArgs.replyTo).toBe('jane@company.com');
      expect(callArgs.text).toContain('From: Jane Smith (jane@company.com)');
      expect(callArgs.text).toContain('Organization: Company Inc');
      expect(callArgs.text).toContain('Message: This is a business message');
      expect(callArgs.text).toContain('Referral: Website referral');
    });

    test('should send business email with optional parameters as null', async () => {
      const formData = {
        name: 'Jane Smith',
        email: 'jane@company.com',
        subject: 'Business Inquiry',
        message: 'This is a business message',
        organization: null,
        referral: null
      };

      const result = await sendBusinessEmailCore(formData);

      expect(result).toEqual({
        success: true,
        message: 'Email sent successfully!'
      });
      
      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.text).toContain('Organization: Not specified');
      expect(callArgs.text).toContain('Referral: Direct contact');
    });

    test('should throw error for missing required business email parameters', async () => {
      const formData = {
        name: '',
        email: 'jane@company.com',
        subject: 'Subject',
        message: 'Message'
      };

      await expect(sendBusinessEmailCore(formData))
        .rejects.toThrow('Missing required email parameters');
    });

    test('should throw error for invalid business email format', async () => {
      const formData = {
        name: 'Jane Smith',
        email: 'invalid-email',
        subject: 'Business Inquiry',
        message: 'Message'
      };

      await expect(sendBusinessEmailCore(formData))
        .rejects.toThrow('Invalid email format');
    });

    test('should handle business email sending failure', async () => {
      mockSendMail.mockRejectedValue(new Error('Authentication failed'));

      const formData = {
        name: 'Jane Smith',
        email: 'jane@company.com',
        subject: 'Business Inquiry',
        message: 'Message'
      };

      await expect(sendBusinessEmailCore(formData))
        .rejects.toThrow('Error sending email');
    });
  });
});
