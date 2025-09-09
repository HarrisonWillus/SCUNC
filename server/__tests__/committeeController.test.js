// Mock console methods to suppress debug output during tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// Mock database pool
const mockQuery = jest.fn();
jest.doMock('../config/db', () => ({
  query: mockQuery
}));

// Mock Supabase client
const mockUpload = jest.fn();
const mockGetPublicUrl = jest.fn();
const mockSupabaseStorage = {
  from: jest.fn().mockReturnThis(),
  upload: mockUpload,
  getPublicUrl: mockGetPublicUrl
};

jest.doMock('../config/supabaseClient', () => ({
  storage: mockSupabaseStorage
}));

// Import after mocking
const {
  getAllCommittees,
  getCategories,
  createCommittee,
  updateCommittee,
  deleteCommittee,
  createCategory,
  updateCommitteePositions
} = require('../controllers/committeeController');

describe('Committee Controller Tests', () => {
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
    // Reset all mocks before each test
    mockQuery.mockReset();
    mockUpload.mockReset();
    
    // Reset request and response
    req = {
      body: {},
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('getAllCommittees', () => {
    test('should return 200 and committees data', async () => {
      const mockCommittees = [
        {
          id: 1,
          title: 'Test Committee',
          description: 'Test Description',
          category_title: 'Test Category',
          topics: [{ id: 1, topic: 'Test Topic' }]
        }
      ];

      mockQuery.mockResolvedValue({ rows: mockCommittees });

      await getAllCommittees(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ committees: mockCommittees });
    });

    test('should return 500 for database errors', async () => {
      mockQuery.mockRejectedValue(new Error('Database error'));

      await getAllCommittees(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });

  describe('getCategories', () => {
    test('should return 200 and categories data', async () => {
      const mockCategories = [
        { id: 1, title: 'Category 1' },
        { id: 2, title: 'Category 2' }
      ];

      mockQuery.mockResolvedValue({ rows: mockCategories });

      await getCategories(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ categories: mockCategories });
    });

    test('should return 500 for database errors', async () => {
      mockQuery.mockRejectedValue(new Error('Database error'));

      await getCategories(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });

  describe('createCommittee', () => {
    beforeEach(() => {
      mockUpload.mockResolvedValue({ data: { path: 'test-path' }, error: null });
      mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://test-url.com/image.jpg' } });
    });

    test('should return 201 and create committee successfully', async () => {
      req.body = {
        title: 'New Committee',
        description: 'Committee Description',
        category_id: 1,
        image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+WdNNlhd3wjlhW5GHaMPEuePjfUNExKyIJP/Z',
        topics: ['Topic 1', 'Topic 2']
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Create committee
        .mockResolvedValueOnce({ rows: [] }) // Topics insert (multiple calls)
        .mockResolvedValueOnce({ rows: [] }) // Topics insert (multiple calls)
        .mockResolvedValueOnce({ rows: [{ id: 1, title: 'New Committee' }] }); // Get all committees

      await createCommittee(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        committees: expect.any(Array),
        message: 'Committee created successfully'
      });
    });

    test('should return 400 for missing required fields', async () => {
      req.body = {
        title: '',
        description: 'Description',
        category_id: 1,
        image: 'data:image/jpeg;base64,validbase64data'
      };

      await createCommittee(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Missing required fields' });
    });

    test('should return 500 for supabase upload errors', async () => {
      req.body = {
        title: 'New Committee',
        description: 'Committee Description',
        category_id: 1,
        image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+WdNNlhd3wjlhW5GHaMPEuePjfUNExKyIJP/Z'
      };

      mockUpload.mockResolvedValue({ data: null, error: { message: 'Upload failed' } });

      await createCommittee(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });

    test('should return 500 for database errors', async () => {
      req.body = {
        title: 'New Committee',
        description: 'Committee Description',
        category_id: 1,
        image: 'data:image/jpeg;base64,validdata'
      };

      mockQuery.mockRejectedValue(new Error('Database error'));

      await createCommittee(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });

  describe('updateCommittee', () => {
    beforeEach(() => {
      req.params.id = '1';
      mockUpload.mockResolvedValue({ data: { path: 'test-path' }, error: null });
      mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://test-url.com/image.jpg' } });
    });

    test('should return 200 and update committee successfully', async () => {
      req.body = {
        name: 'Updated Committee',
        category_id: 1,
        description: 'Updated Description',
        photo: 'https://old-url.com', // Same URL as current to avoid validation error
        topics: ['New Topic']
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Old Committee', image_url: 'https://old-url.com' }] }) // Current record
        .mockResolvedValueOnce({ rows: [] }) // Update committee
        .mockResolvedValueOnce({ rows: [] }) // Delete topics
        .mockResolvedValueOnce({ rows: [] }) // Insert new topics
        .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Updated Committee' }] }); // Get all committees

      await updateCommittee(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        committees: expect.any(Array),
        message: 'Committee updated successfully'
      });
    });

    test('should return 400 for missing required fields', async () => {
      req.body = {
        name: 'Updated Committee'
        // Missing category_id
      };

      await updateCommittee(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Missing required fields' });
    });

    test('should return 404 for non-existent committee', async () => {
      req.body = {
        name: 'Updated Committee',
        category_id: 1,
        description: 'Updated Description',
        photo: 'https://test-url.com'
      };

      mockQuery.mockResolvedValue({ rows: [] }); // No committee found

      await updateCommittee(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Committee not found' });
    });

    test('should return 500 for database errors', async () => {
      req.params.id = '1'; // Set valid ID
      req.body = {
        name: 'Updated Committee',
        category_id: 1,
        description: 'Updated Description',
        photo: 'https://example.com/valid-image.jpg' // Valid URL to pass validation
      };

      // Mock the first query to pass validation, then fail on update
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Test Committee', image_url: 'https://example.com/different-image.jpg' }] }) // Check if committee exists
        .mockRejectedValueOnce(new Error('Database error')); // Fail on update

      await updateCommittee(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });

  describe('deleteCommittee', () => {
    test('should return 200 and delete committee successfully', async () => {
      req.params.id = '1';

      mockQuery
        .mockResolvedValueOnce({ rows: [] }) // Delete topics
        .mockResolvedValueOnce({ rows: [] }) // Delete committee
        .mockResolvedValueOnce({ rows: [] }); // Get all committees

      await deleteCommittee(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        committees: expect.any(Array),
        message: 'Committee deleted successfully'
      });
    });

    test('should return 400 for missing committee ID', async () => {
      req.params.id = '';

      await deleteCommittee(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Committee ID is required' });
    });

    test('should return 500 for database errors', async () => {
      req.params.id = '1';
      mockQuery.mockRejectedValue(new Error('Database error'));

      await deleteCommittee(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });

  describe('createCategory', () => {
    test('should return 201 and create category successfully', async () => {
      req.body = { title: 'New Category' };

      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 1, title: 'New Category' }] }) // Create category
        .mockResolvedValueOnce({ rows: [{ id: 1, title: 'New Category' }] }); // Get all categories

      await createCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        categories: expect.any(Array),
        newCategory: expect.any(Object),
        message: 'Category created successfully'
      });
    });

    test('should return 400 for missing title', async () => {
      req.body = { title: '' };

      await createCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Category title is required' });
    });

    test('should return 500 for database errors', async () => {
      req.body = { title: 'New Category' };
      mockQuery.mockRejectedValue(new Error('Database error'));

      await createCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });

  describe('updateCommitteePositions', () => {
    test('should return 200 and update positions successfully', async () => {
      req.body = {
        committees: [
          { id: 1, order_num: 1 },
          { id: 2, order_num: 2 }
        ]
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [] }) // Update position 1
        .mockResolvedValueOnce({ rows: [] }) // Update position 2
        .mockResolvedValueOnce({ rows: [] }); // Get all committees

      await updateCommitteePositions(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        committees: expect.any(Array),
        message: 'Committee positions updated successfully'
      });
    });

    test('should return 400 for invalid committees data', async () => {
      req.body = { committees: 'invalid' };

      await updateCommitteePositions(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid committees data' });
    });

    test('should return 500 for database errors', async () => {
      req.body = {
        committees: [{ id: 1, order_num: 1 }]
      };
      mockQuery.mockRejectedValue(new Error('Database error'));

      await updateCommitteePositions(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });
});
