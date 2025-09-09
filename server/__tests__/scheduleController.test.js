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
  getSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getDays,
  createDay,
  updateDay,
  deleteDay,
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent
} = require('../controllers/scheduleController');

describe('Schedule Controller Tests', () => {
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
      params: {},
      user: { isAdmin: true }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('getSchedule', () => {
    test('should return 200 and schedule data for admin', async () => {
      const mockSchedule = { id: 1, name: 'Test Schedule', is_published: true, release_date: '2025-01-01' };
      const mockDays = [{ id: 1, date: '2025-01-01', label: 'Day 1' }];
      const mockEvents = [{ id: 1, title: 'Test Event', start_time: '09:00', end_time: '10:00' }];

      mockQuery
        .mockResolvedValueOnce({ rows: [{ current_time: new Date() }] }) // Test query
        .mockResolvedValueOnce({ rows: [mockSchedule] }) // Schedule query
        .mockResolvedValueOnce({ rows: mockDays }) // Days query
        .mockResolvedValueOnce({ rows: mockEvents }); // Events query

      await getSchedule(req, res);

      expect(res.json).toHaveBeenCalledWith({
        id: 1,
        name: 'Test Schedule',
        is_published: true,
        release_date: '2025-01-01',
        days: [{
          id: 1,
          date: '2025-01-01',
          label: 'Day 1',
          events: mockEvents
        }]
      });
    });

    test('should return 404 when no schedule found', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ current_time: new Date() }] }) // Test query
        .mockResolvedValueOnce({ rows: [] }); // No schedule found

      await getSchedule(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Schedule not found',
        debug: expect.any(Object)
      });
    });

    test('should return 500 for database errors', async () => {
      mockQuery.mockRejectedValue(new Error('Database error'));

      await getSchedule(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to fetch schedule',
        debug: expect.any(Object)
      });
    });

    test('should filter schedule for non-admin users', async () => {
      req.user.isAdmin = false;
      const mockSchedule = { id: 1, name: 'Test Schedule', is_published: false, release_date: '2025-12-01' };

      mockQuery
        .mockResolvedValueOnce({ rows: [{ current_time: new Date() }] }) // Test query
        .mockResolvedValueOnce({ rows: [] }); // No visible schedule for non-admin

      await getSchedule(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('createSchedule', () => {
    test('should return 201 and create new schedule', async () => {
      req.body = {
        name: 'New Schedule',
        release_date: '2025-01-01'
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [] }) // No existing schedule
        .mockResolvedValueOnce({ rows: [{ id: 1, name: 'New Schedule', release_date: '2025-01-01' }] }); // Create schedule

      await createSchedule(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        id: 1,
        name: 'New Schedule'
      }));
    });

    test('should return 201 and update existing schedule', async () => {
      req.body = {
        name: 'Updated Schedule',
        release_date: '2025-01-01'
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Existing schedule
        .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Updated Schedule' }] }); // Update schedule

      await createSchedule(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Updated Schedule'
      }));
    });

    test('should return 400 for missing release_date', async () => {
      req.body = { name: 'New Schedule' };

      await createSchedule(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Release date is required' });
    });

    test('should return 500 for database errors', async () => {
      req.body = {
        name: 'New Schedule',
        release_date: '2025-01-01'
      };

      mockQuery.mockRejectedValue(new Error('Database error'));

      await createSchedule(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to create/update schedule' });
    });
  });

  describe('updateSchedule', () => {
    test('should return 200 and update schedule', async () => {
      req.body = {
        name: 'Updated Schedule',
        release_date: '2025-01-01',
        is_published: true
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Get schedule ID
        .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Updated Schedule', is_published: true }] }); // Update schedule

      await updateSchedule(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        id: 1,
        name: 'Updated Schedule',
        is_published: true
      }));
    });

    test('should return 404 when no schedule found', async () => {
      req.body = { name: 'Updated Schedule' };

      mockQuery.mockResolvedValue({ rows: [] }); // No schedule found

      await updateSchedule(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'No schedule found' });
    });

    test('should return 500 for database errors', async () => {
      req.body = { name: 'Updated Schedule' };

      mockQuery.mockRejectedValue(new Error('Database error'));

      await updateSchedule(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to update schedule' });
    });
  });

  describe('deleteSchedule', () => {
    test('should return 200 and reset schedule', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Get schedule ID
        .mockResolvedValueOnce({ rowCount: 5 }) // Delete events
        .mockResolvedValueOnce({ rowCount: 2 }) // Delete days
        .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Conference Schedule' }] }); // Reset schedule

      await deleteSchedule(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: 'Schedule reset successfully',
        schedule: expect.objectContaining({
          name: 'Conference Schedule'
        })
      });
    });

    test('should return 404 when no schedule found', async () => {
      mockQuery.mockResolvedValue({ rows: [] }); // No schedule found

      await deleteSchedule(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'No schedule found' });
    });

    test('should return 500 for database errors', async () => {
      mockQuery.mockRejectedValue(new Error('Database error'));

      await deleteSchedule(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to reset schedule' });
    });
  });

  describe('getDays', () => {
    test('should return 200 and days data', async () => {
      const mockDays = [
        { id: 1, date: '2025-01-01', label: 'Day 1', event_count: '3' },
        { id: 2, date: '2025-01-02', label: 'Day 2', event_count: '2' }
      ];

      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Get schedule ID
        .mockResolvedValueOnce({ rows: mockDays }); // Get days

      await getDays(req, res);

      expect(res.json).toHaveBeenCalledWith(mockDays);
    });

    test('should return 404 when no schedule found', async () => {
      mockQuery.mockResolvedValue({ rows: [] }); // No schedule found

      await getDays(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'No schedule found' });
    });

    test('should return 500 for database errors', async () => {
      mockQuery.mockRejectedValue(new Error('Database error'));

      await getDays(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch days' });
    });
  });

  describe('createDay', () => {
    test('should return 201 and create day', async () => {
      req.body = {
        date: '2025-01-01',
        label: 'Day 1'
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Get schedule ID
        .mockResolvedValueOnce({ rows: [{ id: 1, date: '2025-01-01', label: 'Day 1' }] }); // Create day

      await createDay(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        id: 1,
        date: '2025-01-01',
        label: 'Day 1'
      }));
    });

    test('should return 400 for missing date', async () => {
      req.body = { label: 'Day 1' };

      await createDay(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Date is required' });
    });

    test('should return 404 when no schedule found', async () => {
      req.body = { date: '2025-01-01', label: 'Day 1' };

      mockQuery.mockResolvedValue({ rows: [] }); // No schedule found

      await createDay(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'No schedule found' });
    });

    test('should return 500 for database errors', async () => {
      req.body = { date: '2025-01-01', label: 'Day 1' };

      mockQuery.mockRejectedValue(new Error('Database error'));

      await createDay(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to create day' });
    });
  });

  describe('updateDay', () => {
    test('should return 200 and update day', async () => {
      req.params.id = '1';
      req.body = {
        date: '2025-01-02',
        label: 'Updated Day'
      };

      mockQuery.mockResolvedValue({ rows: [{ id: 1, date: '2025-01-02', label: 'Updated Day' }] });

      await updateDay(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        id: 1,
        date: '2025-01-02',
        label: 'Updated Day'
      }));
    });

    test('should return 404 when day not found', async () => {
      req.params.id = '999';
      req.body = { date: '2025-01-02' };

      mockQuery.mockResolvedValue({ rows: [] });

      await updateDay(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Day not found' });
    });

    test('should return 500 for database errors', async () => {
      req.params.id = '1';
      req.body = { date: '2025-01-02' };

      mockQuery.mockRejectedValue(new Error('Database error'));

      await updateDay(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to update day' });
    });
  });

  describe('deleteDay', () => {
    test('should return 200 and delete day with events', async () => {
      req.params.id = '1';

      mockQuery
        .mockResolvedValueOnce({ rowCount: 3 }) // Delete events
        .mockResolvedValueOnce({ rows: [{ id: 1, date: '2025-01-01' }] }); // Delete day

      await deleteDay(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'Day deleted successfully' });
    });

    test('should return 404 when day not found', async () => {
      req.params.id = '999';

      mockQuery
        .mockResolvedValueOnce({ rowCount: 0 }) // Delete events (none found)
        .mockResolvedValueOnce({ rows: [] }); // Delete day (not found)

      await deleteDay(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Day not found' });
    });

    test('should return 500 for database errors', async () => {
      req.params.id = '1';

      mockQuery.mockRejectedValue(new Error('Database error'));

      await deleteDay(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to delete day' });
    });
  });

  describe('getEvents', () => {
    test('should return 200 and events for day', async () => {
      req.params.dayId = '1';
      const mockEvents = [
        { id: 1, title: 'Event 1', start_time: '09:00', end_time: '10:00' },
        { id: 2, title: 'Event 2', start_time: '10:00', end_time: '11:00' }
      ];

      mockQuery.mockResolvedValue({ rows: mockEvents });

      await getEvents(req, res);

      expect(res.json).toHaveBeenCalledWith(mockEvents);
    });

    test('should return 500 for database errors', async () => {
      req.params.dayId = '1';

      mockQuery.mockRejectedValue(new Error('Database error'));

      await getEvents(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch events' });
    });
  });

  describe('createEvent', () => {
    test('should return 201 and create event', async () => {
      req.params.dayId = '1';
      req.body = {
        title: 'New Event',
        start_time: '09:00',
        end_time: '10:00',
        location: 'Room A',
        description: 'Event description'
      };

      mockQuery.mockResolvedValue({ 
        rows: [{ 
          id: 1, 
          title: 'New Event',
          start_time: '09:00',
          end_time: '10:00',
          location: 'Room A',
          description: 'Event description'
        }] 
      });

      await createEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        id: 1,
        title: 'New Event'
      }));
    });

    test('should return 400 for missing required fields', async () => {
      req.params.dayId = '1';
      req.body = {
        title: 'New Event'
        // Missing start_time and end_time
      };

      await createEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'Title, start time, and end time are required' 
      });
    });

    test('should return 400 for invalid time range', async () => {
      req.params.dayId = '1';
      req.body = {
        title: 'New Event',
        start_time: '10:00',
        end_time: '09:00' // End before start
      };

      await createEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'End time must be after start time' 
      });
    });

    test('should return 500 for database errors', async () => {
      req.params.dayId = '1';
      req.body = {
        title: 'New Event',
        start_time: '09:00',
        end_time: '10:00'
      };

      mockQuery.mockRejectedValue(new Error('Database error'));

      await createEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to create event' });
    });
  });

  describe('updateEvent', () => {
    test('should return 200 and update event', async () => {
      req.params.id = '1';
      req.body = {
        title: 'Updated Event',
        start_time: '09:30',
        end_time: '10:30'
      };

      mockQuery.mockResolvedValue({ 
        rows: [{ 
          id: 1, 
          title: 'Updated Event',
          start_time: '09:30',
          end_time: '10:30'
        }] 
      });

      await updateEvent(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        id: 1,
        title: 'Updated Event'
      }));
    });

    test('should return 400 for invalid time range', async () => {
      req.params.id = '1';
      req.body = {
        start_time: '10:00',
        end_time: '09:00'
      };

      await updateEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'End time must be after start time' 
      });
    });

    test('should return 404 when event not found', async () => {
      req.params.id = '999';
      req.body = { title: 'Updated Event' };

      mockQuery.mockResolvedValue({ rows: [] });

      await updateEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Event not found' });
    });

    test('should return 500 for database errors', async () => {
      req.params.id = '1';
      req.body = { title: 'Updated Event' };

      mockQuery.mockRejectedValue(new Error('Database error'));

      await updateEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to update event' });
    });
  });

  describe('deleteEvent', () => {
    test('should return 200 and delete event', async () => {
      req.params.id = '1';

      mockQuery.mockResolvedValue({ 
        rows: [{ 
          id: 1, 
          title: 'Deleted Event'
        }] 
      });

      await deleteEvent(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'Event deleted successfully' });
    });

    test('should return 404 when event not found', async () => {
      req.params.id = '999';

      mockQuery.mockResolvedValue({ rows: [] });

      await deleteEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Event not found' });
    });

    test('should return 500 for database errors', async () => {
      req.params.id = '1';

      mockQuery.mockRejectedValue(new Error('Database error'));

      await deleteEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to delete event' });
    });
  });
});
