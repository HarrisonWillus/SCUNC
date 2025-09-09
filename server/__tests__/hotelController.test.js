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
const mockDownload = jest.fn();
const mockList = jest.fn();
const mockSupabaseStorage = {
  from: jest.fn().mockReturnThis(),
  upload: mockUpload,
  getPublicUrl: mockGetPublicUrl,
  download: mockDownload,
  list: mockList
};

jest.doMock('../config/supabaseClient', () => ({
  storage: mockSupabaseStorage
}));

// Import after mocking
const {
  getAllHotels,
  getAllAmenities,
  createHotel,
  updateHotel,
  deleteHotel,
  getHotelById
} = require('../controllers/hotelController');

describe('Hotel Controller Tests', () => {
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

  describe('getAllHotels', () => {
    test('should return 200 and hotels data with amenities', async () => {
      const mockHotels = [
        {
          id: 1,
          name: 'Test Hotel',
          description: 'Test Description',
          picture_url: 'https://test.com/image.jpg',
          hotel_link: 'https://hotel.com',
          amenities: ['WiFi', 'Pool']
        }
      ];

      mockQuery.mockResolvedValue({ rows: mockHotels });

      await getAllHotels(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ hotels: mockHotels });
    });

    test('should return 500 for database errors', async () => {
      mockQuery.mockRejectedValue(new Error('Database error'));

      await getAllHotels(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });

  describe('getAllAmenities', () => {
    test('should return 200 and amenities data', async () => {
      const mockAmenities = [
        { id: 1, name: 'WiFi' },
        { id: 2, name: 'Pool' }
      ];

      mockQuery.mockResolvedValue({ rows: mockAmenities });

      await getAllAmenities(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ amenities: mockAmenities });
    });

    test('should return 500 for database errors', async () => {
      mockQuery.mockRejectedValue(new Error('Database error'));

      await getAllAmenities(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });

  describe('createHotel', () => {
    beforeEach(() => {
      mockUpload.mockResolvedValue({ data: { path: 'test-path' }, error: null });
      mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://test-url.com/image.jpg' } });
      mockList.mockResolvedValue({ data: [{ name: 'test-file.jpg' }], error: null });
      mockDownload.mockResolvedValue({ 
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
        size: 100,
        type: 'image/jpeg'
      });
    });

    test('should return 201 and create hotel successfully', async () => {
      req.body = {
        name: 'New Hotel',
        description: 'Hotel Description',
        image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+WdNNlhd3wjlhW5GHaMPEuePjfUNExKyIJP/Z',
        link: 'https://hotel.com',
        amenities: ['WiFi', 'Pool', 'Gym']
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Insert hotel
        .mockResolvedValueOnce({ rows: [] }) // Insert amenity 1
        .mockResolvedValueOnce({ rows: [] }) // Insert amenity 2
        .mockResolvedValueOnce({ rows: [] }) // Insert amenity 3
        .mockResolvedValueOnce({ rows: [{ id: 1, name: 'New Hotel' }] }); // Get all hotels

      await createHotel(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        hotels: expect.any(Array),
        message: 'Hotel created successfully'
      });
    });

    test('should return 400 for missing required fields', async () => {
      req.body = {
        name: '',
        description: 'Description',
        image: 'data:image/jpeg;base64,validdata',
        link: 'https://hotel.com',
        amenities: ['WiFi']
      };

      await createHotel(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Missing required fields' });
    });

    test('should return 500 for supabase upload errors', async () => {
      req.body = {
        name: 'New Hotel',
        description: 'Hotel Description',
        image: 'data:image/jpeg;base64,validdata',
        link: 'https://hotel.com',
        amenities: ['WiFi']
      };

      mockUpload.mockResolvedValue({ data: null, error: { message: 'Upload failed' } });

      await createHotel(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });

    test('should return 500 for database errors', async () => {
      req.body = {
        name: 'New Hotel',
        description: 'Hotel Description',
        image: 'data:image/jpeg;base64,validdata',
        link: 'https://hotel.com',
        amenities: ['WiFi']
      };

      mockQuery.mockRejectedValue(new Error('Database error'));

      await createHotel(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });

  describe('updateHotel', () => {
    beforeEach(() => {
      req.params.id = '1';
      mockUpload.mockResolvedValue({ data: { path: 'test-path' }, error: null });
      mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://test-url.com/image.jpg' } });
    });

    test('should return 200 and update hotel successfully', async () => {
      req.body = {
        name: 'Updated Hotel',
        description: 'Updated Description',
        image: 'https://old-url.com', // Same URL as current to avoid upload
        link: 'https://updated-hotel.com',
        amenities: ['Updated WiFi', 'Pool']
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [{ 
          id: 1, 
          name: 'Old Hotel', 
          description: 'Old Description', 
          hotel_link: 'https://old-hotel.com', 
          picture_url: 'https://old-url.com' 
        }] }) // Current hotel record
        .mockResolvedValueOnce({ rows: [{ id: 1, info: 'Old WiFi' }] }) // Current amenities record
        .mockResolvedValueOnce({ rows: [] }) // Delete existing amenities
        .mockResolvedValueOnce({ rows: [] }) // Insert new amenity 1
        .mockResolvedValueOnce({ rows: [] }) // Insert new amenity 2
        .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Updated Hotel' }] }) // Update result
        .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Updated Hotel' }] }); // Get all hotels

      await updateHotel(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        hotels: expect.any(Array),
        message: 'Hotel updated successfully'
      });
    });

    test('should return 404 for non-existent hotel', async () => {
      req.body = {
        name: 'Updated Hotel',
        amenities: ['WiFi']
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [] }) // No hotel found
        .mockResolvedValueOnce({ rows: [] }); // No amenities found (but this shouldn't be reached)

      await updateHotel(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Hotel not found' });
    });

    test('should return 200 with no changes message when no updates needed', async () => {
      req.body = {
        name: 'Same Hotel',
        description: 'Same Description',
        link: 'https://same-hotel.com',
        amenities: ['Same WiFi']
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [{ 
          id: 1, 
          name: 'Same Hotel', 
          description: 'Same Description',
          hotel_link: 'https://same-hotel.com',
          picture_url: 'https://same-url.com' 
        }] }) // Current hotel record (same data)
        .mockResolvedValueOnce({ rows: [{ id: 1, info: 'Same WiFi' }] }) // Current amenities record (same data)
        .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Same Hotel' }] }); // Get all hotels

      await updateHotel(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        hotels: expect.any(Array),
        message: 'No changes detected'
      });
    });

    test('should return 500 for database errors', async () => {
      req.body = {
        name: 'Updated Hotel',
        amenities: ['WiFi']
      };

      mockQuery.mockRejectedValue(new Error('Database error'));

      await updateHotel(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });

  describe('deleteHotel', () => {
    test('should return 200 and delete hotel successfully', async () => {
      req.params.id = '1';

      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Deleted Hotel' }] }) // Delete hotel
        .mockResolvedValueOnce({ rows: [] }); // Get remaining hotels

      await deleteHotel(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        hotels: expect.any(Array),
        message: 'Hotel deleted successfully'
      });
    });

    test('should return 404 for non-existent hotel', async () => {
      req.params.id = '999';

      mockQuery.mockResolvedValue({ rows: [] }); // No hotel found

      await deleteHotel(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Hotel not found' });
    });

    test('should return 500 for database errors', async () => {
      req.params.id = '1';
      mockQuery.mockRejectedValue(new Error('Database error'));

      await deleteHotel(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });

  describe('getHotelById', () => {
    test('should return 200 and hotel data', async () => {
      req.params.id = '1';
      const mockHotel = {
        id: 1,
        name: 'Test Hotel',
        description: 'Test Description',
        picture_url: 'https://test.com/image.jpg',
        hotel_link: 'https://hotel.com'
      };

      mockQuery.mockResolvedValue({ rows: [mockHotel] });

      await getHotelById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ hotel: mockHotel });
    });

    test('should return 404 for non-existent hotel', async () => {
      req.params.id = '999';

      mockQuery.mockResolvedValue({ rows: [] });

      await getHotelById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Hotel not found' });
    });

    test('should return 500 for database errors', async () => {
      req.params.id = '1';
      mockQuery.mockRejectedValue(new Error('Database error'));

      await getHotelById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });
});
