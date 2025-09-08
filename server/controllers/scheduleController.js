const pool = require('../config/db');

// =============================================================================
// SCHEDULE MANAGEMENT (Step 1)
// =============================================================================

// Get single schedule with all days and events
exports.getSchedule = async (req, res) => {
    console.log('GET SCHEDULE: Processing schedule retrieval request with user authorization');
    console.log('GET SCHEDULE: Validating user authorization and admin status');
    
    try {
        const isAdmin = req.user?.isAdmin || false;
        console.log('GET SCHEDULE: User authorization check completed successfully');
        
        // First, let's try a very simple approach to isolate the issue
        console.log('GET SCHEDULE: Testing database connection functionality');
        const testQuery = await pool.query('SELECT NOW() as current_time');
        console.log('GET SCHEDULE: Database connection verified and operational');
        
        // Get the single schedule info with minimal query
        console.log('GET SCHEDULE: Initiating basic schedule information retrieval from database');
        let scheduleQuery = 'SELECT id, name, is_published, release_date FROM schedule';
        if (!isAdmin) {
            scheduleQuery += ' WHERE is_published = true OR release_date <= NOW()';
            console.log('GET SCHEDULE: Applied visibility filter for non-admin user access');
        }
        scheduleQuery += ' LIMIT 1';
        
        console.log('GET SCHEDULE: Executing schedule data query against database');
        const scheduleResult = await pool.query(scheduleQuery);
        console.log('GET SCHEDULE: Schedule query completed with ' + scheduleResult.rows.length + ' records found');
        
        if (scheduleResult.rows.length === 0) {
            console.log('GET SCHEDULE: No schedule records found in database for current criteria\n');
            return res.status(404).json({ 
                error: 'Schedule not found',
                debug: { isAdmin, queryUsed: scheduleQuery }
            });
        }
        
        const schedule = scheduleResult.rows[0];
        console.log('GET SCHEDULE: Schedule data retrieved and parsed successfully');
        
        // Try simplified days query first
        console.log('GET SCHEDULE: Beginning days data retrieval with optimized query');
        const simpleDaysQuery = 'SELECT id, date, label FROM days WHERE schedule_id = $1 ORDER BY date';
        const daysResult = await pool.query(simpleDaysQuery, [schedule.id]);
        console.log('GET SCHEDULE: Days query completed with ' + daysResult.rows.length + ' day records found');
        
        // For each day, get events separately to avoid complex JSON aggregation
        const daysWithEvents = [];
        for (const day of daysResult.rows) {
            console.log('GET SCHEDULE: Processing events retrieval for day ID ' + day.id);
            const eventsQuery = 'SELECT id, title, start_time, end_time, location, description FROM events WHERE day_id = $1 ORDER BY start_time';
            const eventsResult = await pool.query(eventsQuery, [day.id]);
            
            daysWithEvents.push({
                ...day,
                events: eventsResult.rows
            });
            
            console.log('GET SCHEDULE: Day processing completed with ' + eventsResult.rows.length + ' events found');
        }
        
        const responseData = {
            id: schedule.id,
            name: schedule.name,
            is_published: schedule.is_published,
            release_date: schedule.release_date,
            days: daysWithEvents
        };
        
        console.log('GET SCHEDULE: Schedule data successfully compiled and prepared for response\n');
        
        res.json(responseData);
    } catch (error) {
        console.error('GET SCHEDULE: Database operation failed with error:', error.message);
        console.error('GET SCHEDULE: Complete error stack trace:', error.stack, '\n');
        
        // Send detailed error info for debugging
        res.status(500).json({ 
            error: 'Failed to fetch schedule',
            debug: {
                message: error.message,
                code: error.code,
                timestamp: new Date().toISOString()
            }
        });
    }
};

