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
const mockRemove = jest.fn();
const mockSupabaseStorage = {
  from: jest.fn().mockReturnThis(),
  upload: mockUpload,
  getPublicUrl: mockGetPublicUrl,
  remove: mockRemove
};

jest.doMock('../config/supabaseClient', () => ({
  storage: mockSupabaseStorage
}));

// Import after mocking
const {
  getAllSecretariates,
  createSecretariate,
  updateSecretariate,
  deleteSecretariate
} = require('../controllers/secretariateController');

describe('Secretariate Controller Tests', () => {
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
    mockRemove.mockReset();
    
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

  describe('getAllSecretariates', () => {
    test('should return 200 and secretariates data', async () => {
      const mockSecretariates = [
        {
          id: 1,
          name: 'John Doe',
          title: 'Secretary General',
          description: 'Description here',
          pfp_url: 'https://test.com/image.jpg',
          order_num: 1
        },
        {
          id: 2,
          name: 'Jane Smith',
          title: 'Deputy Secretary General',
          description: 'Another description',
          pfp_url: 'https://test.com/image2.jpg',
          order_num: 2
        }
      ];

      mockQuery.mockResolvedValue({ rows: mockSecretariates });

      await getAllSecretariates(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        secretariate: mockSecretariates,
        message: 'Secretariates fetched successfully'
      });
    });

    test('should return 500 for database errors', async () => {
      mockQuery.mockRejectedValue(new Error('Database error'));

      await getAllSecretariates(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });

  describe('createSecretariate', () => {
    beforeEach(() => {
      mockUpload.mockResolvedValue({ data: { path: 'test-path' }, error: null });
      mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://test-url.com/image.jpg' } });
    });

    test('should return 201 and create secretariate with image upload', async () => {
      req.body = {
        name: 'John Doe',
        title: 'Secretary General',
        description: 'Experienced leader in Model UN',
        pfp: 'data:image/jpeg;name=profile.jpg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+WdNNlhd3wjlhW5GHaMPEuePjfUNExKyIJP/Z'
      };

      mockQuery
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: 1, 
            name: 'John Doe',
            title: 'Secretary General',
            description: 'Experienced leader in Model UN',
            pfp_url: 'https://test-url.com/image.jpg'
          }] 
        }) // Insert secretariate
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: 1, 
            name: 'John Doe' 
          }] 
        }); // Get all secretariates

      await createSecretariate(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        secretariate: expect.any(Array),
        message: 'Secretariate created successfully'
      });
    });

    test('should return 201 and create secretariate with default image', async () => {
      req.body = {
        name: 'John Doe',
        title: 'Secretary General',
        description: 'Experienced leader in Model UN'
        // No pfp provided
      };

      mockQuery
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: 1, 
            name: 'John Doe',
            pfp_url: 'https://czplyvbxvhcajpshwaos.supabase.co/storage/v1/object/public/secretariate-pfp/temporary_pfp.png'
          }] 
        })
        .mockResolvedValueOnce({ rows: [] });

      await createSecretariate(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        secretariate: expect.any(Array),
        message: 'Secretariate created successfully'
      });
    });

    test('should return 400 for missing required fields', async () => {
      req.body = {
        name: '',
        title: 'Secretary General',
        description: 'Description'
      };

      await createSecretariate(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Missing required fields' });
    });

    test('should return 500 for supabase upload errors', async () => {
      req.body = {
        name: 'John Doe',
        title: 'Secretary General',
        description: 'Description',
        pfp: 'data:image/jpeg;name=profile.jpg;base64,validdata'
      };

      mockUpload.mockResolvedValue({ data: null, error: { message: 'Upload failed' } });

      await createSecretariate(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });

    test('should return 500 for database errors', async () => {
      req.body = {
        name: 'John Doe',
        title: 'Secretary General',
        description: 'Description'
      };

      mockQuery.mockRejectedValue(new Error('Database error'));

      await createSecretariate(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });

  describe('updateSecretariate', () => {
    beforeEach(() => {
      req.params.id = '1';
      mockUpload.mockResolvedValue({ data: { path: 'test-path' }, error: null });
      mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://new-test-url.com/image.jpg' } });
    });

    test('should return 200 and update secretariate successfully', async () => {
      req.body = {
        name: 'Updated Name',
        title: 'Updated Title',
        description: 'Updated Description',
        pfp: 'https://old-url.com/image.jpg', // Same URL as current to avoid upload
        order_num: 2
      };

      mockQuery
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: 1, 
            name: 'Old Name',
            title: 'Old Title',
            description: 'Old Description',
            pfp_url: 'https://old-url.com/image.jpg',
            order_num: 1
          }] 
        }) // Current record
        .mockResolvedValueOnce({ rows: [] }) // Order swap function
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: 1, 
            name: 'Updated Name' 
          }] 
        }) // Update result
        .mockResolvedValueOnce({ rows: [] }); // Get all secretariates

      await updateSecretariate(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        secretariate: expect.any(Array),
        message: 'Secretariate updated successfully'
      });
    });

    test('should return 200 with no changes message when no updates needed', async () => {
      req.body = {
        name: 'Same Name',
        title: 'Same Title',
        description: 'Same Description',
        pfp: 'https://same-url.com/image.jpg',
        order_num: 1
      };

      mockQuery
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: 1, 
            name: 'Same Name',
            title: 'Same Title',
            description: 'Same Description',
            pfp_url: 'https://same-url.com/image.jpg',
            order_num: 1
          }] 
        }) // Current record (same data)
        .mockResolvedValueOnce({ rows: [] }); // Get all secretariates

      await updateSecretariate(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        secretariate: expect.any(Array),
        message: 'No changes detected'
      });
    });

    test('should return 404 for non-existent secretariate', async () => {
      req.body = {
        name: 'Updated Name',
        title: 'Updated Title'
      };

      mockQuery.mockResolvedValue({ rows: [] }); // No secretariate found

      await updateSecretariate(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Secretariate not found' });
    });

    test('should return 500 for database errors', async () => {
      req.body = {
        name: 'Updated Name',
        title: 'Updated Title'
      };

      mockQuery.mockResolvedValueOnce({ 
        rows: [{ 
          id: 1, 
          name: 'Old Name',
          title: 'Old Title',
          pfp_url: 'https://old-url.com/image.jpg'
        }] 
      }).mockRejectedValueOnce(new Error('Database error'));

      await updateSecretariate(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });

    test('should handle image upload during update', async () => {
      req.params.id = '1';
      req.body = {
        name: 'Old Name', // Same name to avoid other changes
        pfp: 'data:image/jpeg;name=new-profile.jpg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+WdNNlhd3wjlhW5GHaMPEuePjfUNExKyIJP/Z'
      };

      mockQuery
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: 1, 
            name: 'Old Name',
            pfp_url: null // Different from new pfp so upload will be triggered
          }] 
        })
        .mockResolvedValueOnce({ rows: [] }) // Update result
        .mockResolvedValueOnce({ rows: [] }); // Get all secretariates

      mockUpload.mockResolvedValue({ data: { path: 'new-profile.jpg' } });

      await updateSecretariate(req, res);

      expect(mockUpload).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('deleteSecretariate', () => {

    test('should return 200 and delete secretariate successfully', async () => {
      req.params.id = '1';
      mockQuery
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: 1, 
            name: 'John Doe',
            pfp_url: 'https://test.com/secretariate-pfp/profile.jpg'
          }] 
        }) // Get record for image URL
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: 1, 
            name: 'John Doe' 
          }] 
        }) // Delete secretariate
        .mockResolvedValueOnce({ rows: [] }); // Get all secretariates

      mockRemove.mockResolvedValue({ data: null, error: null });

      await deleteSecretariate(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        secretariate: expect.any(Array),
        message: 'Secretariate deleted successfully'
      });
      expect(mockRemove).toHaveBeenCalledWith(['profile.jpg']);
    });

    test('should return 200 and delete secretariate without image', async () => {
      req.params.id = '1';
      mockQuery
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: 1, 
            name: 'John Doe',
            pfp_url: null
          }] 
        })
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: 1, 
            name: 'John Doe' 
          }] 
        })
        .mockResolvedValueOnce({ rows: [] });

      await deleteSecretariate(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockRemove).not.toHaveBeenCalled();
    });

    test('should return 404 for non-existent secretariate', async () => {
      req.params.id = '1';
      mockQuery.mockResolvedValueOnce({ rows: [] }); // No secretariate found for initial check

      await deleteSecretariate(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Secretariate not found' });
    });

    test('should return 500 for database errors', async () => {
      req.params.id = '1';
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      await deleteSecretariate(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });

    test('should return 200 and delete secretariate without image', async () => {
      mockQuery
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: 1, 
            name: 'John Doe',
            pfp_url: null
          }] 
        })
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: 1, 
            name: 'John Doe' 
          }] 
        })
        .mockResolvedValueOnce({ rows: [] });

      // Reset the mock to ensure no previous calls affect this test
      mockRemove.mockClear();

      await deleteSecretariate(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockRemove).not.toHaveBeenCalled();
    });

    test('should return 404 for non-existent secretariate', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }); // No secretariate found for initial check

      await deleteSecretariate(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Secretariate not found' });
    });

    test('should return 500 for database errors', async () => {
      mockQuery.mockRejectedValue(new Error('Database error'));

      await deleteSecretariate(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });

    test('should continue deletion even if image removal fails', async () => {
      mockQuery
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: 1, 
            name: 'John Doe',
            pfp_url: 'https://test.com/secretariate-pfp/profile.jpg'
          }] 
        })
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: 1, 
            name: 'John Doe' 
          }] 
        })
        .mockResolvedValueOnce({ rows: [] });

      mockRemove.mockResolvedValue({ data: null, error: { message: 'File not found' } });

      await deleteSecretariate(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        secretariate: expect.any(Array),
        message: 'Secretariate deleted successfully'
      });
    });
  });
});
