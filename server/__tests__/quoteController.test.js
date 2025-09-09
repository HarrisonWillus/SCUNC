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
  getAllQuotes,
  addQuote,
  getQuotesByPersonId,
  updateQuote,
  deleteQuote
} = require('../controllers/quoteController');

describe('Quote Controller Tests', () => {
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

  describe('getAllQuotes', () => {
    test('should return 200 and quotes data with secretariate info', async () => {
      const mockQuotes = [
        {
          id: 1,
          title: 'Test Quote',
          quote: 'This is a test quote',
          name: 'John Doe',
          position: 'Secretary General',
          picture_url: 'https://test.com/image.jpg',
          person_id: 1,
          secretariate_name: 'John Doe',
          secretariate_title: 'Secretary General',
          secretariate_pfp_url: 'https://test.com/image.jpg'
        }
      ];

      mockQuery.mockResolvedValue({ rows: mockQuotes });

      await getAllQuotes(req, res);

      expect(res.json).toHaveBeenCalledWith(mockQuotes);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('SELECT'));
    });

    test('should return 500 for database errors', async () => {
      mockQuery.mockRejectedValue(new Error('Database error'));

      await getAllQuotes(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
    });
  });

  describe('addQuote', () => {
    test('should return 201 and create quote successfully with person_id', async () => {
      req.body = {
        title: 'New Quote',
        text: 'This is a new quote',
        person_id: 1
      };

      mockQuery
        .mockResolvedValueOnce({ 
          rows: [{ 
            name: 'John Doe', 
            title: 'Secretary General', 
            pfp_url: 'https://test.com/image.jpg' 
          }] 
        }) // Get secretariate data
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: 1, 
            title: 'Quote from John Doe',
            quote: 'This is a new quote',
            name: 'John Doe',
            position: 'Secretary General',
            picture_url: 'https://test.com/image.jpg',
            person_id: 1
          }] 
        }); // Insert quote

      await addQuote(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        id: 1,
        title: 'Quote from John Doe',
        quote: 'This is a new quote'
      }));
    });

    test('should return 201 and create quote successfully without person_id', async () => {
      req.body = {
        title: 'Manual Quote',
        text: 'This is a manual quote',
        name: 'Jane Smith',
        position: 'Advisor'
      };

      mockQuery.mockResolvedValue({ 
        rows: [{ 
          id: 1, 
          title: 'Manual Quote',
          quote: 'This is a manual quote',
          name: 'Jane Smith',
          position: 'Advisor',
          picture_url: null,
          person_id: null
        }] 
      });

      await addQuote(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Manual Quote',
        name: 'Jane Smith',
        position: 'Advisor'
      }));
    });

    test('should return 404 when secretariate not found', async () => {
      req.body = {
        title: 'New Quote',
        text: 'This is a new quote',
        person_id: 999
      };

      mockQuery.mockResolvedValue({ rows: [] }); // No secretariate found

      await addQuote(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'Secretariate not found with provided person_id' 
      });
    });

    test('should return 500 for database errors', async () => {
      req.body = {
        title: 'New Quote',
        text: 'This is a new quote'
      };

      mockQuery.mockRejectedValue(new Error('Database error'));

      await addQuote(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
    });
  });

  describe('getQuotesByPersonId', () => {
    test('should return 200 and quotes for specific person', async () => {
      req.params.person_id = '1';
      const mockQuotes = [
        {
          id: 1,
          title: 'Quote from John',
          quote: 'Test quote',
          person_id: 1,
          secretariate_name: 'John Doe'
        }
      ];

      mockQuery.mockResolvedValue({ rows: mockQuotes });

      await getQuotesByPersonId(req, res);

      expect(res.json).toHaveBeenCalledWith(mockQuotes);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE q.person_id = $1'),
        ['1']
      );
    });

    test('should return 500 for database errors', async () => {
      req.params.person_id = '1';
      mockQuery.mockRejectedValue(new Error('Database error'));

      await getQuotesByPersonId(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
    });
  });

  describe('updateQuote', () => {
    test('should return 200 and update quote successfully', async () => {
      req.params.id = '1';
      req.body = {
        title: 'Updated Quote',
        text: 'Updated text',
        name: 'Updated Name',
        position: 'Updated Position'
      };

      mockQuery.mockResolvedValue({ 
        rows: [{ 
          id: 1, 
          title: 'Updated Quote',
          quote: 'Updated text',
          name: 'Updated Name',
          position: 'Updated Position'
        }] 
      });

      await updateQuote(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        id: 1,
        title: 'Updated Quote',
        quote: 'Updated text'
      }));
    });

    test('should return 200 and update quote with person_id', async () => {
      req.params.id = '1';
      req.body = {
        title: 'Updated Quote',
        text: 'Updated text',
        person_id: 1
      };

      mockQuery
        .mockResolvedValueOnce({ 
          rows: [{ 
            name: 'John Doe', 
            title: 'Secretary General', 
            pfp_url: 'https://test.com/image.jpg' 
          }] 
        }) // Get secretariate data
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: 1, 
            title: 'Quote from John Doe',
            quote: 'Updated text'
          }] 
        }); // Update quote

      await updateQuote(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        id: 1,
        title: 'Quote from John Doe'
      }));
    });

    test('should return 404 when quote not found', async () => {
      req.params.id = '999';
      req.body = {
        title: 'Updated Quote',
        text: 'Updated text'
      };

      mockQuery.mockResolvedValue({ rows: [] }); // No quote found

      await updateQuote(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Quote not found' });
    });

    test('should return 404 when secretariate not found for person_id', async () => {
      req.params.id = '1';
      req.body = {
        title: 'Updated Quote',
        text: 'Updated text',
        person_id: 999
      };

      mockQuery.mockResolvedValue({ rows: [] }); // No secretariate found

      await updateQuote(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'Secretariate not found with provided person_id' 
      });
    });

    test('should return 500 for database errors', async () => {
      req.params.id = '1';
      req.body = {
        title: 'Updated Quote',
        text: 'Updated text'
      };

      mockQuery.mockRejectedValue(new Error('Database error'));

      await updateQuote(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
    });
  });

  describe('deleteQuote', () => {
    test('should return 200 and delete quote successfully', async () => {
      req.params.id = '1';

      mockQuery.mockResolvedValue({ 
        rows: [{ 
          id: 1, 
          title: 'Deleted Quote',
          quote: 'This quote was deleted'
        }] 
      });

      await deleteQuote(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: 'Quote deleted successfully',
        quote: expect.objectContaining({
          id: 1,
          title: 'Deleted Quote'
        })
      });
    });

    test('should return 404 when quote not found', async () => {
      req.params.id = '999';

      mockQuery.mockResolvedValue({ rows: [] }); // No quote found

      await deleteQuote(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Quote not found' });
    });

    test('should return 500 for database errors', async () => {
      req.params.id = '1';
      mockQuery.mockRejectedValue(new Error('Database error'));

      await deleteQuote(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
    });
  });
});