// Create or update the single schedule (Step 1)
exports.createSchedule = async (req, res) => {
    console.log('CREATE SCHEDULE: Processing schedule creation or update request');
    console.log('CREATE SCHEDULE: Received request data:', req.body);
    console.log('CREATE SCHEDULE: Authenticated user context:', req.user);
    
    try {
        const { name, release_date } = req.body;
        
        console.log('CREATE SCHEDULE: Parsed and validated input parameters:', {
            name: name,
            release_date: release_date,
            nameLength: name ? name.length : 0
        });
        
        if (!release_date) {
            console.log('CREATE SCHEDULE: Request validation failed due to missing release_date parameter\n');
            return res.status(400).json({ error: 'Release date is required' });
        }
        
        const scheduleData = {
            name: name || 'Conference Schedule',
            release_date: release_date
        };
        
        // Check if a schedule already exists
        console.log('CREATE SCHEDULE: Checking database for existing schedule records');
        const existingResult = await pool.query('SELECT id FROM schedule LIMIT 1');
        
        let result;
        if (existingResult.rows.length > 0) {
            // Update existing schedule
            const scheduleId = existingResult.rows[0].id;
            console.log('CREATE SCHEDULE: Existing schedule found, performing update operation for ID:', scheduleId);
            result = await pool.query(
                `UPDATE schedule 
                 SET name = $1, release_date = $2, updated_at = NOW() 
                 WHERE id = $3 RETURNING *`,
                [scheduleData.name, scheduleData.release_date, scheduleId]
            );
            console.log('CREATE SCHEDULE: Schedule record successfully updated in database');
        } else {
            // Create new schedule
            console.log('CREATE SCHEDULE: No existing schedule found, creating new schedule record');
            result = await pool.query(
                `INSERT INTO schedule (name, release_date, is_published, created_at, updated_at) 
                 VALUES ($1, $2, false, NOW(), NOW()) RETURNING *`,
                [scheduleData.name, scheduleData.release_date]
            );
            console.log('CREATE SCHEDULE: New schedule record successfully created in database');
        }
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('CREATE SCHEDULE: Database operation encountered error:', error);
        console.error('CREATE SCHEDULE: Complete error stack trace:', error.stack, '\n');
        res.status(500).json({ error: 'Failed to create/update schedule' });
    }
};

// Update the single schedule info
exports.updateSchedule = async (req, res) => {
    console.log('UPDATE SCHEDULE: Processing schedule modification request');
    console.log('UPDATE SCHEDULE: Received update data:', req.body);
    console.log('UPDATE SCHEDULE: Authenticated user context:', req.user);
    
    try {
        const { name, release_date, is_published } = req.body;
        
        console.log('UPDATE SCHEDULE: Parsed and validated update parameters:', {
            name: name,
            release_date: release_date,
            is_published: is_published,
            nameLength: name ? name.length : 0
        });
        
        // Get the single schedule ID
        const scheduleResult = await pool.query('SELECT id FROM schedule LIMIT 1');
        
        if (scheduleResult.rows.length === 0) {
            console.log('UPDATE SCHEDULE: No schedule record found in database for update operation\n');
            return res.status(404).json({ error: 'No schedule found' });
        }
        
        const scheduleId = scheduleResult.rows[0].id;
        console.log('UPDATE SCHEDULE: Located schedule record for update with ID:', scheduleId);
        
        console.log('UPDATE SCHEDULE: Executing database update query with new values');
        const result = await pool.query(
            `UPDATE schedule
             SET name = COALESCE($1, name), 
                 release_date = COALESCE($2, release_date), 
                 is_published = COALESCE($3, is_published),
                 updated_at = NOW()
             WHERE id = $4 RETURNING *`,
            [name, release_date, is_published, scheduleId]
        );
        
        console.log('UPDATE SCHEDULE: Schedule record successfully updated in database');
        console.log('UPDATE SCHEDULE: Updated schedule data returned:', result.rows[0], '\n');
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('UPDATE SCHEDULE: Database operation encountered error:', error);
        console.error('UPDATE SCHEDULE: Complete error stack trace:', error.stack, '\n');
        res.status(500).json({ error: 'Failed to update schedule' });
    }
};

