// Mock console methods to suppress debug output during tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// Mock database pool
const mockQuery = jest.fn();
jest.doMock('../config/db', () => ({
  query: mockQuery
}));

// Import after mocking
const {
  getAllSchools,
  registerSchool,
  getRegistrationStatus,
  changeRegistrationStatus,
  deleteSchool
} = require('../controllers/schoolController');

describe('School Controller Tests', () => {
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
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('getAllSchools', () => {
    test('should return 200 and schools data', async () => {
      const mockSchools = [
        {
          id: 1,
          person_email: 'john@school.edu',
          school_name: 'Test University',
          num_delegates: 10,
          head_delegate_name: 'John Doe',
          head_delegate_contact_phone: '123-456-7890',
          primary_email: 'contact@school.edu',
          extra_info: 'Additional information'
        }
      ];

      mockQuery.mockResolvedValue({ rows: mockSchools });

      await getAllSchools(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockSchools);
    });

    test('should return 500 for database errors', async () => {
      mockQuery.mockRejectedValue(new Error('Database error'));

      await getAllSchools(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });

  describe('registerSchool', () => {
    test('should return 201 and register school successfully', async () => {
      req.body = {
        personEmail: 'john@school.edu',
        schoolName: 'Test University',
        numDelegates: 10,
        headDName: 'John Doe',
        headDCP: '123-456-7890',
        primEmail: 'contact@school.edu',
        extraInfo: 'Additional information'
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [] }) // Check for existing school (none found)
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: 1, 
            school_name: 'Test University',
            person_email: 'john@school.edu'
          }] 
        }); // Insert new school

      await registerSchool(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        result: expect.objectContaining({
          id: 1,
          school_name: 'Test University'
        }),
        message: 'School registered successfully'
      });
    });

    test('should return 400 for missing required fields', async () => {
      req.body = {
        personEmail: 'john@school.edu',
        schoolName: '', // Missing school name
        numDelegates: 10,
        headDName: 'John Doe',
        headDCP: '123-456-7890',
        primEmail: 'contact@school.edu'
      };

      await registerSchool(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Missing required fields' });
    });

    test('should return 400 for duplicate school name', async () => {
      req.body = {
        personEmail: 'john@school.edu',
        schoolName: 'Existing University',
        numDelegates: 10,
        headDName: 'John Doe',
        headDCP: '123-456-7890',
        primEmail: 'contact@school.edu'
      };

      mockQuery.mockResolvedValue({ 
        rows: [{ 
          id: 1, 
          school_name: 'Existing University' 
        }] 
      }); // School already exists

      await registerSchool(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'School with this name already exists' 
      });
    });

    test('should return 500 for database errors during registration', async () => {
      req.body = {
        personEmail: 'john@school.edu',
        schoolName: 'Test University',
        numDelegates: 10,
        headDName: 'John Doe',
        headDCP: '123-456-7890',
        primEmail: 'contact@school.edu'
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [] }) // Check for existing school (none found)
        .mockRejectedValueOnce(new Error('Database error')); // Insert fails

      await registerSchool(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });

  describe('getRegistrationStatus', () => {
    test('should return 200 and registration status when open', async () => {
      mockQuery.mockResolvedValue({ 
        rows: [{ is_open: true }] 
      });

      await getRegistrationStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ isOpen: true });
    });

    test('should return 200 and registration status when closed', async () => {
      mockQuery.mockResolvedValue({ 
        rows: [{ is_open: false }] 
      });

      await getRegistrationStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ isOpen: false });
    });

    test('should return 404 when registration status not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await getRegistrationStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Registration status not found' 
      });
    });

    test('should return 500 for database errors', async () => {
      mockQuery.mockRejectedValue(new Error('Database error'));

      await getRegistrationStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });

  describe('changeRegistrationStatus', () => {
    test('should return 200 and open registration', async () => {
      req.body = { status: true };

      mockQuery.mockResolvedValue({ rowCount: 1 });

      await changeRegistrationStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Registration opened successfully' 
      });
    });

    test('should return 200 and close registration', async () => {
      req.body = { status: false };

      mockQuery.mockResolvedValue({ rowCount: 1 });

      await changeRegistrationStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Registration closed successfully' 
      });
    });

    test('should return 400 for invalid status value (string)', async () => {
      req.body = { status: 'true' };

      await changeRegistrationStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Invalid status value' 
      });
    });

    test('should return 400 for invalid status value (number)', async () => {
      req.body = { status: 1 };

      await changeRegistrationStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Invalid status value' 
      });
    });

    test('should return 400 for missing status', async () => {
      req.body = {};

      await changeRegistrationStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Invalid status value' 
      });
    });

    test('should return 500 for database errors', async () => {
      req.body = { status: true };

      mockQuery.mockRejectedValue(new Error('Database error'));

      await changeRegistrationStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });

  describe('deleteSchool', () => {
    test('should return 200 and delete school successfully', async () => {
      req.params.id = '1';

      mockQuery
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: 1, 
            school_name: 'Test University' 
          }] 
        }) // Check if school exists
        .mockResolvedValueOnce({ rowCount: 1 }); // Delete school

      await deleteSchool(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'School deleted successfully' 
      });
    });

    test('should return 404 for non-existent school', async () => {
      req.params.id = '999';

      mockQuery.mockResolvedValue({ rows: [] }); // School not found

      await deleteSchool(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'School not found' 
      });
    });

    test('should return 500 for database errors', async () => {
      req.params.id = '1';

      mockQuery.mockRejectedValue(new Error('Database error'));

      await deleteSchool(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });
});