// Reset the single schedule (clear all data but keep structure)
exports.deleteSchedule = async (req, res) => {
    console.log('DELETE SCHEDULE: Processing schedule reset and data cleanup request');
    console.log('DELETE SCHEDULE: Authenticated user context:', req.user);
    
    try {
        // Get the single schedule ID
        const scheduleResult = await pool.query('SELECT id FROM schedule LIMIT 1');
        
        if (scheduleResult.rows.length === 0) {
            console.log('DELETE SCHEDULE: No schedule record found in database for reset operation\n');
            return res.status(404).json({ error: 'No schedule found' });
        }
        
        const scheduleId = scheduleResult.rows[0].id;
        console.log('DELETE SCHEDULE: Located schedule for reset operation with ID:', scheduleId);
        console.log('DELETE SCHEDULE: Initiating cascading deletion of all associated days and events');
        
        // Delete in order: events -> days, but keep the schedule
        console.log('DELETE SCHEDULE: Step 1 - Removing all event records associated with schedule');
        const eventsResult = await pool.query('DELETE FROM events WHERE day_id IN (SELECT id FROM days WHERE schedule_id = $1)', [scheduleId]);
        console.log('DELETE SCHEDULE: Successfully deleted ' + eventsResult.rowCount + ' event records');
        
        console.log('DELETE SCHEDULE: Step 2 - Removing all day records for schedule');
        const daysResult = await pool.query('DELETE FROM days WHERE schedule_id = $1', [scheduleId]);
        console.log('DELETE SCHEDULE: Successfully deleted ' + daysResult.rowCount + ' day records');
        
        console.log('DELETE SCHEDULE: Step 3 - Resetting schedule to default configuration');
        const result = await pool.query(
            `UPDATE schedule 
             SET name = 'Conference Schedule', 
                 is_published = false, 
                 release_date = NOW() + INTERVAL '1 day',
                 updated_at = NOW()
             WHERE id = $1 RETURNING *`, 
            [scheduleId]
        );
        
        console.log('DELETE SCHEDULE: Schedule successfully reset to default state\n');
        
        res.json({ message: 'Schedule reset successfully', schedule: result.rows[0] });
    } catch (error) {
        console.error('DELETE SCHEDULE: Database operation encountered error during reset:', error);
        console.error('DELETE SCHEDULE: Complete error stack trace:', error.stack, '\n');
        res.status(500).json({ error: 'Failed to reset schedule' });
    }
};

// =============================================================================
// DAY MANAGEMENT (Step 2)
// =============================================================================

// Get days for the single schedule
exports.getDays = async (req, res) => {
    console.log('GET DAYS: Processing request to retrieve all days for schedule');
    console.log('GET DAYS: Authenticated user context:', req.user);
    
    try {
        // Get the single schedule ID
        const scheduleResult = await pool.query('SELECT id FROM schedule LIMIT 1');
        
        if (scheduleResult.rows.length === 0) {
            console.log('GET DAYS: No schedule record found in database\n');
            return res.status(404).json({ error: 'No schedule found' });
        }
        
        const scheduleId = scheduleResult.rows[0].id;
        console.log('GET DAYS: Located schedule for day retrieval with ID:', scheduleId);
        
        console.log('GET DAYS: Executing query to fetch all days with event counts');
        const result = await pool.query(
            `SELECT d.*, COUNT(e.id) as event_count
             FROM days d
             LEFT JOIN events e ON d.id = e.day_id
             WHERE d.schedule_id = $1
             GROUP BY d.id
             ORDER BY d.date`,
            [scheduleId]
        );
        
        console.log('GET DAYS: Query completed successfully with ' + result.rows.length + ' day records retrieved');
        console.log('GET DAYS: Day records summary:', result.rows.map(d => ({
            id: d.id,
            date: d.date,
            label: d.label,
            event_count: d.event_count
        })));
        
        res.json(result.rows);
    } catch (error) {
        console.error('GET DAYS: Database operation encountered error:', error);
        console.error('GET DAYS: Complete error stack trace:', error.stack, '\n');
        res.status(500).json({ error: 'Failed to fetch days' });
    }
};

// Create new day for the single schedule
exports.createDay = async (req, res) => {
    console.log('CREATE DAY: Processing new day creation request for schedule');
    console.log('CREATE DAY: Received day data:', req.body);
    console.log('CREATE DAY: Authenticated user context:', req.user);
    
    try {
        const { date, label } = req.body;
        
        console.log('CREATE DAY: Parsed and validated day creation parameters:', {
            date: date,
            label: label,
            labelLength: label ? label.length : 0
        });
        
        if (!date) {
            console.log('CREATE DAY: Request validation failed due to missing date parameter\n');
            return res.status(400).json({ error: 'Date is required' });
        }
        
        // Get the single schedule ID
        const scheduleResult = await pool.query('SELECT id FROM schedule LIMIT 1');
        
        if (scheduleResult.rows.length === 0) {
            console.log('CREATE DAY: No schedule record found in database for day creation\n');
            return res.status(404).json({ error: 'No schedule found' });
        }
        
        const scheduleId = scheduleResult.rows[0].id;
        console.log('CREATE DAY: Located parent schedule for day creation with ID:', scheduleId);
        
        console.log('CREATE DAY: Executing database insert query for new day record');
        const result = await pool.query(
            'INSERT INTO days (schedule_id, date, label, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
            [scheduleId, date, label]
        );
        
        console.log('CREATE DAY: Day record successfully created in database');
        console.log('CREATE DAY: New day assigned ID:', result.rows[0].id);
        console.log('CREATE DAY: Complete day record data:', result.rows[0]);
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('CREATE DAY: Database operation encountered error:', error);
        console.error('CREATE DAY: Complete error stack trace:', error.stack, '\n');
        res.status(500).json({ error: 'Failed to create day' });
    }
};

// Update day
exports.updateDay = async (req, res) => {
    console.log('UPDATE DAY: Processing day modification request');
    console.log('UPDATE DAY: Request parameters:', req.params);
    console.log('UPDATE DAY: Update data received:', req.body);
    console.log('UPDATE DAY: Authenticated user context:', req.user);
    
    try {
        const { id } = req.params;
        const { date, label } = req.body;
        
        console.log('UPDATE DAY: Parsed and validated update parameters:', {
            dayId: id,
            date: date,
            label: label,
            labelLength: label ? label.length : 0
        });
        
        console.log('UPDATE DAY: Executing database update query for day record');
        const result = await pool.query(
            'UPDATE days SET date = COALESCE($1, date), label = COALESCE($2, label) WHERE id = $3 RETURNING *',
            [date, label, id]
        );
        
        console.log('UPDATE DAY: Update query completed with ' + result.rows.length + ' records affected');
        
        if (result.rows.length === 0) {
            console.log('UPDATE DAY: No day record found with specified ID:', id, '\n');
            return res.status(404).json({ error: 'Day not found' });
        }
        
        console.log('UPDATE DAY: Day record successfully updated in database');
        console.log('UPDATE DAY: Updated day record data:', result.rows[0]);
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('UPDATE DAY: Database operation encountered error:', error);
        console.error('UPDATE DAY: Complete error stack trace:', error.stack, '\n');
        res.status(500).json({ error: 'Failed to update day' });
    }
};

// Delete day
exports.deleteDay = async (req, res) => {
    console.log('DELETE DAY: Processing day deletion request with cascading event removal');
    console.log('DELETE DAY: Request parameters:', req.params);
    console.log('DELETE DAY: Authenticated user context:', req.user);
    
    try {
        const { id } = req.params;
        
        console.log('DELETE DAY: Attempting to delete day record with ID:', id);
        console.log('DELETE DAY: This operation will cascade delete all associated events');
        
        // Delete events first, then day
        console.log('DELETE DAY: Step 1 - Removing all event records associated with day');
        const eventsResult = await pool.query('DELETE FROM events WHERE day_id = $1', [id]);
        console.log('DELETE DAY: Successfully deleted ' + eventsResult.rowCount + ' event records');
        
        console.log('DELETE DAY: Step 2 - Removing day record from database');
        const result = await pool.query('DELETE FROM days WHERE id = $1 RETURNING *', [id]);
        console.log('DELETE DAY: Day deletion query completed with ' + result.rows.length + ' records affected');
        
        if (result.rows.length === 0) {
            console.log('DELETE DAY: No day record found with specified ID:', id, '\n');
            return res.status(404).json({ error: 'Day not found' });
        }
        
        console.log('DELETE DAY: Day and associated events successfully deleted from database');
        console.log('DELETE DAY: Deleted day record data:', result.rows[0]);
        console.log('DELETE DAY: Deletion summary - Events removed:', eventsResult.rowCount, 'Days removed: 1');
        
        res.json({ message: 'Day deleted successfully' });
    } catch (error) {
        console.error('DELETE DAY: Database operation encountered error:', error);
        console.error('DELETE DAY: Complete error stack trace:', error.stack, '\n');
        res.status(500).json({ error: 'Failed to delete day' });
    }
};

// =============================================================================
// EVENT MANAGEMENT (Step 3)
// =============================================================================

// Get events for a day
exports.getEvents = async (req, res) => {
    console.log('GET EVENTS: Processing request to retrieve all events for specified day');
    console.log('GET EVENTS: Request parameters:', req.params);
    console.log('GET EVENTS: Authenticated user context:', req.user);
    
    try {
        const { dayId } = req.params;
        
        console.log('GET EVENTS: Searching for events associated with day ID:', dayId);
        
        console.log('GET EVENTS: Executing query to fetch all events ordered by start time');
        const result = await pool.query(
            'SELECT * FROM events WHERE day_id = $1 ORDER BY start_time',
            [dayId]
        );
        
        console.log('GET EVENTS: Query completed successfully with ' + result.rows.length + ' event records retrieved');
        console.log('GET EVENTS: Event records summary:', result.rows.map(e => ({
            id: e.id,
            title: e.title,
            start_time: e.start_time,
            end_time: e.end_time,
            location: e.location
        })));
        
        res.json(result.rows);
    } catch (error) {
        console.error('GET EVENTS: Database operation encountered error:', error);
        console.error('GET EVENTS: Complete error stack trace:', error.stack, '\n');
        res.status(500).json({ error: 'Failed to fetch events' });
    }
};

// Create new event
exports.createEvent = async (req, res) => {
    console.log('CREATE EVENT: Processing new event creation request for specified day');
    console.log('CREATE EVENT: Request parameters:', req.params);
    console.log('CREATE EVENT: Event data received:', req.body);
    console.log('CREATE EVENT: Authenticated user context:', req.user);
    
    try {
        const { dayId } = req.params;
        const { title, start_time, end_time, location, description } = req.body;
        
        console.log('CREATE EVENT: Parsed and validated event creation parameters:', {
            dayId: dayId,
            title: title,
            start_time: start_time,
            end_time: end_time,
            location: location,
            description: description,
            titleLength: title ? title.length : 0,
            descriptionLength: description ? description.length : 0
        });
        
        if (!title || !start_time || !end_time) {
            console.log('CREATE EVENT: Request validation failed due to missing required fields');
            console.log('CREATE EVENT: Missing field analysis:', {
                title: !title,
                start_time: !start_time,
                end_time: !end_time
            }, '\n');
            return res.status(400).json({ error: 'Title, start time, and end time are required' });
        }
        
        // Validate time logic
        if (start_time >= end_time) {
            console.log('CREATE EVENT: Request validation failed due to invalid time range');
            console.log('CREATE EVENT: Time validation details:', { start_time, end_time }, '\n');
            return res.status(400).json({ error: 'End time must be after start time' });
        }
        
        console.log('CREATE EVENT: Executing database insert query for new event record');
        const result = await pool.query(
            `INSERT INTO events (day_id, title, start_time, end_time, location, description, created_at) 
             VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
            [dayId, title, start_time, end_time, location, description]
        );
        
        console.log('CREATE EVENT: Event record successfully created in database');
        console.log('CREATE EVENT: New event assigned ID:', result.rows[0].id);
        console.log('CREATE EVENT: Complete event record data:', result.rows[0]);
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('CREATE EVENT: Database operation encountered error:', error);
        console.error('CREATE EVENT: Complete error stack trace:', error.stack, '\n');
        res.status(500).json({ error: 'Failed to create event' });
    }
};

// Update event
exports.updateEvent = async (req, res) => {
    console.log('UPDATE EVENT: Processing event modification request');
    console.log('UPDATE EVENT: Request parameters:', req.params);
    console.log('UPDATE EVENT: Update data received:', req.body);
    console.log('UPDATE EVENT: Authenticated user context:', req.user);
    
    try {
        const { id } = req.params;
        const { title, start_time, end_time, location, description } = req.body;

        console.log('UPDATE EVENT: Parsed and validated update parameters:', {
            eventId: id,
            title: title,
            start_time: start_time,
            end_time: end_time,
            location: location,
            description: description,
            titleLength: title ? title.length : 0,
            descriptionLength: description ? description.length : 0
        });
        
        // Validate time logic if both times are provided
        if (start_time && end_time && start_time >= end_time) {
            console.log('UPDATE EVENT: Request validation failed due to invalid time range');
            console.log('UPDATE EVENT: Time validation details:', { start_time, end_time }, '\n');
            return res.status(400).json({ error: 'End time must be after start time' });
        }

        console.log('UPDATE EVENT: Executing database update query for event record');
        const result = await pool.query(
            `UPDATE events 
             SET title = COALESCE($1, title),
                 start_time = COALESCE($2, start_time),
                 end_time = COALESCE($3, end_time),
                 location = COALESCE($4, location),
                 description = COALESCE($5, description)
             WHERE id = $6 RETURNING *`,
            [title, start_time, end_time, location, description, id]
        );
        
        console.log('UPDATE EVENT: Update query completed with ' + result.rows.length + ' records affected');
        
        if (result.rows.length === 0) {
            console.log('UPDATE EVENT: No event record found with specified ID:', id, '\n');
            return res.status(404).json({ error: 'Event not found' });
        }
        
        console.log('UPDATE EVENT: Event record successfully updated in database');
        console.log('UPDATE EVENT: Updated event record data:', result.rows[0]);
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('UPDATE EVENT: Database operation encountered error:', error);
        console.error('UPDATE EVENT: Complete error stack trace:', error.stack, '\n');
        res.status(500).json({ error: 'Failed to update event' });
    }
};

// Delete event
exports.deleteEvent = async (req, res) => {
    console.log('DELETE EVENT: Processing event deletion request');
    console.log('DELETE EVENT: Request parameters:', req.params);
    console.log('DELETE EVENT: Authenticated user context:', req.user);
    
    try {
        const { id } = req.params;
        
        console.log('DELETE EVENT: Attempting to delete event record with ID:', id);
        
        console.log('DELETE EVENT: Executing database delete query for event record');
        const result = await pool.query('DELETE FROM events WHERE id = $1 RETURNING *', [id]);
        
        console.log('DELETE EVENT: Delete query completed with ' + result.rows.length + ' records affected');
        
        if (result.rows.length === 0) {
            console.log('DELETE EVENT: No event record found with specified ID:', id, '\n');
            return res.status(404).json({ error: 'Event not found' });
        }
        
        console.log('DELETE EVENT: Event record successfully deleted from database');
        console.log('DELETE EVENT: Deleted event record data:', result.rows[0]);
        
        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('DELETE EVENT: Database operation encountered error:', error);
        console.error('DELETE EVENT: Complete error stack trace:', error.stack, '\n');
        res.status(500).json({ error: 'Failed to delete event' });
    }
};